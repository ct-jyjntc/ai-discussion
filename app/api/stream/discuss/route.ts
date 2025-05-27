import { NextRequest } from 'next/server'
import { AI_B_CONFIG, generateEnhancedSystemPrompt, callAIStreaming } from '@/lib/ai-config'
import { cacheManager } from '@/lib/cache-manager'

export async function POST(request: NextRequest) {
  try {
    const { question, aiAResponse, round, fullDiscussion } = await request.json()
    
    // 智能缓存检查
    const cacheKey = `discuss:${question}:${round}:${aiAResponse.slice(0, 50)}`
    const cachedResult = cacheManager.get<string>(cacheKey)
    
    if (cachedResult) {
      // 返回缓存的讨论内容
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const chunks = cachedResult.split(' ')
          let index = 0
          
          const sendChunk = () => {
            if (index < chunks.length) {
              const chunk = chunks[index] + (index < chunks.length - 1 ? ' ' : '')
              const data = `data: ${JSON.stringify({ content: chunk, cached: true })}\n\n`
              controller.enqueue(encoder.encode(data))
              index++
              setTimeout(sendChunk, 25) // 快速返回缓存内容
            } else {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            }
          }
          
          sendChunk()
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
    
    // 🧠 算法优化2: 分析对话质量和趋势
    const dialogueQuality = analyzeDialogueQuality(fullDiscussion, round)
    
    // 根据对话质量调整系统提示词
    const systemPrompt = generateEnhancedSystemPrompt(AI_B_CONFIG, 'ai_b', round, question)
    
    let enhancedPrompt = systemPrompt
    if (dialogueQuality.needsRefocus) {
      enhancedPrompt += `

🎯 对话优化提示：检测到对话可能偏离主题，请重新聚焦核心问题。
当前对话质量：${(dialogueQuality.score * 100).toFixed(1)}%
建议：${dialogueQuality.suggestion}`
    }
    
    const userPrompt = `用户问题："${question}"

AI助手A的观点：
${aiAResponse}

${fullDiscussion ? `\n完整讨论历史：\n${fullDiscussion}\n` : ''}

🤖 对话分析：
- 当前轮次：${round}
- 对话质量：${(dialogueQuality.score * 100).toFixed(1)}%
- 收敛趋势：${dialogueQuality.trend}
- 建议策略：${dialogueQuality.suggestion}

请回应AI助手A的观点，继续讨论。`
    
    const encoder = new TextEncoder()
    let fullResponse = ''
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送对话分析结果
          const analysisData = `data: ${JSON.stringify({ 
            dialogueAnalysis: dialogueQuality,
            message: `🤖 对话质量分析：${(dialogueQuality.score * 100).toFixed(1)}%` 
          })}\n\n`
          controller.enqueue(encoder.encode(analysisData))
          
          await callAIStreaming(AI_B_CONFIG, enhancedPrompt, userPrompt, (chunk) => {
            fullResponse += chunk
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
          })
          
          // 智能缓存存储
          if (fullResponse.length > 50) {
            cacheManager.set(cacheKey, fullResponse)
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (error: any) {
          const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`
          controller.enqueue(encoder.encode(errorData))
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
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// 🧠 对话质量分析算法
function analyzeDialogueQuality(fullDiscussion: string, round: number) {
  if (!fullDiscussion) {
    return {
      score: 0.8,
      trend: 'starting',
      needsRefocus: false,
      suggestion: '开始新的讨论'
    }
  }
  
  const responses = fullDiscussion.split('\n\n').filter(r => r.trim().length > 0)
  
  // 计算对话质量分数
  let qualityScore = 0.5
  
  // 长度质量
  const avgLength = responses.reduce((sum, r) => sum + r.length, 0) / responses.length
  if (avgLength > 200) qualityScore += 0.2
  if (avgLength > 500) qualityScore += 0.1
  
  // 专业术语密度
  const technicalTerms = ['算法', '系统', '架构', '设计', '实现', '优化', '性能']
  const techDensity = responses.reduce((sum, r) => {
    const techCount = technicalTerms.filter(term => r.includes(term)).length
    return sum + techCount
  }, 0) / responses.length
  
  if (techDensity > 1) qualityScore += 0.1
  if (techDensity > 2) qualityScore += 0.1
  
  // 互动质量
  const interactionWords = ['我同意', '我认为', '你提到的', '让我们', '进一步', '另外']
  const interactionCount = responses.reduce((sum, r) => {
    return sum + interactionWords.filter(word => r.includes(word)).length
  }, 0)
  
  if (interactionCount > responses.length * 0.5) qualityScore += 0.1
  
  // 判断是否需要重新聚焦
  const needsRefocus = round > 3 && qualityScore < 0.6
  
  // 趋势分析
  let trend = 'stable'
  if (round > 2) {
    if (qualityScore > 0.8) trend = 'improving'
    else if (qualityScore < 0.5) trend = 'declining'
  }
  
  // 建议策略
  let suggestion = '继续当前讨论方向'
  if (needsRefocus) {
    suggestion = '建议回到核心问题，深入分析'
  } else if (qualityScore > 0.8) {
    suggestion = '讨论质量良好，可以深入细节'
  } else if (round > 4 && qualityScore > 0.7) {
    suggestion = '可以考虑总结共识'
  }
  
  return {
    score: Math.min(qualityScore, 1.0),
    trend,
    needsRefocus,
    suggestion,
    round,
    technicalDensity: techDensity,
    interactionLevel: interactionCount / responses.length
  }
}
