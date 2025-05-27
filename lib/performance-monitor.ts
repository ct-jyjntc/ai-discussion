// 性能监控工具
interface PerformanceMetrics {
  questionAnalysisTime: number
  aiResponseTime: number
  consensusDetectionTime: number
  totalConversationTime: number
  streamingLatency: number
  questionMatchScore: number
  systemAdjustmentCount: number
}

interface MetricsStore {
  [sessionId: string]: PerformanceMetrics[]
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: MetricsStore = {}
  private timers: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTimer(label: string): void {
    this.timers.set(label, Date.now())
  }

  endTimer(label: string): number {
    const startTime = this.timers.get(label)
    if (!startTime) return 0
    
    const duration = Date.now() - startTime
    this.timers.delete(label)
    return duration
  }

  recordMetrics(sessionId: string, metrics: Partial<PerformanceMetrics>): void {
    if (!this.metrics[sessionId]) {
      this.metrics[sessionId] = []
    }
    
    const existingMetrics = this.metrics[sessionId][this.metrics[sessionId].length - 1] || {}
    this.metrics[sessionId].push({
      ...existingMetrics,
      ...metrics
    } as PerformanceMetrics)
  }

  getSessionMetrics(sessionId: string): PerformanceMetrics[] {
    return this.metrics[sessionId] || []
  }

  getAggregatedMetrics(): {
    avgQuestionAnalysisTime: number
    avgAiResponseTime: number
    avgConsensusDetectionTime: number
    avgQuestionMatchScore: number
    totalSystemAdjustments: number
    totalSessions: number
  } {
    const allMetrics = Object.values(this.metrics).flat()
    
    if (allMetrics.length === 0) {
      return {
        avgQuestionAnalysisTime: 0,
        avgAiResponseTime: 0,
        avgConsensusDetectionTime: 0,
        avgQuestionMatchScore: 0,
        totalSystemAdjustments: 0,
        totalSessions: 0
      }
    }

    return {
      avgQuestionAnalysisTime: allMetrics.reduce((sum, m) => sum + (m.questionAnalysisTime || 0), 0) / allMetrics.length,
      avgAiResponseTime: allMetrics.reduce((sum, m) => sum + (m.aiResponseTime || 0), 0) / allMetrics.length,
      avgConsensusDetectionTime: allMetrics.reduce((sum, m) => sum + (m.consensusDetectionTime || 0), 0) / allMetrics.length,
      avgQuestionMatchScore: allMetrics.reduce((sum, m) => sum + (m.questionMatchScore || 0), 0) / allMetrics.length,
      totalSystemAdjustments: allMetrics.reduce((sum, m) => sum + (m.systemAdjustmentCount || 0), 0),
      totalSessions: Object.keys(this.metrics).length
    }
  }

  // 检测性能异常
  detectPerformanceIssues(): string[] {
    const issues: string[] = []
    const aggregated = this.getAggregatedMetrics()

    if (aggregated.avgQuestionAnalysisTime > 3000) {
      issues.push('问题分析时间过长 (>3s)')
    }
    
    if (aggregated.avgAiResponseTime > 10000) {
      issues.push('AI响应时间过长 (>10s)')
    }
    
    if (aggregated.avgConsensusDetectionTime > 5000) {
      issues.push('共识检测时间过长 (>5s)')
    }
    
    if (aggregated.avgQuestionMatchScore < 70) {
      issues.push('问题匹配度偏低 (<70)')
    }

    return issues
  }

  // 生成性能报告
  generateReport(): string {
    const aggregated = this.getAggregatedMetrics()
    const issues = this.detectPerformanceIssues()

    return `
## 性能监控报告

### 核心指标
- 平均问题分析时间: ${aggregated.avgQuestionAnalysisTime.toFixed(2)}ms
- 平均AI响应时间: ${aggregated.avgAiResponseTime.toFixed(2)}ms  
- 平均共识检测时间: ${aggregated.avgConsensusDetectionTime.toFixed(2)}ms
- 平均问题匹配度: ${aggregated.avgQuestionMatchScore.toFixed(1)}分
- 系统调整总次数: ${aggregated.totalSystemAdjustments}
- 总会话数: ${aggregated.totalSessions}

### 性能状态
${issues.length === 0 ? '✅ 所有指标正常' : '⚠️ 发现以下性能问题:'}
${issues.map(issue => `- ${issue}`).join('\n')}

### 建议
${this.generateRecommendations()}
    `.trim()
  }

  private generateRecommendations(): string {
    const aggregated = this.getAggregatedMetrics()
    const recommendations: string[] = []

    if (aggregated.avgAiResponseTime > 8000) {
      recommendations.push('考虑优化AI API调用或使用更快的模型')
    }
    
    if (aggregated.avgQuestionMatchScore < 75) {
      recommendations.push('优化问题匹配算法，提高答案相关性')
    }
    
    if (aggregated.totalSystemAdjustments / aggregated.totalSessions > 2) {
      recommendations.push('系统调整频率较高，考虑优化共识检测逻辑')
    }

    if (recommendations.length === 0) {
      recommendations.push('系统运行良好，继续监控关键指标')
    }

    return recommendations.map(rec => `- ${rec}`).join('\n')
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()
export type { PerformanceMetrics }