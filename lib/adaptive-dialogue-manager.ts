// 自适应对话管理算法
interface DialogueState {
  round: number
  topic: string
  complexity: number
  consensusProgress: number
  participantEngagement: number[]
  qualityTrend: 'improving' | 'stable' | 'declining'
}

interface DialogueStrategy {
  nextSpeaker: 'ai_a' | 'ai_b' | 'moderator'
  promptAdjustment: 'deeper' | 'broader' | 'refocus' | 'conclude'
  timeAllocation: number
  qualityThreshold: number
}

class AdaptiveDialogueManager {
  private dialogueHistory: DialogueState[] = []
  private performanceBaseline: number = 0.7
  
  /**
   * 智能对话流程控制算法
   */
  async manageDialogueFlow(
    currentState: DialogueState,
    responses: string[],
    consensusMetrics: any
  ): Promise<DialogueStrategy> {
    // 1. 分析当前对话状态
    const stateAnalysis = this.analyzeDialogueState(currentState, responses)
    
    // 2. 预测最优下一步
    const nextStrategy = this.predictOptimalStrategy(stateAnalysis, consensusMetrics)
    
    // 3. 动态调整策略
    const adaptiveStrategy = this.adaptStrategy(nextStrategy, this.dialogueHistory)
    
    // 4. 更新历史状态
    this.updateDialogueHistory(currentState, stateAnalysis)
    
    return adaptiveStrategy
  }

  /**
   * 对话状态深度分析
   */
  private analyzeDialogueState(state: DialogueState, responses: string[]): {
    topicDrift: number
    engagementLevel: number
    qualityScore: number
    convergenceRate: number
    efficiency: number
  } {
    return {
      topicDrift: this.calculateTopicDrift(responses),
      engagementLevel: this.calculateEngagementLevel(responses),
      qualityScore: this.calculateQualityScore(responses),
      convergenceRate: this.calculateConvergenceRate(state),
      efficiency: this.calculateEfficiency(state, responses)
    }
  }

  /**
   * 主题漂移检测算法
   */
  private calculateTopicDrift(responses: string[]): number {
    if (responses.length < 2) return 0
    
    const semanticVectors = responses.map(r => this.extractSemanticVector(r))
    let totalDrift = 0
    
    for (let i = 1; i < semanticVectors.length; i++) {
      const similarity = this.cosineSimilarity(semanticVectors[i-1], semanticVectors[i])
      totalDrift += (1 - similarity)
    }
    
    return totalDrift / (semanticVectors.length - 1)
  }

  /**
   * 参与度计算算法
   */
  private calculateEngagementLevel(responses: string[]): number {
    const engagementIndicators = [
      '我认为', '你提到的', '让我们', '我同意', '我想补充',
      '关于这个', '进一步来说', '另外', '此外', '然而'
    ]
    
    let totalEngagement = 0
    responses.forEach(response => {
      const indicators = engagementIndicators.filter(indicator => 
        response.includes(indicator)
      ).length
      totalEngagement += Math.min(indicators / 3, 1)
    })
    
    return responses.length > 0 ? totalEngagement / responses.length : 0
  }

  /**
   * 对话质量评分算法
   */
  private calculateQualityScore(responses: string[]): number {
    const qualityFactors = responses.map(response => ({
      length: Math.min(response.length / 500, 1),
      depth: this.calculateResponseDepth(response),
      clarity: this.calculateClarity(response),
      relevance: this.calculateRelevance(response)
    }))
    
    const avgQuality = qualityFactors.reduce((sum, factors) => 
      sum + (factors.length * 0.2 + factors.depth * 0.3 + 
             factors.clarity * 0.2 + factors.relevance * 0.3), 0
    ) / qualityFactors.length
    
    return avgQuality
  }

  /**
   * 收敛率计算
   */
  private calculateConvergenceRate(state: DialogueState): number {
    if (this.dialogueHistory.length < 2) return 0.5
    
    const recentHistory = this.dialogueHistory.slice(-3)
    const progressChanges = recentHistory.map((h, i) => 
      i > 0 ? h.consensusProgress - recentHistory[i-1].consensusProgress : 0
    ).slice(1)
    
    const avgProgress = progressChanges.reduce((sum, change) => sum + change, 0) / progressChanges.length
    return Math.max(0, Math.min(1, 0.5 + avgProgress))
  }

  /**
   * 效率计算算法
   */
  private calculateEfficiency(state: DialogueState, responses: string[]): number {
    const timeSpent = state.round
    const qualityAchieved = this.calculateQualityScore(responses)
    const progressMade = state.consensusProgress
    
    // 效率 = (质量 * 进度) / 时间成本
    const efficiency = (qualityAchieved * progressMade) / Math.max(timeSpent, 1)
    return Math.min(1, efficiency)
  }

  /**
   * 最优策略预测算法
   */
  private predictOptimalStrategy(
    analysis: any,
    consensusMetrics: any
  ): DialogueStrategy {
    // 基于多因素决策的策略选择
    const decisionFactors = {
      topicDrift: analysis.topicDrift,
      engagementLevel: analysis.engagementLevel,
      qualityScore: analysis.qualityScore,
      convergenceRate: analysis.convergenceRate,
      consensusConfidence: consensusMetrics.confidence || 0
    }

    // 决策树算法
    if (decisionFactors.consensusConfidence > 0.85) {
      return {
        nextSpeaker: 'moderator',
        promptAdjustment: 'conclude',
        timeAllocation: 0.5,
        qualityThreshold: 0.9
      }
    }

    if (decisionFactors.topicDrift > 0.6) {
      return {
        nextSpeaker: 'moderator',
        promptAdjustment: 'refocus',
        timeAllocation: 1.0,
        qualityThreshold: 0.8
      }
    }

    if (decisionFactors.qualityScore < 0.6) {
      return {
        nextSpeaker: this.selectBestPerformer(),
        promptAdjustment: 'deeper',
        timeAllocation: 1.5,
        qualityThreshold: 0.75
      }
    }

    if (decisionFactors.convergenceRate < 0.3) {
      return {
        nextSpeaker: this.selectAlternativeParticipant(),
        promptAdjustment: 'broader',
        timeAllocation: 1.2,
        qualityThreshold: 0.7
      }
    }

    // 默认策略：继续正常流程
    return {
      nextSpeaker: this.getNextSpeakerInRotation(),
      promptAdjustment: 'deeper',
      timeAllocation: 1.0,
      qualityThreshold: 0.75
    }
  }

  /**
   * 自适应策略调整
   */
  private adaptStrategy(
    baseStrategy: DialogueStrategy,
    history: DialogueState[]
  ): DialogueStrategy {
    const adaptedStrategy = { ...baseStrategy }
    
    // 基于历史表现调整
    if (history.length >= 3) {
      const recentPerformance = this.calculateRecentPerformance(history)
      
      if (recentPerformance < this.performanceBaseline) {
        // 性能下降，增加质量要求
        adaptedStrategy.qualityThreshold = Math.min(0.9, adaptedStrategy.qualityThreshold + 0.1)
        adaptedStrategy.timeAllocation *= 1.2
      } else if (recentPerformance > this.performanceBaseline + 0.2) {
        // 性能良好，可以加快进度
        adaptedStrategy.timeAllocation *= 0.9
        adaptedStrategy.qualityThreshold = Math.max(0.6, adaptedStrategy.qualityThreshold - 0.05)
      }
    }
    
    return adaptedStrategy
  }

  // 辅助方法实现
  private extractSemanticVector(text: string): number[] {
    // 简化的语义向量提取
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2)
    const vocabulary = new Set(words)
    const vector = Array.from(vocabulary).map(word => 
      words.filter(w => w === word).length / words.length
    )
    return vector.slice(0, 50) // 限制维度
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const maxLen = Math.max(a.length, b.length)
    const vecA = [...a, ...new Array(maxLen - a.length).fill(0)]
    const vecB = [...b, ...new Array(maxLen - b.length).fill(0)]
    
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0)
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0))
    
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0
  }

  private calculateResponseDepth(response: string): number {
    const depthIndicators = [
      '首先', '其次', '最后', '具体来说', '例如', '换句话说',
      '进一步', '深入分析', '根本原因', '综合考虑'
    ]
    
    const indicators = depthIndicators.filter(indicator => 
      response.includes(indicator)
    ).length
    
    return Math.min(1, indicators / 5)
  }

  private calculateClarity(response: string): number {
    const sentences = response.split(/[。！？]/).filter(s => s.trim().length > 0)
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
    
    // 清晰度与句子长度负相关（太长的句子不够清晰）
    const lengthScore = Math.max(0, 1 - (avgSentenceLength - 50) / 100)
    
    // 检查连接词使用
    const connectors = ['因此', '所以', '但是', '然而', '同时', '另外']
    const connectorScore = Math.min(1, connectors.filter(c => response.includes(c)).length / 3)
    
    return (lengthScore + connectorScore) / 2
  }

  private calculateRelevance(response: string): number {
    // 简化的相关性计算 - 实际应用中需要与问题主题比较
    const relevantTerms = ['问题', '解决', '方案', '建议', '分析', '结论']
    const relevantCount = relevantTerms.filter(term => response.includes(term)).length
    
    return Math.min(1, relevantCount / 4)
  }

  private selectBestPerformer(): 'ai_a' | 'ai_b' {
    // 基于历史表现选择最佳参与者
    if (this.dialogueHistory.length < 2) return 'ai_a'
    
    const recentHistory = this.dialogueHistory.slice(-3)
    const avgEngagementA = recentHistory.reduce((sum, h) => sum + (h.participantEngagement[0] || 0), 0) / recentHistory.length
    const avgEngagementB = recentHistory.reduce((sum, h) => sum + (h.participantEngagement[1] || 0), 0) / recentHistory.length
    
    return avgEngagementA > avgEngagementB ? 'ai_a' : 'ai_b'
  }

  private selectAlternativeParticipant(): 'ai_a' | 'ai_b' {
    // 选择与当前模式不同的参与者
    const lastSpeaker = this.getLastSpeaker()
    return lastSpeaker === 'ai_a' ? 'ai_b' : 'ai_a'
  }

  private getNextSpeakerInRotation(): 'ai_a' | 'ai_b' {
    const lastSpeaker = this.getLastSpeaker()
    return lastSpeaker === 'ai_a' ? 'ai_b' : 'ai_a'
  }

  private getLastSpeaker(): 'ai_a' | 'ai_b' {
    // 简化实现 - 实际需要从对话历史中获取
    return this.dialogueHistory.length % 2 === 0 ? 'ai_a' : 'ai_b'
  }

  private calculateRecentPerformance(history: DialogueState[]): number {
    const recent = history.slice(-3)
    return recent.reduce((sum, state) => sum + state.consensusProgress, 0) / recent.length
  }

  private updateDialogueHistory(currentState: DialogueState, analysis: any): void {
    this.dialogueHistory.push({
      ...currentState,
      qualityTrend: this.determineQualityTrend(analysis.qualityScore)
    })
    
    // 限制历史长度
    if (this.dialogueHistory.length > 10) {
      this.dialogueHistory = this.dialogueHistory.slice(-10)
    }
  }

  private determineQualityTrend(currentQuality: number): 'improving' | 'stable' | 'declining' {
    if (this.dialogueHistory.length < 2) return 'stable'
    
    const recentQualities = this.dialogueHistory.slice(-2).map(h => h.consensusProgress)
    const avgRecent = recentQualities.reduce((sum, q) => sum + q, 0) / recentQualities.length
    
    const threshold = 0.05
    if (currentQuality > avgRecent + threshold) return 'improving'
    if (currentQuality < avgRecent - threshold) return 'declining'
    return 'stable'
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions(state: DialogueState): string[] {
    const suggestions: string[] = []
    
    if (state.complexity > 0.8 && state.consensusProgress < 0.6) {
      suggestions.push('问题复杂度较高，建议分解为子问题逐步讨论')
    }
    
    if (state.participantEngagement.some(e => e < 0.5)) {
      suggestions.push('参与度不足，建议调整提示词增加互动性')
    }
    
    if (state.round > 4 && state.consensusProgress < 0.7) {
      suggestions.push('讨论轮次较多但进展缓慢，建议重新聚焦核心问题')
    }
    
    return suggestions
  }
}

export { AdaptiveDialogueManager }
export type { DialogueState, DialogueStrategy }