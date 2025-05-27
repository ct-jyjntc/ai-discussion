import { NextRequest } from 'next/server'
import { AI_A_CONFIG, generateEnhancedSystemPrompt, callAIStreaming } from '@/lib/ai-config'
import { analyzeQuestion, generateQuestionAnalysisPrompt } from '@/lib/enhanced-ai-prompts'

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()
    
    if (!question) {
      return new Response(JSON.stringify({ error: '问题不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 分析问题特征
    const questionAnalysis = analyzeQuestion(question)
    
    // 生成增强的系统提示词
    const systemPrompt = generateEnhancedSystemPrompt(AI_A_CONFIG, 'ai_a', 1, question)
    
    // 生成针对性的用户提示词
    const userPrompt = `请针对以下用户问题提供精准、具体的回答：

"${question}"

## 分析结果
- 问题类型: ${questionAnalysis.questionType}
- 期望输出: ${questionAnalysis.expectedOutputType}
- 具体性要求: ${questionAnalysis.specificityLevel}
- 关键要素: ${questionAnalysis.keyElements.join(', ') || '无'}

请根据问题分析结果，提供直接、具体、可操作的回答。避免泛泛而谈，重点关注实用性和针对性。`
    
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 先发送问题分析结果
          const analysisData = `data: ${JSON.stringify({ 
            type: 'analysis',
            data: questionAnalysis 
          })}\n\n`
          controller.enqueue(encoder.encode(analysisData))
          
          // 然后流式输出AI回答
          await callAIStreaming(AI_A_CONFIG, systemPrompt, userPrompt, (chunk) => {
            const data = `data: ${JSON.stringify({ 
              type: 'content',
              content: chunk 
            })}\n\n`
            controller.enqueue(encoder.encode(data))
          })
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (error: any) {
          const errorData = `data: ${JSON.stringify({ 
            type: 'error',
            error: error.message 
          })}\n\n`
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
    console.error('Enhanced analyze API error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}