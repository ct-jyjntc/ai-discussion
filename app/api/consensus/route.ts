import { NextRequest } from 'next/server'
import { cacheManager } from '@/lib/cache-manager'

export async function POST(request: NextRequest) {
  try {
    const { question, responses, round } = await request.json()
    
    // 智能共识检测
    const consensusResult = await detectConsensusAdvanced(question, responses, round)
    
    // 缓存共识检测结果
    const cacheKey = `consensus:${question}:${round}`
    cacheManager.set(cacheKey, consensusResult)
    
    return new Response(JSON.stringify({
      success: true,
      consensus: consensusResult,
      cacheStats: cacheManager.getStats()
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// 🧠 高级共识检测算法
async function detectConsensusAdvanced(question: string, responses: string[], round: number) {
  if (!responses || responses.length < 2) {
    return {
      hasConsensus: false,
      confidence: 0,
      reason: '需要至少两个AI的回应才能检测共识',
      metrics: {}
    }
  }
  
  const [responseA, responseB] = responses
  
  // 1. 语义相似度分析
  const semanticSimilarity = calculateSemanticSimilarity(responseA, responseB)
  
  // 2. 论点一致性分析
  const argumentAlignment = calculateArgumentAlignment(responseA, responseB)
  
  // 3. 结论收敛度分析
  const conclusionConvergence = calculateConclusionConvergence(responseA, responseB)
  
  // 4. 对话质量评估
  const dialogueQuality = assessDialogueQuality(question, responseA, responseB)
  
  // 5. 综合评分
  const metrics = {
    semanticSimilarity,
    argumentAlignment,
    conclusionConvergence,
    dialogueQuality
  }
  
  const overallScore = (
    semanticSimilarity * 0.3 +
    argumentAlignment * 0.3 +
    conclusionConvergence * 0.25 +
    dialogueQuality * 0.15
  )
  
  // 6. 基于轮次调整阈值
  let consensusThreshold = 0.75
  if (round > 3) consensusThreshold = 0.7  // 后期轮次适当降低阈值
  if (round > 5) consensusThreshold = 0.65 // 避免无限循环
  
  const hasConsensus = overallScore > consensusThreshold
  
  // 7. 生成解释和建议
  const explanation = generateConsensusExplanation(metrics, overallScore, hasConsensus)
  
  return {
    hasConsensus,
    confidence: overallScore,
    metrics,
    explanation,
    recommendation: generateRecommendation(metrics, round, hasConsensus),
    round,
    threshold: consensusThreshold
  }
}

// 语义相似度计算
function calculateSemanticSimilarity(textA: string, textB: string): number {
  const wordsA = textA.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  const wordsB = textB.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  
  const setA = new Set(wordsA)
  const setB = new Set(wordsB)
  
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

// 论点一致性分析
function calculateArgumentAlignment(responseA: string, responseB: string): number {
  // 提取关键观点
  const argumentsA = extractArguments(responseA)
  const argumentsB = extractArguments(responseB)
  
  if (argumentsA.length === 0 || argumentsB.length === 0) return 0.5
  
  let alignmentScore = 0
  let totalComparisons = 0
  
  for (const argA of argumentsA) {
    for (const argB of argumentsB) {
      const similarity = calculateSemanticSimilarity(argA, argB)
      alignmentScore += similarity
      totalComparisons++
    }
  }
  
  return totalComparisons > 0 ? alignmentScore / totalComparisons : 0
}

// 提取论点
function extractArguments(text: string): string[] {
  // 寻找表达观点的句子
  const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 10)
  
  return sentences.filter(sentence => {
    const opinionIndicators = ['我认为', '应该', '建议', '重要的是', '关键在于', '最好的方法']
    return opinionIndicators.some(indicator => sentence.includes(indicator))
  })
}

// 结论收敛度分析
function calculateConclusionConvergence(responseA: string, responseB: string): number {
  const conclusionA = extractConclusion(responseA)
  const conclusionB = extractConclusion(responseB)
  
  if (!conclusionA || !conclusionB) return 0.5
  
  return calculateSemanticSimilarity(conclusionA, conclusionB)
}

// 提取结论
function extractConclusion(text: string): string | null {
  const conclusionPatterns = [
    /总之[^。！？]*[。！？]/,
    /综上[^。！？]*[。！？]/,
    /因此[^。！？]*[。！？]/,
    /所以[^。！？]*[。！？]/
  ]
  
  for (const pattern of conclusionPatterns) {
    const match = text.match(pattern)
    if (match) return match[0]
  }
  
  // 如果没有明显结论标识，取最后一句
  const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0)
  return sentences.length > 0 ? sentences[sentences.length - 1] : null
}

// 对话质量评估
function assessDialogueQuality(question: string, responseA: string, responseB: string): number {
  const responses = [responseA, responseB]
  
  // 相关性评估
  const relevanceScore = responses.reduce((sum, response) => {
    return sum + calculateRelevanceToQuestion(question, response)
  }, 0) / responses.length
  
  // 深度评估
  const depthScore = responses.reduce((sum, response) => {
    return sum + calculateResponseDepth(response)
  }, 0) / responses.length
  
  // 参与度评估
  const engagementScore = calculateEngagementLevel(responseA, responseB)
  
  return (relevanceScore * 0.4 + depthScore * 0.4 + engagementScore * 0.2)
}

// 相关性计算
function calculateRelevanceToQuestion(question: string, response: string): number {
  const questionWords = question.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  const responseWords = response.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  
  const commonWords = questionWords.filter(word => responseWords.includes(word))
  return questionWords.length > 0 ? commonWords.length / questionWords.length : 0
}

// 响应深度计算
function calculateResponseDepth(response: string): number {
  const depthIndicators = [
    '具体来说', '例如', '换句话说', '进一步', '深入分析', 
    '根本原因', '综合考虑', '从另一个角度', '详细分析'
  ]
  
  const indicators = depthIndicators.filter(indicator => response.includes(indicator))
  const lengthScore = Math.min(response.length / 500, 1)
  const indicatorScore = Math.min(indicators.length / 3, 1)
  
  return (lengthScore * 0.6 + indicatorScore * 0.4)
}

// 参与度评估
function calculateEngagementLevel(responseA: string, responseB: string): number {
  const engagementIndicators = [
    '我同意', '我认为', '你提到的', '你说得对', '我想补充',
    '关于你的观点', '我有不同看法', '让我们考虑'
  ]
  
  const responses = [responseA, responseB]
  const engagementCount = responses.reduce((count, response) => {
    return count + engagementIndicators.filter(indicator => response.includes(indicator)).length
  }, 0)
  
  return Math.min(engagementCount / 4, 1)
}

// 生成共识解释
function generateConsensusExplanation(metrics: any, score: number, hasConsensus: boolean): string {
  const { semanticSimilarity, argumentAlignment, conclusionConvergence, dialogueQuality } = metrics
  
  let explanation = `综合分析结果 (总分: ${(score * 100).toFixed(1)}%):\n`
  explanation += `• 语义相似度: ${(semanticSimilarity * 100).toFixed(1)}%\n`
  explanation += `• 论点一致性: ${(argumentAlignment * 100).toFixed(1)}%\n`
  explanation += `• 结论收敛度: ${(conclusionConvergence * 100).toFixed(1)}%\n`
  explanation += `• 对话质量: ${(dialogueQuality * 100).toFixed(1)}%\n\n`
  
  if (hasConsensus) {
    explanation += "✅ 检测到共识：两个AI助手在核心观点上达成了一致。"
  } else {
    explanation += "❌ 尚未达成共识：建议继续讨论以寻求更好的一致性。"
  }
  
  return explanation
}

// 生成建议
function generateRecommendation(metrics: any, round: number, hasConsensus: boolean): string {
  if (hasConsensus) {
    return "建议总结讨论结果，生成最终答案。"
  }
  
  const { semanticSimilarity, argumentAlignment } = metrics
  
  if (semanticSimilarity < 0.5) {
    return "两个AI的观点差异较大，建议重新聚焦核心问题。"
  }
  
  if (argumentAlignment < 0.6) {
    return "论点一致性不足，建议进一步澄清关键分歧点。"
  }
  
  if (round > 4) {
    return "讨论轮次较多，建议寻找共同点并尝试达成部分共识。"
  }
  
  return "建议继续深入讨论，逐步缩小分歧。"
}