#!/usr/bin/env node
/**
 * 测试增强的共识检测逻辑
 * 验证系统能够识别当AI达成共识但未解决用户问题的情况
 */

import { detectConsensus } from './actions/consensus-detection.js'

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

async function runTest(testCase: any, testName: string) {
  console.log(`\n=== ${testName} ===`)
  console.log(`问题: ${testCase.question}`)
  console.log(`讨论内容:\n${testCase.discussion}`)
  
  try {
    const result = await detectConsensus(testCase.question, testCase.discussion, 3)
    
    console.log(`\n检测结果:`)
    console.log(`- 是否达成共识: ${result.hasConsensus}`)
    console.log(`- 置信度: ${result.confidence}%`)
    console.log(`- 问题匹配度分数: ${result.questionMatchScore}`)
    console.log(`- 问题覆盖程度: ${result.questionCoverage}`)
    console.log(`- 解决方案完整性: ${result.solutionCompleteness}`)
    console.log(`- 推荐行动: ${result.recommendAction}`)
    console.log(`- 原因: ${result.reason}`)
    
    if (result.unaddressedAspects && result.unaddressedAspects.length > 0) {
      console.log(`- 未解决的方面: ${result.unaddressedAspects.join(', ')}`)
    }
    
    // 验证期望结果
    console.log(`\n期望验证:`)
    
    // 检查共识状态
    const consensusExpected = testCase.expectedResult.hasConsensus
    const consensusMatches = result.hasConsensus === consensusExpected
    console.log(`✓ 共识状态 ${consensusMatches ? '符合' : '不符合'} 期望 (期望: ${consensusExpected}, 实际: ${result.hasConsensus})`)
    
    // 检查问题匹配分数
    const scoreExpected = testCase.expectedResult.questionMatchScore
    let scoreMatches = false
    if (scoreExpected.startsWith('>=')) {
      const threshold = parseInt(scoreExpected.replace('>= ', ''))
      scoreMatches = (result.questionMatchScore || 0) >= threshold
    } else if (scoreExpected.startsWith('<')) {
      const threshold = parseInt(scoreExpected.replace('< ', ''))
      scoreMatches = (result.questionMatchScore || 0) < threshold
    }
    console.log(`✓ 问题匹配分数 ${scoreMatches ? '符合' : '不符合'} 期望 (期望: ${scoreExpected}, 实际: ${result.questionMatchScore})`)
    
    // 检查问题覆盖程度
    const coverageExpected = testCase.expectedResult.questionCoverage
    const coverageMatches = result.questionCoverage === coverageExpected
    console.log(`✓ 问题覆盖程度 ${coverageMatches ? '符合' : '不符合'} 期望 (期望: ${coverageExpected}, 实际: ${result.questionCoverage})`)
    
    // 检查解决方案完整性
    const completenessExpected = testCase.expectedResult.solutionCompleteness
    const completenessMatches = result.solutionCompleteness === completenessExpected
    console.log(`✓ 解决方案完整性 ${completenessMatches ? '符合' : '不符合'} 期望 (期望: ${completenessExpected}, 实际: ${result.solutionCompleteness})`)
    
    const allMatches = consensusMatches && scoreMatches && coverageMatches && completenessMatches
    console.log(`\n测试结果: ${allMatches ? '✅ 通过' : '❌ 失败'}`)
    
    return allMatches
    
  } catch (error: any) {
    console.error(`测试出错: ${error.message}`)
    return false
  }
}

async function runAllTests() {
  console.log('开始测试增强的共识检测逻辑...\n')
  
  const results = []
  
  results.push(await runTest(testCase1, "测试1: AI达成共识但问题未充分解决"))
  results.push(await runTest(testCase2, "测试2: AI达成共识且充分解决了问题"))
  results.push(await runTest(testCase3, "测试3: AI达成共识但偏离了原始问题"))
  
  console.log('\n=== 测试总结 ===')
  const passCount = results.filter(r => r).length
  const totalCount = results.length
  
  console.log(`通过: ${passCount}/${totalCount}`)
  
  if (passCount === totalCount) {
    console.log('🎉 所有测试通过！增强的共识检测逻辑工作正常。')
  } else {
    console.log('⚠️  部分测试失败，需要进一步调试和优化。')
  }
  
  return passCount === totalCount
}

// 运行测试
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { runAllTests }
