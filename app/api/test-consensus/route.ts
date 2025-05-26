/**
 * 测试增强的共识检测逻辑的API路由
 */

import { NextRequest, NextResponse } from 'next/server'
import { detectConsensus } from '@/actions/consensus-detection'

export async function POST(request: NextRequest) {
  try {
    console.log('开始测试增强的共识检测逻辑...')
    
    // 测试场景1：AI达成共识但问题未充分解决
    const testCase1 = {
      question: "如何在TypeScript项目中优化内存使用和性能？我需要具体的代码示例和最佳实践。",
      discussion: `
【AI助手A】：关于TypeScript性能优化，我认为主要是要注意类型定义。使用接口比类型别名性能更好。

【AI助手B】：我同意你的观点，接口确实在某些情况下性能更好。我们在这点上达成了一致。

【AI助手A】：很好，我认为我们已经达成共识了。

【AI助手B】：我同意，我们的观点一致。
`,
      expectedResult: {
        hasConsensus: false, // 应该检测到问题未充分解决
        questionMatchScore: "< 70", // 分数应该较低
        questionCoverage: "partial", // 覆盖度不完整
        solutionCompleteness: "incomplete" // 解决方案不完整
      }
    }

    // 测试场景2：AI达成共识且充分解决了问题
    const testCase2 = {
      question: "什么是JavaScript中的闭包？",
      discussion: `
【AI助手A】：闭包是指函数可以访问其外部作用域中变量的特性。例如：
function outer() {
  let count = 0;
  return function inner() {
    count++;
    return count;
  }
}
这里inner函数形成了闭包，可以访问outer函数的count变量。

【AI助手B】：我完全同意你的解释。闭包确实是JavaScript中的重要概念。你的代码示例很好地展示了闭包的核心机制。我们的观点完全一致，这个解释完整地回答了用户的问题。

【AI助手A】：很好，我认为我们已经充分解答了用户关于闭包的问题，达成了共识。

【AI助手B】：我同意，我们的解释是完整和准确的，用户的问题得到了充分解决。
`,
      expectedResult: {
        hasConsensus: true, // 应该检测到有效共识
        questionMatchScore: ">= 70", // 分数应该较高
        questionCoverage: "complete", // 覆盖度完整
        solutionCompleteness: "complete" // 解决方案完整
      }
    }

    // 测试场景3：AI达成共识但偏离了原始问题
    const testCase3 = {
      question: "如何配置Docker容器的网络设置？",
      discussion: `
【AI助手A】：关于容器技术，我觉得Kubernetes是个很好的选择。它有很多优势。

【AI助手B】：我同意你的观点，Kubernetes确实很有用。我们在这点上达成了一致。

【AI助手A】：很好，我认为我们已经达成共识了。

【AI助手B】：我同意，我们都认为Kubernetes很重要。
`,
      expectedResult: {
        hasConsensus: false, // 应该检测到偏离主题
        questionMatchScore: "< 70", // 分数应该很低
        questionCoverage: "off-topic", // 偏离主题
        solutionCompleteness: "unclear" // 解决方案不清楚
      }
    }

    const testResults = []

    // 运行测试1
    console.log('\n=== 测试1: AI达成共识但问题未充分解决 ===')
    const result1 = await detectConsensus(testCase1.question, testCase1.discussion, 3)
    console.log('测试1结果:', {
      hasConsensus: result1.hasConsensus,
      questionMatchScore: result1.questionMatchScore,
      questionCoverage: result1.questionCoverage,
      solutionCompleteness: result1.solutionCompleteness,
      recommendAction: result1.recommendAction
    })

    // 验证测试1
    const test1Pass = !result1.hasConsensus && 
                     (result1.questionMatchScore || 0) < 70 &&
                     result1.questionCoverage !== "complete"
    testResults.push({ name: "测试1", passed: test1Pass, result: result1 })

    // 运行测试2
    console.log('\n=== 测试2: AI达成共识且充分解决了问题 ===')
    const result2 = await detectConsensus(testCase2.question, testCase2.discussion, 3)
    console.log('测试2结果:', {
      hasConsensus: result2.hasConsensus,
      questionMatchScore: result2.questionMatchScore,
      questionCoverage: result2.questionCoverage,
      solutionCompleteness: result2.solutionCompleteness,
      recommendAction: result2.recommendAction
    })

    // 验证测试2
    const test2Pass = result2.hasConsensus && 
                     (result2.questionMatchScore || 0) >= 70 &&
                     result2.questionCoverage === "complete" &&
                     result2.solutionCompleteness === "complete"
    testResults.push({ name: "测试2", passed: test2Pass, result: result2 })

    // 运行测试3
    console.log('\n=== 测试3: AI达成共识但偏离了原始问题 ===')
    const result3 = await detectConsensus(testCase3.question, testCase3.discussion, 3)
    console.log('测试3结果:', {
      hasConsensus: result3.hasConsensus,
      questionMatchScore: result3.questionMatchScore,
      questionCoverage: result3.questionCoverage,
      solutionCompleteness: result3.solutionCompleteness,
      recommendAction: result3.recommendAction
    })

    // 验证测试3
    const test3Pass = !result3.hasConsensus && 
                     (result3.questionMatchScore || 0) < 70 &&
                     (result3.questionCoverage === "off-topic" || result3.questionCoverage === "minimal" || result3.questionCoverage === "partial")
    testResults.push({ name: "测试3", passed: test3Pass, result: result3 })

    // 统计结果
    const passCount = testResults.filter(t => t.passed).length
    const totalCount = testResults.length

    console.log('\n=== 测试总结 ===')
    console.log(`通过: ${passCount}/${totalCount}`)

    if (passCount === totalCount) {
      console.log('🎉 所有测试通过！增强的共识检测逻辑工作正常。')
    } else {
      console.log('⚠️  部分测试失败，需要进一步调试和优化。')
    }

    return NextResponse.json({
      success: passCount === totalCount,
      passCount,
      totalCount,
      testResults: testResults.map(t => ({
        name: t.name,
        passed: t.passed,
        hasConsensus: t.result.hasConsensus,
        questionMatchScore: t.result.questionMatchScore,
        questionCoverage: t.result.questionCoverage,
        solutionCompleteness: t.result.solutionCompleteness,
        recommendAction: t.result.recommendAction,
        reason: t.result.reason
      }))
    })

  } catch (error: any) {
    console.error('测试过程中出现错误:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
