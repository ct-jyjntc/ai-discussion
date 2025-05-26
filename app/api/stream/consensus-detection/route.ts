import { NextRequest } from 'next/server'
import { detectConsensusStreaming } from '@/actions/consensus-detection'

export async function POST(request: NextRequest) {
  try {
    const { question, fullDiscussion, round } = await request.json()

    if (!question || !fullDiscussion || typeof round !== 'number') {
      return new Response('Missing required parameters', { status: 400 })
    }

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 执行共识检测
          const result = await detectConsensusStreaming(
            question,
            fullDiscussion,
            round,
            (status: string) => {
              // 发送进度更新
              const progressData = {
                type: 'progress',
                content: status
              }
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`)
              )
            }
          )

          // 发送最终结果
          const finalData = {
            type: 'result',
            content: result
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
          )

          // 结束流
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

        } catch (error: any) {
          console.error('Consensus detection error:', error)
          
          const errorData = {
            type: 'error',
            content: error.message || '共识检测过程中出现错误'
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
          )
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('API error:', error)
    return new Response(
      JSON.stringify({ error: error.message || '请求处理失败' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}