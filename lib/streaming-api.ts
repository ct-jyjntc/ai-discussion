import { AI_A_CONFIG, AI_B_CONFIG, CONSENSUS_CONFIG, generateSystemPrompt } from "./ai-config"

export interface StreamingResponse {
  content: string
  isComplete: boolean
}

// 模拟流式传输的函数
export async function callAIStreaming(
  config: typeof AI_A_CONFIG,
  systemPrompt: string,
  userPrompt: string,
  onChunk: (chunk: string, isComplete: boolean) => void
): Promise<string> {
  const requestBody = {
    model: config.model,
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user", 
        content: userPrompt
      }
    ],
    temperature: 0.7,
    stream: true // 启用流式传输
  }

  console.log(`Calling ${config.name} API with streaming:`, config.apiUrl)

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`${config.name} API调用失败: ${response.status} ${response.statusText}`)
    }

    // 如果API不支持流式传输，回退到普通调用
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('text/event-stream') && !contentType?.includes('application/x-ndjson')) {
      console.log(`${config.name} 不支持流式传输，使用普通模式`)
      const responseText = await response.text()
      
      try {
        const jsonData = JSON.parse(responseText)
        let fullContent = ""
        
        if (jsonData.choices && jsonData.choices[0]) {
          if (jsonData.choices[0].message && jsonData.choices[0].message.content) {
            fullContent = jsonData.choices[0].message.content
          } else if (jsonData.choices[0].text) {
            fullContent = jsonData.choices[0].text
          }
        }
        
        // 模拟流式效果
        await simulateStreaming(fullContent, onChunk)
        return fullContent
      } catch (parseError) {
        await simulateStreaming(responseText, onChunk)
        return responseText
      }
    }

    // 处理真正的流式响应
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("无法获取响应流")
    }

    const decoder = new TextDecoder()
    let fullContent = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          onChunk(fullContent, true)
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              onChunk(fullContent, true)
              return fullContent
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                const deltaContent = parsed.choices[0].delta.content || ""
                fullContent += deltaContent
                onChunk(fullContent, false)
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    return fullContent
  } catch (error: any) {
    console.error(`${config.name} 流式API错误:`, error)
    throw new Error(`${config.name} 流式调用出错: ${error.message}`)
  }
}

// 模拟流式传输效果
async function simulateStreaming(fullText: string, onChunk: (chunk: string, isComplete: boolean) => void) {
  const words = fullText.split('')
  let currentText = ""
  
  for (let i = 0; i < words.length; i++) {
    currentText += words[i]
    onChunk(currentText, false)
    
    // 控制流式速度
    if (i % 3 === 0) { // 每3个字符暂停一次
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
  
  onChunk(currentText, true)
}

// 流式分析问题
export async function analyzeQuestionStreaming(
  question: string, 
  round: number,
  onChunk: (chunk: string, isComplete: boolean) => void,
  previousDiscussion = ""
): Promise<string> {
  const systemPrompt = generateSystemPrompt(AI_A_CONFIG, 'ai_a', round)
  let userPrompt = `用户问题："${question}"`
  
  if (previousDiscussion) {
    userPrompt += `\n\n之前的讨论：\n${previousDiscussion}\n\n请继续讨论，提出你的观点。`
  } else {
    userPrompt += `\n\n请开始分析这个问题，提出你的初步观点。`
  }

  return await callAIStreaming(AI_A_CONFIG, systemPrompt, userPrompt, onChunk)
}

// 流式AI讨论
export async function aiDiscussionStreaming(
  question: string,
  aiAResponse: string,
  round: number,
  onChunk: (chunk: string, isComplete: boolean) => void,
  fullDiscussion = ""
): Promise<string> {
  const systemPrompt = generateSystemPrompt(AI_B_CONFIG, 'ai_b', round)
  const userPrompt = `用户问题："${question}"

${AI_A_CONFIG.name}的观点：
${aiAResponse}

${fullDiscussion ? `\n完整讨论历史：\n${fullDiscussion}\n` : ''}

请回应${AI_A_CONFIG.name}的观点，继续讨论。`

  return await callAIStreaming(AI_B_CONFIG, systemPrompt, userPrompt, onChunk)
}

// 流式继续讨论
export async function continueDiscussionStreaming(
  question: string,
  fullDiscussion: string,
  round: number,
  isAiA: boolean,
  onChunk: (chunk: string, isComplete: boolean) => void
): Promise<string> {
  const config = isAiA ? AI_A_CONFIG : AI_B_CONFIG
  const role = isAiA ? 'ai_a' : 'ai_b'
  const systemPrompt = generateSystemPrompt(config, role, round)

  const userPrompt = `用户问题："${question}"

完整讨论历史：
${fullDiscussion}

请继续讨论，提出你的进一步观点。`

  return await callAIStreaming(config, systemPrompt, userPrompt, onChunk)
}

// 流式生成共识答案
export async function generateConsensusAnswerStreaming(
  question: string,
  fullDiscussion: string,
  onChunk: (chunk: string, isComplete: boolean) => void
): Promise<string> {
  const systemPrompt = generateSystemPrompt(CONSENSUS_CONFIG, 'consensus', 1)
  const userPrompt = `用户问题："${question}"

${AI_A_CONFIG.name}和${AI_B_CONFIG.name}的完整讨论：
${fullDiscussion}

请基于他们的讨论，生成最终的共识答案。`

  return await callAIStreaming(CONSENSUS_CONFIG, systemPrompt, userPrompt, onChunk)
}