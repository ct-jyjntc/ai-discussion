import { NextRequest } from 'next/server'
import { CONSENSUS_CONFIG, generateSystemPrompt, callAIStreaming } from '@/lib/ai-config'

export async function POST(request: NextRequest) {
  try {
    const { question, fullDiscussion } = await request.json()
    
    const systemPrompt = generateSystemPrompt(CONSENSUS_CONFIG, 'consensus', 1)
    const userPrompt = `用户问题："${question}"

AI助手们的完整讨论：
${fullDiscussion}

请基于他们的讨论，生成最终的共识答案。`
    
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callAIStreaming(CONSENSUS_CONFIG, systemPrompt, userPrompt, (chunk) => {
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
