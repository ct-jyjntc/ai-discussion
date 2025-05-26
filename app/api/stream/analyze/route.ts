import { NextRequest } from 'next/server'
import { AI_A_CONFIG, generateSystemPrompt, callAIStreaming } from '@/lib/ai-config'

export async function POST(request: NextRequest) {
  try {
    const { question, round } = await request.json()
    
    const systemPrompt = generateSystemPrompt(AI_A_CONFIG, 'ai_a', round)
    const userPrompt = `用户问题："${question}"\n\n请开始分析这个问题，提出你的初步观点。`
    
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callAIStreaming(AI_A_CONFIG, systemPrompt, userPrompt, (chunk) => {
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
