import { NextRequest } from 'next/server'
import { AI_A_CONFIG, generateSystemPrompt, callAIStreaming } from '@/lib/ai-config'
import { cacheManager } from '@/lib/cache-manager'

export async function POST(request: NextRequest) {
  try {
    const { question, round } = await request.json()
    
    // 智能缓存检查
    const cacheKey = `analyze:${question}:${round}`
    const cachedResult = cacheManager.get<string>(cacheKey)
    
    if (cachedResult) {
      // 返回缓存结果，显著提升响应速度
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          // 模拟流式返回缓存内容
          const chunks = cachedResult.split(' ')
          let index = 0
          
          const sendChunk = () => {
            if (index < chunks.length) {
              const chunk = chunks[index] + (index < chunks.length - 1 ? ' ' : '')
              const data = `data: ${JSON.stringify({ content: chunk, cached: true })}\n\n`
              controller.enqueue(encoder.encode(data))
              index++
              setTimeout(sendChunk, 30) // 快速返回缓存内容
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

    // 简化的问题分析
    const questionAnalysis = {
      type: question.includes('如何') || question.includes('怎么') ? 'practical' : 'general',
      complexity: question.length > 50 ? 0.8 : 0.5,
      specificityLevel: question.split('?').length > 2 ? 'high' : 'medium'
    }
    
    // 根据问题复杂度调整系统提示词
    let enhancedSystemPrompt = generateSystemPrompt(AI_A_CONFIG, 'ai_a', round)
    
    if (questionAnalysis.complexity > 0.7) {
      enhancedSystemPrompt += `

🧠 智能分析提示：此问题具有较高复杂度，建议深度分析。
- 问题类型：${questionAnalysis.type}
- 复杂度评估：${(questionAnalysis.complexity * 100).toFixed(1)}%
- 专业度：${questionAnalysis.specificityLevel}`
    }
    
    const userPrompt = `用户问题："${question}"

🔍 智能问题分析：
- 问题类型：${questionAnalysis.type}
- 复杂度评估：${(questionAnalysis.complexity * 100).toFixed(1)}%
- 专业程度：${questionAnalysis.specificityLevel}

请开始分析这个问题，提出你的初步观点。`
    
    const encoder = new TextEncoder()
    let fullResponse = ''
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送问题分析结果
          if (round === 1) {
            const analysisData = `data: ${JSON.stringify({ 
              analysis: questionAnalysis,
              message: '🧠 智能问题分析完成' 
            })}\n\n`
            controller.enqueue(encoder.encode(analysisData))
          }
          
          await callAIStreaming(AI_A_CONFIG, enhancedSystemPrompt, userPrompt, (chunk) => {
            fullResponse += chunk
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
          })
          
          // 智能缓存存储
          if (fullResponse.length > 50) {
            cacheManager.set(cacheKey, fullResponse)
            
            // 发送缓存统计
            const stats = cacheManager.getStats()
            const statsData = `data: ${JSON.stringify({ 
              cacheStats: stats,
              message: `🚀 缓存命中率: ${stats.hitRate.toFixed(1)}%` 
            })}\n\n`
            controller.enqueue(encoder.encode(statsData))
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
