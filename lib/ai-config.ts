// AI配置管理模块
import { getEnvConfig } from './env-validation'

export interface AIConfig {
  apiUrl: string
  apiKey: string
  model: string
  name: string
  personality: string
}

// 延迟初始化配置（仅在服务器端调用时）
function getAIConfigs() {
  const ENV_CONFIG = getEnvConfig()
  
  return {
    AI_A_CONFIG: {
      apiUrl: ENV_CONFIG.AI_A_API_URL,
      apiKey: ENV_CONFIG.AI_A_API_KEY,
      model: ENV_CONFIG.AI_A_MODEL,
      name: ENV_CONFIG.AI_A_NAME,
      personality: ENV_CONFIG.AI_A_PERSONALITY
    } as AIConfig,
    
    AI_B_CONFIG: {
      apiUrl: ENV_CONFIG.AI_B_API_URL,
      apiKey: ENV_CONFIG.AI_B_API_KEY,
      model: ENV_CONFIG.AI_B_MODEL,
      name: ENV_CONFIG.AI_B_NAME,
      personality: ENV_CONFIG.AI_B_PERSONALITY
    } as AIConfig,
    
    CONSENSUS_CONFIG: {
      apiUrl: ENV_CONFIG.CONSENSUS_API_URL,
      apiKey: ENV_CONFIG.CONSENSUS_API_KEY,
      model: ENV_CONFIG.CONSENSUS_MODEL,
      name: "共识生成器",
      personality: "objective,balanced,comprehensive"
    } as AIConfig,

    CONSENSUS_DETECTOR_CONFIG: {
      apiUrl: ENV_CONFIG.CONSENSUS_DETECTOR_API_URL,
      apiKey: ENV_CONFIG.CONSENSUS_DETECTOR_API_KEY,
      model: ENV_CONFIG.CONSENSUS_DETECTOR_MODEL,
      name: "共识检测器",
      personality: "analytical,precise,impartial"
    } as AIConfig
  }
}

// 导出配置
const configs = getAIConfigs()
export const AI_A_CONFIG = configs.AI_A_CONFIG
export const AI_B_CONFIG = configs.AI_B_CONFIG
export const CONSENSUS_CONFIG = configs.CONSENSUS_CONFIG
export const CONSENSUS_DETECTOR_CONFIG = configs.CONSENSUS_DETECTOR_CONFIG

// 个性化系统提示词生成器
export function generateSystemPrompt(config: AIConfig, role: 'ai_a' | 'ai_b' | 'consensus' | 'consensus_detector', round: number): string {
  const personalities = config.personality.split(',')
  
  if (role === 'ai_a') {
    return `你是${config.name}。你的特点是${personalities.join('、')}。你的任务是与${AI_B_CONFIG.name}进行对话讨论，共同解决用户的问题。请用中文回复。

对话规则：
1. 提出你的观点时要清晰明确
2. 对${AI_B_CONFIG.name}的观点要明确表态：完全同意/部分同意/不同意
3. 如果同意，请明确说"我同意你的观点"或"我们在这点上达成了一致"
4. 如果不同意，要详细说明分歧所在和你的理由
5. 如果认为双方已经充分讨论并达成一致，明确说出"我认为我们已经达成共识"
6. 每次回复都要明确你对对方最新观点的态度

这是第${round}轮讨论。发挥你${personalities.join('、')}的特长，确保明确表达你的立场。`
  }
  
  if (role === 'ai_b') {
    return `你是${config.name}。你的特点是${personalities.join('、')}。你的任务是与${AI_A_CONFIG.name}进行对话讨论，共同解决用户的问题。请用中文回复。

对话规则：
1. 仔细分析${AI_A_CONFIG.name}的观点
2. 明确表态：完全同意/部分同意/不同意，并说明原因
3. 如果同意，请明确说"我同意你的观点"或"我们在这点上达成了一致"
4. 如果有分歧，详细阐述你的不同看法和理由
5. 如果认为双方已经充分讨论并达成一致，明确说出"我认为我们已经达成共识"
6. 每次回复都要明确你对对方最新观点的态度

这是第${round}轮讨论。发挥你${personalities.join('、')}的特长，确保明确表达你的立场。`
  }
  
  if (role === 'consensus') {
    return `你是总结AI。请基于${AI_A_CONFIG.name}和${AI_B_CONFIG.name}的完整讨论，生成最终的共识答案。请用中文回复。

要求：
1. 综合两个AI的观点
2. 突出他们达成的共识
3. 提供完整、准确的最终答案
4. 如果有不同观点，要平衡表述
5. 确保答案完整，不被截断

两个AI的特点：
- ${AI_A_CONFIG.name}: ${AI_A_CONFIG.personality.split(',').join('、')}
- ${AI_B_CONFIG.name}: ${AI_B_CONFIG.personality.split(',').join('、')}`
  }

  if (role === 'consensus_detector') {
    return `你是专业的共识检测AI。你的任务是分析两个AI助手的最新对话，判断他们是否真正达成了共识。

分析重点：
1. 重点关注最新两轮对话内容
2. 检查双方是否明确表达了同意对方的观点
3. 寻找"我同意"、"我们达成一致"、"我认为我们已经达成共识"等明确表态
4. 判断是否还存在未解决的分歧

严格的共识判断标准：
- 双方都明确表示同意对方的观点
- 没有任何未解决的重大分歧
- 至少有一方明确说出"达成共识"相关表述
- 双方的观点可以合并为一致的结论

回复格式（必须是严格的JSON格式）：
{
  "hasConsensus": true/false,
  "confidence": 0-100的数字,
  "reason": "详细的判断理由，重点说明双方的表态",
  "recommendAction": "continue/consensus",
  "keyPoints": ["双方一致的关键观点1", "双方一致的关键观点2"],
  "suggestions": ["如果需要继续讨论的建议"]
}

请确保回复是有效的JSON格式，不要添加任何其他文字。只有当双方明确表达同意并且没有分歧时才判断为达成共识。`
  }
  
  return ""
}

// 通用API调用函数（非流式）
export async function callAI(config: AIConfig, systemPrompt: string, userPrompt: string): Promise<string> {
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
    temperature: 0.7
  }

  console.log(`Calling ${config.name} API:`, config.apiUrl)
  console.log("Request headers:", {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${config.apiKey.substring(0, 8)}...`,
    "Accept": "application/json"
  })
  console.log("Request body:", JSON.stringify(requestBody, null, 2))

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log(`${config.name} response status:`, response.status, response.statusText)
    const responseText = await response.text()
    console.log(`${config.name} response:`, responseText)

    if (response.ok && responseText.trim()) {
      // 尝试解析JSON响应
      try {
        const jsonData = JSON.parse(responseText)
        console.log(`${config.name} parsed JSON:`, jsonData)
        
        // 提取内容
        if (jsonData.choices && jsonData.choices[0]) {
          if (jsonData.choices[0].message && jsonData.choices[0].message.content) {
            return jsonData.choices[0].message.content
          } else if (jsonData.choices[0].text) {
            return jsonData.choices[0].text
          }
        }
        
        if (jsonData.response) {
          return jsonData.response
        }
        
        if (jsonData.content) {
          return jsonData.content
        }
        
        if (jsonData.text) {
          return jsonData.text
        }
        
        // 如果无法解析内容结构，返回原始响应
        return responseText.trim()
      } catch (parseError: any) {
        console.log(`${config.name} JSON parse failed:`, parseError.message)
        // 如果不是JSON，返回原始文本
        return responseText.trim()
      }
    }

    throw new Error(`${config.name} API调用失败: ${response.status} ${response.statusText}`)
  } catch (error: any) {
    console.error(`${config.name} API错误:`, error)
    throw new Error(`${config.name} API调用出错: ${error.message}`)
  }
}

// 流式API调用函数
export async function callAIStreaming(
  config: AIConfig, 
  systemPrompt: string, 
  userPrompt: string,
  onChunk?: (chunk: string) => void
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
    stream: true
  }

  console.log(`Calling ${config.name} API (streaming):`, config.apiUrl)
  console.log("Request headers:", {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${config.apiKey.substring(0, 8)}...`,
    "Accept": "text/event-stream"
  })
  console.log("Request body:", JSON.stringify(requestBody, null, 2))

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

    console.log(`${config.name} response status:`, response.status, response.statusText)
    console.log(`${config.name} response headers:`, Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      // 尝试读取错误响应体
      const errorText = await response.text()
      console.error(`${config.name} error response:`, errorText)
      throw new Error(`${config.name} API调用失败: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ""

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
                break
              }

              try {
                const json = JSON.parse(data)
                const content = json.choices?.[0]?.delta?.content || ''
                
                if (content) {
                  fullContent += content
                  onChunk?.(content)
                }
              } catch (parseError) {
                // 忽略解析错误的数据块
                continue
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    }

    return fullContent
  } catch (error: any) {
    console.error(`${config.name} API错误:`, error)
    throw new Error(`${config.name} API调用出错: ${error.message}`)
  }
}