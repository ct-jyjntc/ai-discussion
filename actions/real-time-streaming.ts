"use server"

import { AI_A_CONFIG, AI_B_CONFIG, CONSENSUS_CONFIG, generateSystemPrompt } from "@/lib/ai-config"

// 创建流式传输响应
function createStreamResponse(generator: AsyncGenerator<string, void, unknown>) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
          controller.enqueue(encoder.encode(data))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (error) {
        controller.error(error)
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}

// 流式AI调用生成器
async function* streamAIResponse(
  config: typeof AI_A_CONFIG,
  systemPrompt: string,
  userPrompt: string
): AsyncGenerator<string, void, unknown> {
  const requestBody = {
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    stream: true
  }

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
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              
              if (data === '[DONE]') {
                return
              }

              try {
                const json = JSON.parse(data)
                const content = json.choices?.[0]?.delta?.content || ''
                
                if (content) {
                  yield content
                }
              } catch (parseError) {
                continue
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    }
  } catch (error: any) {
    throw new Error(`AI调用出错: ${error.message}`)
  }
}

// 流式分析问题
export async function streamAnalyzeQuestion(question: string, round: number = 1) {
  const systemPrompt = generateSystemPrompt(AI_A_CONFIG, 'ai_a', round)
  const userPrompt = `用户问题："${question}"\n\n请开始分析这个问题，提出你的初步观点。`
  
  const generator = streamAIResponse(AI_A_CONFIG, systemPrompt, userPrompt)
  return createStreamResponse(generator)
}

// 流式AI讨论
export async function streamAIDiscussion(
  question: string,
  aiAResponse: string,
  round: number,
  fullDiscussion: string = ""
) {
  const systemPrompt = generateSystemPrompt(AI_B_CONFIG, 'ai_b', round)
  const userPrompt = `用户问题："${question}"

${AI_A_CONFIG.name}的观点：
${aiAResponse}

${fullDiscussion ? `\n完整讨论历史：\n${fullDiscussion}\n` : ''}

请回应${AI_A_CONFIG.name}的观点，继续讨论。`

  const generator = streamAIResponse(AI_B_CONFIG, systemPrompt, userPrompt)
  return createStreamResponse(generator)
}

// 流式继续讨论
export async function streamContinueDiscussion(
  question: string,
  fullDiscussion: string,
  round: number,
  isAiA: boolean = true
) {
  const config = isAiA ? AI_A_CONFIG : AI_B_CONFIG
  const role = isAiA ? 'ai_a' : 'ai_b'
  const systemPrompt = generateSystemPrompt(config, role, round)

  const userPrompt = `用户问题："${question}"

完整讨论历史：
${fullDiscussion}

请继续讨论，提出你的进一步观点。`

  const generator = streamAIResponse(config, systemPrompt, userPrompt)
  return createStreamResponse(generator)
}

// 流式生成共识答案
export async function streamGenerateConsensusAnswer(
  question: string,
  fullDiscussion: string
) {
  const systemPrompt = generateSystemPrompt(CONSENSUS_CONFIG, 'consensus', 1)
  const userPrompt = `用户问题："${question}"

${AI_A_CONFIG.name}和${AI_B_CONFIG.name}的完整讨论：
${fullDiscussion}

请基于他们的讨论，生成最终的共识答案。`

  const generator = streamAIResponse(CONSENSUS_CONFIG, systemPrompt, userPrompt)
  return createStreamResponse(generator)
}
