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
    } as AIConfig
  }
}

// 导出获取配置的函数
export function getAIConfig(type: 'ai_a' | 'ai_b' | 'consensus'): AIConfig {
  const configs = getAIConfigs()
  switch (type) {
    case 'ai_a':
      return configs.AI_A_CONFIG
    case 'ai_b':
      return configs.AI_B_CONFIG
    case 'consensus':
      return configs.CONSENSUS_CONFIG
  }
}

// 为了向后兼容，保留原来的导出方式（仅在服务器端可用）
export const AI_A_CONFIG = new Proxy({} as AIConfig, {
  get(target, prop) {
    const config = getAIConfig('ai_a')
    return (config as any)[prop]
  }
})

export const AI_B_CONFIG = new Proxy({} as AIConfig, {
  get(target, prop) {
    const config = getAIConfig('ai_b')
    return (config as any)[prop]
  }
})

export const CONSENSUS_CONFIG = new Proxy({} as AIConfig, {
  get(target, prop) {
    const config = getAIConfig('consensus')
    return (config as any)[prop]
  }
})

// 个性化系统提示词生成器
export function generateSystemPrompt(config: AIConfig, role: 'ai_a' | 'ai_b' | 'consensus', round: number): string {
  const personalities = config.personality.split(',')
  
  if (role === 'ai_a') {
    return `你是${config.name}。你的特点是${personalities.join('、')}。你的任务是与${AI_B_CONFIG.name}进行对话讨论，共同解决用户的问题。请用中文回复。

对话规则：
1. 你需要提出自己的观点和分析
2. 认真考虑对方的意见
3. 如果有分歧，要说明理由
4. 如果同意对方观点，要明确表示
5. 最终目标是达成共识

这是第${round}轮讨论。发挥你${personalities.join('、')}的特长。`
  }
  
  if (role === 'ai_b') {
    return `你是${config.name}。你的特点是${personalities.join('、')}。你的任务是与${AI_A_CONFIG.name}进行对话讨论，共同解决用户的问题。请用中文回复。

对话规则：
1. 仔细阅读${AI_A_CONFIG.name}的观点
2. 提出你的看法，可以同意、补充或反驳
3. 如果有分歧，要说明理由和依据
4. 如果认为讨论已经充分，说出"我们达成共识"
5. 如果需要继续讨论，提出新的观点或问题

这是第${round}轮讨论。发挥你${personalities.join('、')}的特长。`
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
  
  return ""
}

// 通用API调用函数
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