// 智能缓存算法 - 基于语义相似度和使用模式
interface CacheEntry {
  key: string
  value: any
  timestamp: number
  accessCount: number
  lastAccess: number
  semanticVector: number[]
  quality: number
  relevanceScore: number
}

interface CachePattern {
  pattern: string
  frequency: number
  averageQuality: number
  commonContext: string[]
}

class IntelligentCachingAlgorithm {
  private cache: Map<string, CacheEntry> = new Map()
  private semanticIndex: Map<string, string[]> = new Map() // 语义索引
  private usagePatterns: CachePattern[] = []
  private maxCacheSize = 1000
  private qualityThreshold = 0.7
  private similarityThreshold = 0.8

  /**
   * 智能缓存存储算法
   */
  async set(
    key: string,
    value: any,
    context: string,
    quality: number = 0.8
  ): Promise<void> {
    // 1. 计算语义向量
    const semanticVector = await this.computeSemanticVector(key, context)
    
    // 2. 检查是否已存在语义相似的内容
    const similarEntries = await this.findSimilarEntries(semanticVector)
    
    // 3. 决定缓存策略
    const strategy = this.decideCachingStrategy(key, value, quality, similarEntries)
    
    switch (strategy.action) {
      case 'store':
        await this.storeEntry(key, value, semanticVector, quality, context)
        break
      case 'merge':
        await this.mergeWithExisting(key, value, strategy.target!, quality)
        break
      case 'update':
        await this.updateExisting(strategy.target!, value, quality)
        break
      case 'skip':
        // 不缓存低质量或重复内容
        break
    }

    // 4. 维护缓存大小
    await this.maintainCacheSize()
  }

  /**
   * 智能缓存检索算法
   */
  async get(key: string, context: string = ''): Promise<any> {
    // 1. 直接匹配
    const directMatch = this.cache.get(key)
    if (directMatch) {
      this.updateAccessStats(directMatch)
      return directMatch.value
    }

    // 2. 语义相似检索
    const semanticVector = await this.computeSemanticVector(key, context)
    const similarEntries = await this.findSimilarEntries(semanticVector)
    
    if (similarEntries.length > 0) {
      const bestMatch = this.selectBestMatch(similarEntries, semanticVector)
      if (bestMatch && bestMatch.relevanceScore > this.similarityThreshold) {
        this.updateAccessStats(bestMatch)
        return bestMatch.value
      }
    }

    // 3. 模式匹配检索
    const patternMatch = await this.findPatternMatch(key, context)
    if (patternMatch) {
      return patternMatch.value
    }

    return null
  }

  /**
   * 预测性缓存预热算法
   */
  async predictiveWarmup(recentQueries: string[], context: string[]): Promise<void> {
    // 1. 分析查询模式
    const patterns = this.analyzeQueryPatterns(recentQueries)
    
    // 2. 预测可能的查询
    const predictedQueries = this.predictUpcomingQueries(patterns, context)
    
    // 3. 预计算高概率查询
    for (const query of predictedQueries) {
      if (!this.cache.has(query.key)) {
        // 这里可以触发预计算逻辑
        console.log(`预测性缓存: ${query.key}, 概率: ${query.probability}`)
      }
    }
  }

  /**
   * 缓存质量评估算法
   */
  async evaluateCacheQuality(): Promise<{
    hitRate: number
    averageQuality: number
    semanticCoverage: number
    recommendations: string[]
  }> {
    const totalAccess = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0)
    const hitCount = Array.from(this.cache.values())
      .filter(entry => entry.accessCount > 0).length

    const hitRate = totalAccess > 0 ? hitCount / totalAccess : 0

    const averageQuality = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.quality, 0) / this.cache.size

    const semanticCoverage = this.calculateSemanticCoverage()

    const recommendations = this.generateCacheRecommendations()

    return {
      hitRate,
      averageQuality,
      semanticCoverage,
      recommendations
    }
  }

  // 私有方法实现
  private async computeSemanticVector(key: string, context: string): Promise<number[]> {
    const text = `${key} ${context}`.toLowerCase()
    const words = text.split(/\W+/).filter(w => w.length > 2)
    
    // 简化的TF-IDF向量
    const termFreq = new Map<string, number>()
    words.forEach(word => {
      termFreq.set(word, (termFreq.get(word) || 0) + 1)
    })

    // 生成固定长度向量
    const vocabularySize = 100
    const vector = new Array(vocabularySize).fill(0)
    
    Array.from(termFreq.entries()).forEach(([term, freq], index) => {
      if (index < vocabularySize) {
        vector[index] = freq / words.length
      }
    })

    return vector
  }

  private async findSimilarEntries(targetVector: number[]): Promise<CacheEntry[]> {
    const similarities: Array<{entry: CacheEntry, similarity: number}> = []

    for (const entry of this.cache.values()) {
      const similarity = this.cosineSimilarity(targetVector, entry.semanticVector)
      if (similarity > 0.5) {
        similarities.push({ entry, similarity })
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(item => ({ ...item.entry, relevanceScore: item.similarity }))
  }

  private decideCachingStrategy(
    key: string,
    value: any,
    quality: number,
    similarEntries: CacheEntry[]
  ): {
    action: 'store' | 'merge' | 'update' | 'skip'
    target?: CacheEntry
  } {
    // 质量太低，跳过
    if (quality < this.qualityThreshold) {
      return { action: 'skip' }
    }

    // 没有相似条目，直接存储
    if (similarEntries.length === 0) {
      return { action: 'store' }
    }

    const mostSimilar = similarEntries[0]
    
    // 高度相似且质量更高，更新现有条目
    if (mostSimilar.relevanceScore > 0.9 && quality > mostSimilar.quality) {
      return { action: 'update', target: mostSimilar }
    }

    // 中等相似度，考虑合并
    if (mostSimilar.relevanceScore > 0.7) {
      return { action: 'merge', target: mostSimilar }
    }

    // 默认存储新条目
    return { action: 'store' }
  }

  private async storeEntry(
    key: string,
    value: any,
    semanticVector: number[],
    quality: number,
    context: string
  ): Promise<void> {
    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccess: Date.now(),
      semanticVector,
      quality,
      relevanceScore: 1.0
    }

    this.cache.set(key, entry)
    this.updateSemanticIndex(key, semanticVector)
    this.updateUsagePatterns(key, context)
  }

  private async mergeWithExisting(
    key: string,
    value: any,
    target: CacheEntry,
    quality: number
  ): Promise<void> {
    // 合并策略：保留更高质量的内容
    if (quality > target.quality) {
      target.value = this.mergeValues(target.value, value)
      target.quality = Math.max(target.quality, quality)
      target.lastAccess = Date.now()
    }
  }

  private async updateExisting(
    target: CacheEntry,
    value: any,
    quality: number
  ): Promise<void> {
    target.value = value
    target.quality = quality
    target.lastAccess = Date.now()
    target.accessCount += 1
  }

  private async maintainCacheSize(): Promise<void> {
    if (this.cache.size <= this.maxCacheSize) return

    // LRU + 质量评分的组合策略
    const entries = Array.from(this.cache.entries())
    const sortedEntries = entries.sort((a, b) => {
      const scoreA = this.calculateEvictionScore(a[1])
      const scoreB = this.calculateEvictionScore(b[1])
      return scoreA - scoreB // 分数越低越优先被删除
    })

    const toRemove = sortedEntries.slice(0, this.cache.size - this.maxCacheSize)
    toRemove.forEach(([key]) => {
      this.cache.delete(key)
      this.removeFromSemanticIndex(key)
    })
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now()
    const ageFactor = (now - entry.lastAccess) / (1000 * 60 * 60) // 小时
    const accessFactor = Math.log(entry.accessCount + 1)
    const qualityFactor = entry.quality

    // 组合评分：质量高、访问多、时间新的条目得分高
    return qualityFactor * 0.4 + accessFactor * 0.3 - (ageFactor * 0.3)
  }

  private updateAccessStats(entry: CacheEntry): void {
    entry.accessCount += 1
    entry.lastAccess = Date.now()
  }

  private selectBestMatch(entries: CacheEntry[], targetVector: number[]): CacheEntry | null {
    if (entries.length === 0) return null

    return entries.reduce((best, current) => {
      const currentScore = current.relevanceScore * current.quality * 
                          Math.log(current.accessCount + 1)
      const bestScore = best.relevanceScore * best.quality * 
                       Math.log(best.accessCount + 1)
      
      return currentScore > bestScore ? current : best
    })
  }

  private async findPatternMatch(key: string, context: string): Promise<CacheEntry | null> {
    const matchingPatterns = this.usagePatterns.filter(pattern => 
      key.includes(pattern.pattern) && pattern.frequency > 2
    )

    if (matchingPatterns.length === 0) return null

    const bestPattern = matchingPatterns.reduce((best, current) => 
      current.averageQuality > best.averageQuality ? current : best
    )

    // 查找匹配模式的缓存条目
    for (const [cacheKey, entry] of this.cache) {
      if (cacheKey.includes(bestPattern.pattern)) {
        return entry
      }
    }

    return null
  }

  private analyzeQueryPatterns(queries: string[]): Map<string, number> {
    const patterns = new Map<string, number>()
    
    queries.forEach(query => {
      const words = query.toLowerCase().split(/\W+/)
      words.forEach(word => {
        if (word.length > 3) {
          patterns.set(word, (patterns.get(word) || 0) + 1)
        }
      })
    })

    return patterns
  }

  private predictUpcomingQueries(
    patterns: Map<string, number>,
    context: string[]
  ): Array<{key: string, probability: number}> {
    const predictions: Array<{key: string, probability: number}> = []
    
    // 基于模式频率预测
    for (const [pattern, frequency] of patterns) {
      if (frequency > 2) {
        const probability = Math.min(frequency / 10, 0.9)
        context.forEach(ctx => {
          predictions.push({
            key: `${pattern} ${ctx}`,
            probability
          })
        })
      }
    }

    return predictions.sort((a, b) => b.probability - a.probability).slice(0, 10)
  }

  private calculateSemanticCoverage(): number {
    // 计算语义空间覆盖度
    const vectors = Array.from(this.cache.values()).map(entry => entry.semanticVector)
    if (vectors.length < 2) return 0

    let totalDistance = 0
    let comparisons = 0

    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        const distance = 1 - this.cosineSimilarity(vectors[i], vectors[j])
        totalDistance += distance
        comparisons++
      }
    }

    return comparisons > 0 ? totalDistance / comparisons : 0
  }

  private generateCacheRecommendations(): string[] {
    const recommendations: string[] = []
    
    const avgQuality = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.quality, 0) / this.cache.size

    if (avgQuality < 0.7) {
      recommendations.push('缓存平均质量偏低，建议提高质量阈值')
    }

    const hitRate = this.calculateHitRate()
    if (hitRate < 0.3) {
      recommendations.push('缓存命中率偏低，建议优化相似度检索算法')
    }

    const oldEntries = Array.from(this.cache.values())
      .filter(entry => Date.now() - entry.lastAccess > 24 * 60 * 60 * 1000).length

    if (oldEntries > this.cache.size * 0.3) {
      recommendations.push('存在大量长时间未访问的缓存，建议调整LRU策略')
    }

    return recommendations
  }

  private calculateHitRate(): number {
    const totalEntries = this.cache.size
    const accessedEntries = Array.from(this.cache.values())
      .filter(entry => entry.accessCount > 0).length
    
    return totalEntries > 0 ? accessedEntries / totalEntries : 0
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
    
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0
  }

  private updateSemanticIndex(key: string, vector: number[]): void {
    // 更新语义索引以加速检索
    const primaryTerms = this.extractPrimaryTerms(vector)
    primaryTerms.forEach(term => {
      if (!this.semanticIndex.has(term)) {
        this.semanticIndex.set(term, [])
      }
      this.semanticIndex.get(term)!.push(key)
    })
  }

  private removeFromSemanticIndex(key: string): void {
    for (const [term, keys] of this.semanticIndex) {
      const index = keys.indexOf(key)
      if (index > -1) {
        keys.splice(index, 1)
        if (keys.length === 0) {
          this.semanticIndex.delete(term)
        }
      }
    }
  }

  private extractPrimaryTerms(vector: number[]): string[] {
    // 提取向量中的主要特征项
    return vector
      .map((value, index) => ({ value, index }))
      .filter(item => item.value > 0.1)
      .slice(0, 5)
      .map(item => `term_${item.index}`)
  }

  private updateUsagePatterns(key: string, context: string): void {
    const pattern = this.extractPattern(key)
    const existing = this.usagePatterns.find(p => p.pattern === pattern)
    
    if (existing) {
      existing.frequency += 1
      existing.commonContext.push(context)
    } else {
      this.usagePatterns.push({
        pattern,
        frequency: 1,
        averageQuality: 0.8,
        commonContext: [context]
      })
    }

    // 限制模式数量
    if (this.usagePatterns.length > 100) {
      this.usagePatterns.sort((a, b) => b.frequency - a.frequency)
      this.usagePatterns = this.usagePatterns.slice(0, 100)
    }
  }

  private extractPattern(key: string): string {
    // 提取查询模式
    const words = key.toLowerCase().split(/\W+/).filter(w => w.length > 2)
    return words.slice(0, 3).join(' ')
  }

  private mergeValues(existing: any, newValue: any): any {
    // 简化的值合并策略
    if (typeof existing === 'string' && typeof newValue === 'string') {
      return existing.length > newValue.length ? existing : newValue
    }
    return newValue
  }
}

export { IntelligentCachingAlgorithm }
export type { CacheEntry, CachePattern }