#!/usr/bin/env node

/**
 * 算法性能基准测试脚本
 * 用于测试和对比不同算法的性能表现
 */

const fs = require('fs')
const path = require('path')

class AlgorithmBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testCases: [],
      performance: {},
      recommendations: []
    }
  }

  /**
   * 运行完整的算法基准测试
   */
  async runFullBenchmark() {
    console.log('🚀 开始算法性能基准测试...\n')

    // 1. 问题分析算法测试
    await this.testQuestionAnalysis()
    
    // 2. 共识检测算法测试
    await this.testConsensusDetection()
    
    // 3. 对话管理算法测试
    await this.testDialogueManagement()
    
    // 4. 缓存算法测试
    await this.testCachingAlgorithm()
    
    // 5. 生成综合报告
    await this.generateReport()
    
    console.log('\n✅ 算法基准测试完成!')
    console.log(`📊 报告已保存: ./benchmark-results-${Date.now()}.json`)
  }

  /**
   * 测试问题分析算法性能
   */
  async testQuestionAnalysis() {
    console.log('📝 测试问题分析算法...')
    
    const testQuestions = [
      "如何在React中实现状态管理？",
      "Python和JavaScript的性能差异在哪里？",
      "微服务架构的优缺点分析",
      "解决内存泄漏的具体步骤",
      "什么是机器学习的基本原理？"
    ]

    const startTime = performance.now()
    let totalAccuracy = 0
    
    for (const question of testQuestions) {
      const analysisResult = await this.mockQuestionAnalysis(question)
      const accuracy = this.evaluateAnalysisAccuracy(question, analysisResult)
      totalAccuracy += accuracy
      
      this.results.testCases.push({
        type: 'question_analysis',
        input: question,
        result: analysisResult,
        accuracy: accuracy,
        processingTime: analysisResult.processingTime
      })
    }

    const endTime = performance.now()
    const avgAccuracy = totalAccuracy / testQuestions.length
    const avgTime = (endTime - startTime) / testQuestions.length

    this.results.performance.questionAnalysis = {
      averageAccuracy: avgAccuracy,
      averageProcessingTime: avgTime,
      testCount: testQuestions.length,
      score: this.calculateScore(avgAccuracy, avgTime, 100) // 100ms 基准
    }

    console.log(`  ✓ 平均准确率: ${(avgAccuracy * 100).toFixed(1)}%`)
    console.log(`  ✓ 平均处理时间: ${avgTime.toFixed(2)}ms`)
  }

  /**
   * 测试共识检测算法性能
   */
  async testConsensusDetection() {
    console.log('🤝 测试共识检测算法...')
    
    const testDialogues = [
      {
        question: "如何优化数据库查询性能？",
        dialogue: [
          "我认为应该添加索引来优化查询",
          "同意，索引确实是关键，还可以考虑查询语句优化",
          "是的，我们达成一致了"
        ],
        expectedConsensus: true
      },
      {
        question: "前端框架的选择标准",
        dialogue: [
          "React更适合大型项目",
          "我觉得Vue更简单易学",
          "两者各有优势，需要具体情况具体分析"
        ],
        expectedConsensus: false
      },
      {
        question: "云计算的安全性考虑",
        dialogue: [
          "云计算存在数据泄露风险",
          "通过合适的加密和访问控制可以保证安全",
          "你说得对，安全措施到位的话风险可控",
          "我们都认同安全性需要技术和管理双重保障"
        ],
        expectedConsensus: true
      }
    ]

    let correctPredictions = 0
    let totalTime = 0

    for (const testCase of testDialogues) {
      const startTime = performance.now()
      const consensusResult = await this.mockConsensusDetection(testCase)
      const endTime = performance.now()
      
      const processingTime = endTime - startTime
      totalTime += processingTime
      
      const isCorrect = consensusResult.hasConsensus === testCase.expectedConsensus
      if (isCorrect) correctPredictions++

      this.results.testCases.push({
        type: 'consensus_detection',
        input: testCase,
        result: consensusResult,
        isCorrect: isCorrect,
        processingTime: processingTime
      })
    }

    const accuracy = correctPredictions / testDialogues.length
    const avgTime = totalTime / testDialogues.length

    this.results.performance.consensusDetection = {
      accuracy: accuracy,
      averageProcessingTime: avgTime,
      testCount: testDialogues.length,
      score: this.calculateScore(accuracy, avgTime, 200) // 200ms 基准
    }

    console.log(`  ✓ 检测准确率: ${(accuracy * 100).toFixed(1)}%`)
    console.log(`  ✓ 平均处理时间: ${avgTime.toFixed(2)}ms`)
  }

  /**
   * 测试对话管理算法性能
   */
  async testDialogueManagement() {
    console.log('💬 测试对话管理算法...')
    
    const testScenarios = [
      {
        description: "正常对话流程",
        rounds: 3,
        quality: 0.8,
        expectedStrategy: "continue"
      },
      {
        description: "主题漂移场景",
        rounds: 4,
        quality: 0.6,
        topicDrift: 0.7,
        expectedStrategy: "refocus"
      },
      {
        description: "高质量共识",
        rounds: 2,
        quality: 0.9,
        consensus: 0.85,
        expectedStrategy: "conclude"
      }
    ]

    let strategyAccuracy = 0
    let totalTime = 0

    for (const scenario of testScenarios) {
      const startTime = performance.now()
      const managementResult = await this.mockDialogueManagement(scenario)
      const endTime = performance.now()
      
      const processingTime = endTime - startTime
      totalTime += processingTime
      
      const isCorrect = managementResult.strategy === scenario.expectedStrategy
      if (isCorrect) strategyAccuracy++

      this.results.testCases.push({
        type: 'dialogue_management',
        input: scenario,
        result: managementResult,
        isCorrect: isCorrect,
        processingTime: processingTime
      })
    }

    const accuracy = strategyAccuracy / testScenarios.length
    const avgTime = totalTime / testScenarios.length

    this.results.performance.dialogueManagement = {
      strategyAccuracy: accuracy,
      averageProcessingTime: avgTime,
      testCount: testScenarios.length,
      score: this.calculateScore(accuracy, avgTime, 50) // 50ms 基准
    }

    console.log(`  ✓ 策略准确率: ${(accuracy * 100).toFixed(1)}%`)
    console.log(`  ✓ 平均处理时间: ${avgTime.toFixed(2)}ms`)
  }

  /**
   * 测试缓存算法性能
   */
  async testCachingAlgorithm() {
    console.log('🚀 测试缓存算法...')
    
    const testQueries = [
      "React hooks 使用方法",
      "JavaScript 异步编程",
      "React hooks 最佳实践", // 相似查询
      "Python 数据结构",
      "React 状态管理", // 相似查询
      "JavaScript 异步处理", // 相似查询
      "Vue.js 组件开发",
      "React hooks 进阶用法" // 相似查询
    ]

    let hitCount = 0
    let totalTime = 0
    const cache = new Map()

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i]
      const startTime = performance.now()
      
      const cacheResult = await this.mockCacheOperation(query, cache, i)
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      totalTime += processingTime

      if (cacheResult.hit) hitCount++

      this.results.testCases.push({
        type: 'caching_algorithm',
        input: query,
        result: cacheResult,
        processingTime: processingTime
      })
    }

    const hitRate = hitCount / testQueries.length
    const avgTime = totalTime / testQueries.length

    this.results.performance.cachingAlgorithm = {
      hitRate: hitRate,
      averageProcessingTime: avgTime,
      testCount: testQueries.length,
      score: this.calculateScore(hitRate, avgTime, 10) // 10ms 基准
    }

    console.log(`  ✓ 缓存命中率: ${(hitRate * 100).toFixed(1)}%`)
    console.log(`  ✓ 平均处理时间: ${avgTime.toFixed(2)}ms`)
  }

  /**
   * 生成综合性能报告
   */
  async generateReport() {
    console.log('\n📊 生成综合性能报告...')
    
    // 计算综合评分
    const performances = this.results.performance
    const overallScore = (
      (performances.questionAnalysis?.score || 0) * 0.25 +
      (performances.consensusDetection?.score || 0) * 0.30 +
      (performances.dialogueManagement?.score || 0) * 0.25 +
      (performances.cachingAlgorithm?.score || 0) * 0.20
    )

    this.results.overallScore = overallScore

    // 生成优化建议
    this.generateRecommendations()

    // 保存报告
    const reportPath = `./benchmark-results-${Date.now()}.json`
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2))

    // 输出摘要
    this.printSummary()
  }

  /**
   * 生成优化建议
   */
  generateRecommendations() {
    const perf = this.results.performance
    const recommendations = []

    if (perf.questionAnalysis?.averageAccuracy < 0.8) {
      recommendations.push({
        component: 'Question Analysis',
        issue: '问题分析准确率偏低',
        suggestion: '建议优化语义向量算法，增加更多训练数据',
        priority: 'high'
      })
    }

    if (perf.consensusDetection?.accuracy < 0.8) {
      recommendations.push({
        component: 'Consensus Detection',
        issue: '共识检测准确率需要提升',
        suggestion: '建议调整阈值参数，增加更多判断维度',
        priority: 'high'
      })
    }

    if (perf.dialogueManagement?.averageProcessingTime > 100) {
      recommendations.push({
        component: 'Dialogue Management',
        issue: '对话管理处理时间过长',
        suggestion: '建议优化算法复杂度，使用缓存减少计算',
        priority: 'medium'
      })
    }

    if (perf.cachingAlgorithm?.hitRate < 0.5) {
      recommendations.push({
        component: 'Caching Algorithm',
        issue: '缓存命中率偏低',
        suggestion: '建议优化相似度算法，调整缓存策略',
        priority: 'medium'
      })
    }

    this.results.recommendations = recommendations
  }

  /**
   * 打印性能摘要
   */
  printSummary() {
    console.log('\n🎯 性能测试摘要:')
    console.log('='*50)
    
    const perf = this.results.performance
    
    console.log(`总体评分: ${this.results.overallScore.toFixed(1)}/100`)
    console.log('')
    
    console.log('各模块详细表现:')
    if (perf.questionAnalysis) {
      console.log(`  问题分析: ${perf.questionAnalysis.score.toFixed(1)}分 (准确率: ${(perf.questionAnalysis.averageAccuracy * 100).toFixed(1)}%)`)
    }
    if (perf.consensusDetection) {
      console.log(`  共识检测: ${perf.consensusDetection.score.toFixed(1)}分 (准确率: ${(perf.consensusDetection.accuracy * 100).toFixed(1)}%)`)
    }
    if (perf.dialogueManagement) {
      console.log(`  对话管理: ${perf.dialogueManagement.score.toFixed(1)}分 (策略准确率: ${(perf.dialogueManagement.strategyAccuracy * 100).toFixed(1)}%)`)
    }
    if (perf.cachingAlgorithm) {
      console.log(`  缓存算法: ${perf.cachingAlgorithm.score.toFixed(1)}分 (命中率: ${(perf.cachingAlgorithm.hitRate * 100).toFixed(1)}%)`)
    }

    if (this.results.recommendations.length > 0) {
      console.log('\n💡 优化建议:')
      this.results.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.component}: ${rec.suggestion}`)
      })
    }
  }

  // Mock 方法 - 模拟实际算法调用
  async mockQuestionAnalysis(question) {
    // 模拟处理时间
    await this.sleep(Math.random() * 50 + 20)
    
    return {
      questionType: this.detectQuestionType(question),
      complexity: Math.random() * 0.5 + 0.5,
      specificityLevel: Math.random() > 0.5 ? 'high' : 'medium',
      processingTime: Math.random() * 50 + 20
    }
  }

  async mockConsensusDetection(testCase) {
    await this.sleep(Math.random() * 100 + 50)
    
    const dialogueLength = testCase.dialogue.length
    const hasAgreementWords = testCase.dialogue.some(msg => 
      msg.includes('同意') || msg.includes('一致') || msg.includes('对') || msg.includes('是的')
    )
    
    // 简单的启发式判断
    const confidence = hasAgreementWords && dialogueLength >= 3 ? 0.8 : 0.4
    
    return {
      hasConsensus: confidence > 0.7,
      confidence: confidence,
      processingTime: Math.random() * 100 + 50
    }
  }

  async mockDialogueManagement(scenario) {
    await this.sleep(Math.random() * 30 + 10)
    
    let strategy = 'continue'
    
    if (scenario.consensus > 0.8) {
      strategy = 'conclude'
    } else if (scenario.topicDrift > 0.6) {
      strategy = 'refocus'
    } else if (scenario.quality < 0.7) {
      strategy = 'improve'
    }
    
    return {
      strategy: strategy,
      confidence: 0.8,
      processingTime: Math.random() * 30 + 10
    }
  }

  async mockCacheOperation(query, cache, queryIndex) {
    await this.sleep(Math.random() * 5 + 2)
    
    // 模拟语义相似度检查
    for (const [cachedQuery, data] of cache) {
      if (this.calculateSimilarity(query, cachedQuery) > 0.7) {
        return {
          hit: true,
          source: 'semantic_match',
          cachedQuery: cachedQuery,
          processingTime: Math.random() * 5 + 2
        }
      }
    }
    
    // 模拟存储到缓存
    cache.set(query, { data: `result_${queryIndex}`, timestamp: Date.now() })
    
    return {
      hit: false,
      source: 'new_computation',
      processingTime: Math.random() * 5 + 2
    }
  }

  // 辅助方法
  detectQuestionType(question) {
    if (question.includes('如何') || question.includes('怎么')) return 'practical'
    if (question.includes('什么是') || question.includes('为什么')) return 'conceptual'
    if (question.includes('对比') || question.includes('区别')) return 'comparative'
    return 'general'
  }

  calculateSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\W+/)
    const words2 = text2.toLowerCase().split(/\W+/)
    const common = words1.filter(word => words2.includes(word))
    return common.length / Math.max(words1.length, words2.length)
  }

  evaluateAnalysisAccuracy(question, result) {
    // 简化的准确率评估
    const expectedType = this.detectQuestionType(question)
    return result.questionType === expectedType ? 0.9 : 0.6
  }

  calculateScore(accuracy, time, benchmark) {
    const accuracyScore = accuracy * 70 // 70分满分
    const timeScore = Math.max(0, 30 - (time / benchmark) * 30) // 30分满分
    return Math.min(100, accuracyScore + timeScore)
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 运行基准测试
if (require.main === module) {
  const benchmark = new AlgorithmBenchmark()
  benchmark.runFullBenchmark().catch(console.error)
}

module.exports = AlgorithmBenchmark