// 智能缓存管理系统
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

interface CacheStats {
  totalItems: number
  hitRate: number
  totalHits: number
  totalMisses: number
  memoryUsage: number
}

class CacheManager {
  private static instance: CacheManager
  private cache: Map<string, CacheItem<any>> = new Map()
  private hits = 0
  private misses = 0
  private readonly maxSize: number
  private readonly defaultTTL: number

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) { // 默认5分钟TTL
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    
    // 定期清理过期缓存
    setInterval(() => this.cleanup(), 60000) // 每分钟清理一次
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  // 设置缓存
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const timeToLive = ttl || this.defaultTTL

    // 如果缓存已满，删除最少使用的项
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: timeToLive,
      accessCount: 0,
      lastAccessed: now
    })
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    const now = Date.now()

    if (!item) {
      this.misses++
      return null
    }

    // 检查是否过期
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    // 更新访问统计
    item.accessCount++
    item.lastAccessed = now
    this.hits++

    return item.data as T
  }

  // 删除缓存
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // 检查缓存是否存在且未过期
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // 清理过期项
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`缓存清理: 删除了 ${cleaned} 个过期项`)
    }
  }

  // 驱逐最少使用的项
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null
    let minAccessCount = Infinity
    let oldestAccess = Infinity

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < minAccessCount || 
          (item.accessCount === minAccessCount && item.lastAccessed < oldestAccess)) {
        minAccessCount = item.accessCount
        oldestAccess = item.lastAccessed
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
      console.log(`缓存驱逐: 删除最少使用的项 ${leastUsedKey}`)
    }
  }

  // 获取缓存统计
  getStats(): CacheStats {
    const total = this.hits + this.misses
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0

    // 简单估算内存使用 (字节)
    const memoryUsage = JSON.stringify([...this.cache.values()]).length

    return {
      totalItems: this.cache.size,
      hitRate: Number(hitRate.toFixed(2)),
      totalHits: this.hits,
      totalMisses: this.misses,
      memoryUsage
    }
  }

  // 清空所有缓存
  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  // 预热常用缓存
  async warmup(warmupFunctions: Array<{ key: string; fn: () => Promise<any>; ttl?: number }>): Promise<void> {
    console.log('开始缓存预热...')
    
    const promises = warmupFunctions.map(async ({ key, fn, ttl }) => {
      try {
        const data = await fn()
        this.set(key, data, ttl)
        console.log(`缓存预热成功: ${key}`)
      } catch (error) {
        console.error(`缓存预热失败: ${key}`, error)
      }
    })

    await Promise.allSettled(promises)
    console.log('缓存预热完成')
  }

  // 获取热门缓存项
  getHotKeys(limit = 10): Array<{ key: string; accessCount: number; lastAccessed: Date }> {
    const items = [...this.cache.entries()]
      .map(([key, item]) => ({
        key,
        accessCount: item.accessCount,
        lastAccessed: new Date(item.lastAccessed)
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)

    return items
  }

  // 生成缓存报告
  generateReport(): string {
    const stats = this.getStats()
    const hotKeys = this.getHotKeys(5)

    return `
## 缓存管理报告

### 基础统计
- 缓存项数量: ${stats.totalItems}/${this.maxSize}
- 命中率: ${stats.hitRate}%
- 总命中次数: ${stats.totalHits}
- 总未命中次数: ${stats.totalMisses}
- 估算内存使用: ${(stats.memoryUsage / 1024).toFixed(2)} KB

### 热门缓存项 (Top 5)
${hotKeys.map(({ key, accessCount, lastAccessed }) => 
  `- ${key}: ${accessCount}次访问 (最后访问: ${lastAccessed.toLocaleString()})`
).join('\n')}

### 性能状态
${this.generateCacheRecommendations(stats)}
    `.trim()
  }

  private generateCacheRecommendations(stats: CacheStats): string {
    const recommendations: string[] = []

    if (stats.hitRate < 50) {
      recommendations.push('⚠️ 缓存命中率偏低，考虑调整TTL或缓存策略')
    } else if (stats.hitRate > 80) {
      recommendations.push('✅ 缓存命中率良好')
    }

    if (stats.totalItems > this.maxSize * 0.9) {
      recommendations.push('⚠️ 缓存接近容量上限，考虑增加maxSize或优化缓存策略')
    }

    if (stats.memoryUsage > 10 * 1024 * 1024) { // 10MB
      recommendations.push('⚠️ 缓存内存使用较高，考虑优化数据结构')
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 缓存运行状态良好')
    }

    return recommendations.join('\n')
  }
}

// 专用的AI响应缓存
export class AIResponseCache {
  private cacheManager: CacheManager

  constructor() {
    this.cacheManager = CacheManager.getInstance()
  }

  // 生成缓存键
  private generateKey(prompt: string, model: string, config: any): string {
    const hash = this.simpleHash(JSON.stringify({ prompt, model, config }))
    return `ai_response_${hash}`
  }

  // 简单哈希函数
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  // 缓存AI响应
  cacheResponse(prompt: string, model: string, config: any, response: string, ttl = 30 * 60 * 1000): void {
    const key = this.generateKey(prompt, model, config)
    this.cacheManager.set(key, response, ttl) // 默认30分钟
  }

  // 获取缓存的AI响应
  getCachedResponse(prompt: string, model: string, config: any): string | null {
    const key = this.generateKey(prompt, model, config)
    return this.cacheManager.get<string>(key)
  }

  // 检查是否有缓存
  hasCachedResponse(prompt: string, model: string, config: any): boolean {
    const key = this.generateKey(prompt, model, config)
    return this.cacheManager.has(key)
  }
}

export const cacheManager = CacheManager.getInstance()
export const aiResponseCache = new AIResponseCache()