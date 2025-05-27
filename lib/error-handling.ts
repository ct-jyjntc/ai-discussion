// 增强的错误处理和重试机制
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: string[]
}

interface ErrorLog {
  timestamp: Date
  error: string
  context: string
  retryCount: number
  resolved: boolean
}

class ErrorHandler {
  private static instance: ErrorHandler
  private errorLogs: ErrorLog[] = []
  
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'Rate limit exceeded',
      'Service temporarily unavailable',
      '429',
      '500',
      '502',
      '503',
      '504'
    ]
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // 带重试的异步函数执行器
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...customConfig }
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await fn()
        
        // 如果之前有错误但现在成功了，标记为已解决
        if (lastError) {
          this.logError(lastError.message, context, attempt - 1, true)
        }
        
        return result
      } catch (error: any) {
        lastError = error
        
        // 检查是否是可重试的错误
        const isRetryable = this.isRetryableError(error, config.retryableErrors)
        
        if (!isRetryable || attempt === config.maxRetries) {
          this.logError(error.message, context, attempt, false)
          throw new Error(`执行失败 (${context}): ${error.message}`)
        }
        
        // 计算延迟时间 (指数退避)
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        )
        
        console.warn(`尝试 ${attempt + 1}/${config.maxRetries + 1} 失败 (${context}): ${error.message}. ${delay}ms 后重试...`)
        
        await this.sleep(delay)
      }
    }
    
    throw lastError
  }

  // 检查错误是否可重试
  private isRetryableError(error: any, retryableErrors: string[]): boolean {
    const errorMessage = error.message || error.toString()
    const errorCode = error.code || error.status?.toString()
    
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError) || 
      errorCode === retryableError
    )
  }

  // 记录错误
  private logError(error: string, context: string, retryCount: number, resolved: boolean): void {
    this.errorLogs.push({
      timestamp: new Date(),
      error,
      context,
      retryCount,
      resolved
    })
    
    // 保持最近1000条错误记录
    if (this.errorLogs.length > 1000) {
      this.errorLogs = this.errorLogs.slice(-1000)
    }
  }

  // 获取错误统计
  getErrorStats(): {
    totalErrors: number
    resolvedErrors: number
    topErrors: Array<{ error: string; count: number }>
    topContexts: Array<{ context: string; count: number }>
    recentErrors: ErrorLog[]
  } {
    const recentErrors = this.errorLogs.slice(-10)
    const resolvedErrors = this.errorLogs.filter(log => log.resolved).length
    
    // 统计最常见的错误
    const errorCounts: Record<string, number> = {}
    const contextCounts: Record<string, number> = {}
    
    this.errorLogs.forEach(log => {
      errorCounts[log.error] = (errorCounts[log.error] || 0) + 1
      contextCounts[log.context] = (contextCounts[log.context] || 0) + 1
    })
    
    const topErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }))
    
    const topContexts = Object.entries(contextCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([context, count]) => ({ context, count }))

    return {
      totalErrors: this.errorLogs.length,
      resolvedErrors,
      topErrors,
      topContexts,
      recentErrors
    }
  }

  // 生成错误报告
  generateErrorReport(): string {
    const stats = this.getErrorStats()
    const errorRate = stats.totalErrors > 0 ? ((stats.totalErrors - stats.resolvedErrors) / stats.totalErrors * 100).toFixed(1) : '0'
    
    return `
## 错误处理报告

### 错误统计
- 总错误数: ${stats.totalErrors}
- 已解决错误: ${stats.resolvedErrors}
- 未解决错误率: ${errorRate}%

### 最常见错误
${stats.topErrors.map(({ error, count }) => `- ${error}: ${count}次`).join('\n')}

### 问题最多的上下文
${stats.topContexts.map(({ context, count }) => `- ${context}: ${count}次`).join('\n')}

### 最近错误 (最新10条)
${stats.recentErrors.map(log => 
  `- [${log.timestamp.toLocaleString()}] ${log.context}: ${log.error} ${log.resolved ? '✅已解决' : '❌未解决'}`
).join('\n')}

### 建议
${this.generateErrorRecommendations(stats)}
    `.trim()
  }

  private generateErrorRecommendations(stats: any): string {
    const recommendations: string[] = []
    
    if (stats.totalErrors - stats.resolvedErrors > stats.totalErrors * 0.3) {
      recommendations.push('未解决错误率较高，建议增加更多可重试的错误类型')
    }
    
    const networkErrors = stats.topErrors.filter(({ error }: { error: string; count: number }) =>
      error.includes('ECONNRESET') || error.includes('ETIMEDOUT') || error.includes('ENOTFOUND')
    )
    if (networkErrors.length > 0) {
      recommendations.push('网络相关错误较多，建议优化网络配置或增加超时时间')
    }
    
    const rateLimit = stats.topErrors.find(({ error }: { error: string; count: number }) => error.includes('429') || error.includes('Rate limit'))
    if (rateLimit) {
      recommendations.push('遇到API速率限制，建议实现请求队列或增加延迟')
    }

    if (recommendations.length === 0) {
      recommendations.push('错误处理运行良好，继续监控')
    }

    return recommendations.map(rec => `- ${rec}`).join('\n')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 清理旧的错误日志
  clearOldLogs(daysToKeep: number = 7): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    this.errorLogs = this.errorLogs.filter(log => log.timestamp >= cutoffDate)
  }
}

// 全局错误处理函数
export function handleStreamingError(error: any, context: string): Response {
  console.error(`流式处理错误 (${context}):`, error)
  
  const errorHandler = ErrorHandler.getInstance()
  errorHandler['logError'](error.message, context, 0, false)
  
  return new Response(
    JSON.stringify({ 
      error: '服务暂时不可用，请稍后重试',
      details: error.message,
      context 
    }), 
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

export const errorHandler = ErrorHandler.getInstance()
export type { RetryConfig, ErrorLog }