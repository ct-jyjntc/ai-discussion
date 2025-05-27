// 动态共识检测算法
interface ConsensusMetrics {
  semanticSimilarity: number    // 语义相似度 (0-1)
  argumentAlignment: number     // 论点一致性 (0-1)
  evidenceConsistency: number   // 证据一致性 (0-1)
  conclusionConvergence: number // 结论收敛度 (0-1)
  dialogueQuality: number       // 对话质量 (0-1)
}

interface ConsensusEvolution {
  timestamp: number
  round: number
  metrics: ConsensusMetrics
  confidence: number
  trend: 'converging' | 'diverging' | 'stable' | 'oscillating'
}

class DynamicConsensusDetector {
  private consensusHistory: ConsensusEvolution[] = []
  private vectorSimilarityThreshold = 0.75
  private convergenceWindow = 3  // 观察窗口大小

  /**
   * 多维度共识检测算法
   */
  async detectConsensusAdvanced(
    question: string,
    aiResponseA: string,
    aiResponseB: string,
    round: number,
    discussionHistory: string[]
  ): Promise<{
    hasConsensus: boolean
    confidence: number
    metrics: ConsensusMetrics
    evolution: ConsensusEvolution
    recommendation: ConsensusRecommendation
  }> {
    // 1. 计算多维度共识指标
    const metrics = await this.calculateConsensusMetrics(
      question, aiResponseA, aiResponseB, discussionHistory
    )

    // 2. 分析共识演进趋势
    const evolution = this.analyzeConsensusEvolution(metrics, round)
    
    // 3. 基于机器学习模型预测共识概率
    const consensusProbability = this.predictConsensusProbability(
      metrics, evolution, round
    )

    // 4. 生成动态建议
    const recommendation = this.generateDynamicRecommendation(
      metrics, evolution, consensusProbability
    )

    const hasConsensus = consensusProbability > 0.8 && 
                        metrics.semanticSimilarity > this.vectorSimilarityThreshold

    return {
      hasConsensus,
      confidence: consensusProbability,
      metrics,
      evolution,
      recommendation
    }
  }

  /**
   * 计算多维度共识指标
   */
  private async calculateConsensusMetrics(
    question: string,
    responseA: string,
    responseB: string,
    history: string[]
  ): Promise<ConsensusMetrics> {
    return {
      semanticSimilarity: await this.calculateSemanticSimilarity(responseA, responseB),
      argumentAlignment: this.calculateArgumentAlignment(responseA, responseB),
      evidenceConsistency: this.calculateEvidenceConsistency(responseA, responseB),
      conclusionConvergence: this.calculateConclusionConvergence(responseA, responseB),
      dialogueQuality: this.assessDialogueQuality(question, responseA, responseB, history)
    }
  }

  /**
   * 语义相似度计算 - 使用余弦相似度
   */
  private async calculateSemanticSimilarity(textA: string, textB: string): Promise<number> {
    const vectorA = this.textToVector(textA)
    const vectorB = this.textToVector(textB)
    
    return this.cosineSimilarity(vectorA, vectorB)
  }

  /**
   * 论点一致性分析
   */
  private calculateArgumentAlignment(responseA: string, responseB: string): number {
    const argumentsA = this.extractArguments(responseA)
    const argumentsB = this.extractArguments(responseB)
    
    if (argumentsA.length === 0 || argumentsB.length === 0) return 0
    
    let alignmentScore = 0
    let totalComparisons = 0
    
    for (const argA of argumentsA) {
      for (const argB of argumentsB) {
        const similarity = this.compareArguments(argA, argB)
        alignmentScore += similarity
        totalComparisons++
      }
    }
    
    return totalComparisons > 0 ? alignmentScore / totalComparisons : 0
  }

  /**
   * 证据一致性评估
   */
  private calculateEvidenceConsistency(responseA: string, responseB: string): number {
    const evidenceA = this.extractEvidence(responseA)
    const evidenceB = this.extractEvidence(responseB)
    
    if (evidenceA.length === 0 && evidenceB.length === 0) return 1
    if (evidenceA.length === 0 || evidenceB.length === 0) return 0.5
    
    let consistencyScore = 0
    let conflictCount = 0
    
    for (const evA of evidenceA) {
      for (const evB of evidenceB) {
        const consistency = this.compareEvidence(evA, evB)
        if (consistency < 0.3) conflictCount++
        consistencyScore += consistency
      }
    }
    
    const avgConsistency = consistencyScore / (evidenceA.length * evidenceB.length)
    const conflictPenalty = conflictCount / (evidenceA.length * evidenceB.length)
    
    return Math.max(0, avgConsistency - conflictPenalty * 0.5)
  }

  /**
   * 结论收敛度计算
   */
  private calculateConclusionConvergence(responseA: string, responseB: string): number {
    const conclusionA = this.extractConclusion(responseA)
    const conclusionB = this.extractConclusion(responseB)
    
    if (!conclusionA || !conclusionB) return 0
    
    // 分析结论的关键要素
    const elementsA = this.extractConclusionElements(conclusionA)
    const elementsB = this.extractConclusionElements(conclusionB)
    
    const commonElements = elementsA.filter(elem => 
      elementsB.some(elemB => this.elementsMatch(elem, elemB))
    )
    
    const convergenceRatio = commonElements.length / 
                           Math.max(elementsA.length, elementsB.length)
    
    return convergenceRatio
  }

  /**
   * 对话质量评估
   */
  private assessDialogueQuality(
    question: string,
    responseA: string,
    responseB: string,
    history: string[]
  ): number {
    const qualityFactors = {
      relevance: this.calculateRelevanceToQuestion(question, [responseA, responseB]),
      depth: this.calculateResponseDepth(responseA, responseB),
      progression: this.calculateProgressionQuality(history),
      engagement: this.calculateEngagementLevel(responseA, responseB)
    }
    
    return (
      qualityFactors.relevance * 0.3 +
      qualityFactors.depth * 0.3 +
      qualityFactors.progression * 0.2 +
      qualityFactors.engagement * 0.2
    )
  }

  /**
   * 共识演进趋势分析
   */
  private analyzeConsensusEvolution(metrics: ConsensusMetrics, round: number): ConsensusEvolution {
    const evolution: ConsensusEvolution = {
      timestamp: Date.now(),
      round,
      metrics,
      confidence: this.calculateOverallConfidence(metrics),
      trend: 'stable'
    }

    // 分析趋势
    if (this.consensusHistory.length >= 2) {
      const recent = this.consensusHistory.slice(-this.convergenceWindow)
      evolution.trend = this.determineTrend(recent, evolution)
    }

    this.consensusHistory.push(evolution)
    return evolution
  }

  /**
   * 基于机器学习的共识概率预测
   */
  private predictConsensusProbability(
    metrics: ConsensusMetrics,
    evolution: ConsensusEvolution,
    round: number
  ): number {
    // 特征向量构建
    const features = [
      metrics.semanticSimilarity,
      metrics.argumentAlignment,
      metrics.evidenceConsistency,
      metrics.conclusionConvergence,
      metrics.dialogueQuality,
      round / 10,  // 归一化轮次
      evolution.confidence,
      this.calculateTrendScore(evolution.trend)
    ]

    // 简化的逻辑回归模型
    const weights = [0.25, 0.2, 0.15, 0.2, 0.1, -0.05, 0.1, 0.05]
    const bias = -0.1

    const logit = features.reduce((sum, feature, index) => 
      sum + feature * weights[index], bias
    )

    return this.sigmoid(logit)
  }

  /**
   * 生成动态建议
   */
  private generateDynamicRecommendation(
    metrics: ConsensusMetrics,
    evolution: ConsensusEvolution,
    probability: number
  ): ConsensusRecommendation {
    if (probability > 0.8) {
      return {
        action: 'consensus',
        confidence: probability,
        reason: '多维度指标显示已达成高质量共识',
        nextSteps: ['生成最终答案', '总结关键观点']
      }
    }

    if (evolution.trend === 'converging' && probability > 0.6) {
      return {
        action: 'continue',
        confidence: probability,
        reason: '共识正在形成，建议继续深入讨论',
        nextSteps: ['进一步澄清差异点', '寻找更多支撑证据']
      }
    }

    if (evolution.trend === 'diverging') {
      return {
        action: 'redirect',
        confidence: probability,
        reason: '观点出现分歧，需要重新聚焦',
        nextSteps: ['回到核心问题', '重新定义讨论范围']
      }
    }

    if (metrics.dialogueQuality < 0.5) {
      return {
        action: 'improve_quality',
        confidence: probability,
        reason: '对话质量需要提升',
        nextSteps: ['提供更具体的例子', '增加论证深度']
      }
    }

    return {
      action: 'continue',
      confidence: probability,
      reason: '继续讨论以达成更好的共识',
      nextSteps: ['保持当前讨论方向', '逐步深入分析']
    }
  }

  // 辅助方法实现
  private textToVector(text: string): number[] {
    // 简化的文本向量化 - 实际应用中可以使用词向量模型
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2)
    const wordFreq = new Map<string, number>()
    
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    })
    
    // 返回前50个最频繁词的频率向量
    return Array.from(wordFreq.values()).slice(0, 50)
  }

  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    const maxLen = Math.max(vectorA.length, vectorB.length)
    const a = [...vectorA, ...new Array(maxLen - vectorA.length).fill(0)]
    const b = [...vectorB, ...new Array(maxLen - vectorB.length).fill(0)]
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
    
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0
  }

  private extractArguments(text: string): string[] {
    // 提取论点的简化实现
    return text.split(/[。！？]/)
      .filter(sentence => sentence.length > 10)
      .filter(sentence => /因为|由于|所以|因此|导致/.test(sentence))
  }

  private compareArguments(argA: string, argB: string): number {
    return this.cosineSimilarity(this.textToVector(argA), this.textToVector(argB))
  }

  private extractEvidence(text: string): string[] {
    // 提取证据的简化实现
    const evidencePatterns = [
      /根据.*?[，。]/g,
      /研究表明.*?[，。]/g,
      /数据显示.*?[，。]/g,
      /例如.*?[，。]/g
    ]
    
    const evidence: string[] = []
    evidencePatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) evidence.push(...matches)
    })
    
    return evidence
  }

  private compareEvidence(evA: string, evB: string): number {
    // 检查证据是否冲突或支持
    const conflictWords = ['但是', '然而', '相反', '不同', '错误']
    const supportWords = ['同样', '类似', '一致', '证实', '支持']
    
    const hasConflict = conflictWords.some(word => 
      evA.includes(word) || evB.includes(word)
    )
    const hasSupport = supportWords.some(word => 
      evA.includes(word) || evB.includes(word)
    )
    
    if (hasConflict) return 0.2
    if (hasSupport) return 0.8
    
    return this.cosineSimilarity(this.textToVector(evA), this.textToVector(evB))
  }

  private extractConclusion(text: string): string | null {
    const conclusionPatterns = [
      /总之.*?[。！？]/,
      /综上.*?[。！？]/,
      /因此.*?[。！？]/,
      /所以.*?[。！？]/
    ]
    
    for (const pattern of conclusionPatterns) {
      const match = text.match(pattern)
      if (match) return match[0]
    }
    
    // 如果没有明显的结论标识，取最后一句
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0)
    return sentences.length > 0 ? sentences[sentences.length - 1] : null
  }

  private extractConclusionElements(conclusion: string): string[] {
    return conclusion.split(/[，、；]/)
      .map(elem => elem.trim())
      .filter(elem => elem.length > 2)
  }

  private elementsMatch(elemA: string, elemB: string): boolean {
    return this.cosineSimilarity(this.textToVector(elemA), this.textToVector(elemB)) > 0.6
  }

  private calculateRelevanceToQuestion(question: string, responses: string[]): number {
    const questionVector = this.textToVector(question)
    const similarities = responses.map(response => 
      this.cosineSimilarity(questionVector, this.textToVector(response))
    )
    
    return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length
  }

  private calculateResponseDepth(responseA: string, responseB: string): number {
    const depthFactors = {
      length: Math.min((responseA.length + responseB.length) / 1000, 1),
      complexity: this.calculateComplexity(responseA + responseB),
      examples: this.countExamples(responseA + responseB),
      references: this.countReferences(responseA + responseB)
    }
    
    return (
      depthFactors.length * 0.2 +
      depthFactors.complexity * 0.4 +
      depthFactors.examples * 0.2 +
      depthFactors.references * 0.2
    )
  }

  private calculateProgressionQuality(history: string[]): number {
    if (history.length < 2) return 0.5
    
    let progression = 0
    for (let i = 1; i < history.length; i++) {
      const similarity = this.cosineSimilarity(
        this.textToVector(history[i-1]),
        this.textToVector(history[i])
      )
      // 好的进展应该有适度的相似性（不是重复，也不是完全无关）
      progression += similarity > 0.3 && similarity < 0.8 ? 1 : 0
    }
    
    return progression / (history.length - 1)
  }

  private calculateEngagementLevel(responseA: string, responseB: string): number {
    const engagementIndicators = [
      '我同意', '我认为', '你提到的', '你说得对', '我想补充',
      '关于你的观点', '我有不同看法', '让我们考虑'
    ]
    
    const engagementCount = engagementIndicators.reduce((count, indicator) => 
      count + (responseA.includes(indicator) ? 1 : 0) + 
              (responseB.includes(indicator) ? 1 : 0), 0
    )
    
    return Math.min(engagementCount / 4, 1)
  }

  private calculateOverallConfidence(metrics: ConsensusMetrics): number {
    const weights = [0.3, 0.25, 0.2, 0.15, 0.1]
    const values = [
      metrics.semanticSimilarity,
      metrics.argumentAlignment,
      metrics.evidenceConsistency,
      metrics.conclusionConvergence,
      metrics.dialogueQuality
    ]
    
    return values.reduce((sum, val, i) => sum + val * weights[i], 0)
  }

  private determineTrend(recent: ConsensusEvolution[], current: ConsensusEvolution): 'converging' | 'diverging' | 'stable' | 'oscillating' {
    if (recent.length < 2) return 'stable'
    
    const confidences = recent.map(r => r.confidence)
    confidences.push(current.confidence)
    
    const trend = this.calculateTrendDirection(confidences)
    const variance = this.calculateVariance(confidences)
    
    if (variance > 0.1) return 'oscillating'
    if (trend > 0.05) return 'converging'
    if (trend < -0.05) return 'diverging'
    return 'stable'
  }

  private calculateTrendDirection(values: number[]): number {
    if (values.length < 2) return 0
    
    let trendSum = 0
    for (let i = 1; i < values.length; i++) {
      trendSum += values[i] - values[i-1]
    }
    
    return trendSum / (values.length - 1)
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }

  private calculateTrendScore(trend: 'converging' | 'diverging' | 'stable' | 'oscillating'): number {
    const scores: Record<string, number> = {
      'converging': 1,
      'stable': 0.5,
      'diverging': 0,
      'oscillating': 0.3
    }
    return scores[trend] || 0.5
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x))
  }

  private calculateComplexity(text: string): number {
    const complexWords = text.split(/\W+/).filter(word => word.length > 8)
    const totalWords = text.split(/\W+/).length
    return totalWords > 0 ? complexWords.length / totalWords : 0
  }

  private countExamples(text: string): number {
    const examplePatterns = ['例如', '比如', '举例', '示例', '案例']
    return examplePatterns.reduce((count, pattern) => 
      count + (text.match(new RegExp(pattern, 'g')) || []).length, 0
    ) / 10
  }

  private countReferences(text: string): number {
    const referencePatterns = ['根据', '参考', '引用', '文献', '研究']
    return referencePatterns.reduce((count, pattern) => 
      count + (text.match(new RegExp(pattern, 'g')) || []).length, 0
    ) / 10
  }
}

interface ConsensusRecommendation {
  action: 'consensus' | 'continue' | 'redirect' | 'improve_quality'
  confidence: number
  reason: string
  nextSteps: string[]
}

export { DynamicConsensusDetector }
export type { ConsensusMetrics, ConsensusEvolution, ConsensusRecommendation }