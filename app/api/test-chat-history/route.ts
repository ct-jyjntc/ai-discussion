/**
 * 测试聊天历史传递功能的API路由
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeQuestion, aiDiscussion, continueDiscussion } from '@/actions/ai-conversation-v2'

export async function POST(request: NextRequest) {
  try {
    console.log('=== 开始测试聊天历史传递功能 ===')
    
    const question = "什么是人工智能？请详细解释其定义和应用。"
    let fullDiscussion = ""
    
    // 第一轮：AI助手A分析问题
    console.log('\n第1轮 - AI助手A分析问题:')
    const round1AResponse = await analyzeQuestion(question, 1)
    console.log('AI助手A回应:', round1AResponse.substring(0, 100) + '...')
    
    fullDiscussion += `\n\n【AI助手A - 第1轮】：\n${round1AResponse}`
    console.log('当前讨论历史长度:', fullDiscussion.length)
    
    // 第一轮：AI助手B回应
    console.log('\n第1轮 - AI助手B回应:')
    const round1BResponse = await aiDiscussion(question, round1AResponse, 1, fullDiscussion)
    console.log('AI助手B回应:', round1BResponse.substring(0, 100) + '...')
    
    fullDiscussion += `\n\n【AI助手B - 第1轮】：\n${round1BResponse}`
    console.log('当前讨论历史长度:', fullDiscussion.length)
    
    // 第二轮：AI助手A继续讨论（应该能看到完整历史）
    console.log('\n第2轮 - AI助手A继续讨论:')
    const round2AResponse = await continueDiscussion(question, fullDiscussion, 2, true)
    console.log('AI助手A第2轮回应:', round2AResponse.substring(0, 100) + '...')
    
    fullDiscussion += `\n\n【AI助手A - 第2轮】：\n${round2AResponse}`
    console.log('当前讨论历史长度:', fullDiscussion.length)
    
    // 第二轮：AI助手B继续讨论（应该能看到完整历史）
    console.log('\n第2轮 - AI助手B继续讨论:')
    const round2BResponse = await continueDiscussion(question, fullDiscussion, 2, false)
    console.log('AI助手B第2轮回应:', round2BResponse.substring(0, 100) + '...')
    
    fullDiscussion += `\n\n【AI助手B - 第2轮】：\n${round2BResponse}`
    console.log('最终讨论历史长度:', fullDiscussion.length)
    
    // 检查回应中是否包含上下文相关内容
    const contextIndicators = [
      '前面提到',
      '如你所说',
      '基于刚才的讨论',
      '继续深入',
      '进一步补充',
      '在此基础上',
      '正如之前',
      '结合前面'
    ]
    
    const round2AHasContext = contextIndicators.some(indicator => 
      round2AResponse.includes(indicator)
    )
    
    const round2BHasContext = contextIndicators.some(indicator => 
      round2BResponse.includes(indicator)
    )
    
    console.log('\n=== 上下文检测结果 ===')
    console.log('AI助手A第2轮是否体现上下文:', round2AHasContext)
    console.log('AI助手B第2轮是否体现上下文:', round2BHasContext)
    
    // 检查是否在回应中引用了对方的观点
    const round2AReferencesB = round1BResponse.split(' ').slice(0, 10).some(word => 
      round2AResponse.includes(word) && word.length > 2
    )
    
    const round2BReferencesA = round2AResponse.split(' ').slice(0, 10).some(word => 
      round2BResponse.includes(word) && word.length > 2
    )
    
    console.log('AI助手A是否引用了B的观点:', round2AReferencesB)
    console.log('AI助手B是否引用了A的观点:', round2BReferencesA)
    
    const testResults = {
      success: true,
      question,
      rounds: [
        {
          round: 1,
          aiA: {
            response: round1AResponse,
            hasFullHistory: false, // 第一轮没有历史
            discussionLength: 0
          },
          aiB: {
            response: round1BResponse,
            hasFullHistory: true, // 应该能看到A的回应
            discussionLength: fullDiscussion.split('【AI助手A - 第1轮】').length > 1
          }
        },
        {
          round: 2,
          aiA: {
            response: round2AResponse,
            hasFullHistory: true,
            hasContext: round2AHasContext,
            referencesB: round2AReferencesB,
            discussionLength: fullDiscussion.split('\n\n【').length - 1
          },
          aiB: {
            response: round2BResponse,
            hasFullHistory: true,
            hasContext: round2BHasContext,
            referencesA: round2BReferencesA,
            discussionLength: fullDiscussion.split('\n\n【').length - 1
          }
        }
      ],
      analysis: {
        totalDiscussionLength: fullDiscussion.length,
        contextAware: round2AHasContext || round2BHasContext,
        crossReference: round2AReferencesB || round2BReferencesA,
        recommendation: (round2AHasContext || round2BHasContext) && (round2AReferencesB || round2BReferencesA) 
          ? "✅ 聊天历史传递正常工作"
          : "⚠️  聊天历史传递可能存在问题"
      }
    }
    
    console.log('\n=== 测试总结 ===')
    console.log('总讨论长度:', testResults.analysis.totalDiscussionLength)
    console.log('上下文感知:', testResults.analysis.contextAware)
    console.log('交叉引用:', testResults.analysis.crossReference)
    console.log('推荐结论:', testResults.analysis.recommendation)
    
    return NextResponse.json(testResults)

  } catch (error: any) {
    console.error('测试聊天历史传递时出现错误:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
