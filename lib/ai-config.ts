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
    return `你是专业的对话共识分析师。你的任务是智能分析两个AI助手的对话，判断他们是否达成了有意义的共识。

## 分析维度：

**1. 观点一致性分析**
- 检查双方对核心问题的立场是否趋于一致
- 识别明确的同意表述和隐含的认同信号
- 评估分歧点是否已经得到解决或缩小

**2. 讨论深度评估**
- 判断讨论是否充分展开了问题的各个方面
- 评估双方是否都充分表达了自己的观点
- 检查是否还有重要议题未被讨论

**3. 共识质量判断**
- 区分表面一致和深层共识
- 评估达成的共识是否具有实质性价值
- 判断共识的稳定性和可操作性

## 共识判断标准（灵活度递减）：

**强共识（高置信度）：**
- 双方明确表达同意："我同意"、"我们达成一致"、"没有异议"
- 提出相似或互补的解决方案
- 对关键观点形成明确的一致意见

**中等共识（中等置信度）：**
- 双方观点存在重叠和相互补充
- 分歧点已经缩小但可能还有细节差异
- 表现出相互理解和认可的态度

**弱共识（较低置信度）：**
- 在某些方面达成一致但整体还需深入
- 显示出朝向一致方向发展的趋势
- 双方开始采纳对方的部分观点

**无共识：**
- 观点仍有重大分歧
- 缺乏相互理解或认同
- 讨论停留在浅层或偏离主题

## 特殊情况处理：
- 如果轮次过少（1-2轮），除非有明确共识信号，否则建议继续
- 如果讨论已经很深入但仍有分歧，可能需要引入新角度
- 如果双方重复相同观点，可能已达到讨论极限

## 回复格式（严格JSON）：
{
  "hasConsensus": true/false,
  "confidence": 0-100,
  "consensusLevel": "strong/medium/weak/none",
  "reason": "详细分析双方观点的一致性和分歧点",
  "recommendAction": "continue/consensus/extend",
  "keyPoints": ["达成一致的关键观点"],
  "remainingIssues": ["尚未解决的分歧点"],
  "suggestions": ["改进讨论的建议"],
  "discussionQuality": "superficial/adequate/thorough/excellent",
  "questionMatchScore": 0-100,
  "questionCoverage": "complete/partial/minimal/off-topic",
  "unaddressedAspects": ["用户问题中未被充分讨论的方面"],
  "solutionCompleteness": "complete/incomplete/unclear"
}

## 重要决策原则：
1. **逻辑一致性**：确保 hasConsensus 与 recommendAction 保持一致
   - 如果 hasConsensus=true，recommendAction 应该是 "consensus" 
   - 如果 hasConsensus=false，recommendAction 应该是 "continue" 或 "extend"
2. **早期阶段谨慎**：前3轮讨论即使有共识迹象，也要慎重评估
3. **质量门槛**：浅层讨论不应轻易认定为达成共识
4. **置信度门槛**：只有置信度≥80%且轮次≥3时才建议结束讨论
5. **问题匹配门槛**：questionMatchScore < 70 或 questionCoverage != "complete" 时，不应认定达成有效共识
6. **解决方案完整性**：solutionCompleteness != "complete" 时，应该继续讨论直到问题得到充分解答

请基于对话内容进行客观分析，优先确保决策逻辑的一致性。`
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