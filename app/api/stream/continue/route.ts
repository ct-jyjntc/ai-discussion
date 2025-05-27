import { NextRequest } from 'next/server'
import { AI_A_CONFIG, AI_B_CONFIG, generateEnhancedSystemPrompt, callAIStreaming } from '@/lib/ai-config'

export async function POST(request: NextRequest) {
  try {
    const { question, fullDiscussion, round, isAiA } = await request.json()
    
    const config = isAiA ? AI_A_CONFIG : AI_B_CONFIG
    const role = isAiA ? 'ai_a' : 'ai_b'
    const systemPrompt = generateEnhancedSystemPrompt(config, role, round, question)
    
    const userPrompt = `用户问题："${question}"

完整讨论历史：
${fullDiscussion}

请继续讨论，提出你的进一步观点。`
    
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callAIStreaming(config, systemPrompt, userPrompt, (chunk) => {
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
          })
          
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
