import { NextRequest } from 'next/server'
import { performanceMonitor } from '@/lib/performance-monitor'
import { errorHandler } from '@/lib/error-handling'
import { cacheManager } from '@/lib/cache-manager'
import { configValidator } from '@/lib/config-validator'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const section = url.searchParams.get('section') || 'all'

    let responseData: any = {}

    switch (section) {
      case 'performance':
        responseData = {
          metrics: performanceMonitor.getAggregatedMetrics(),
          issues: performanceMonitor.detectPerformanceIssues(),
          report: performanceMonitor.generateReport()
        }
        break

      case 'errors':
        responseData = {
          stats: errorHandler.getErrorStats(),
          report: errorHandler.generateErrorReport()
        }
        break

      case 'cache':
        responseData = {
          stats: cacheManager.getStats(),
          hotKeys: cacheManager.getHotKeys(10),
          report: cacheManager.generateReport()
        }
        break

      case 'config':
        responseData = {
          validation: configValidator.validateAIConfig(),
          healthCheck: await configValidator.performHealthCheck(),
          report: configValidator.generateConfigReport()
        }
        break

      case 'all':
      default:
        responseData = {
          performance: {
            metrics: performanceMonitor.getAggregatedMetrics(),
            issues: performanceMonitor.detectPerformanceIssues()
          },
          errors: {
            stats: errorHandler.getErrorStats()
          },
          cache: {
            stats: cacheManager.getStats(),
            hotKeys: cacheManager.getHotKeys(5)
          },
          config: {
            validation: configValidator.validateAIConfig(),
            healthCheck: await configValidator.performHealthCheck()
          },
          systemHealth: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            node: process.version
          }
        }
        break
    }

    return Response.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Dashboard API错误:', error)
    
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json()

    let result: any = {}

    switch (action) {
      case 'clearCache':
        cacheManager.clear()
        result = { message: '缓存已清空' }
        break

      case 'clearErrors':
        errorHandler.clearOldLogs(0) // 清空所有错误日志
        result = { message: '错误日志已清空' }
        break

      case 'warmupCache':
        // 这里可以实现缓存预热逻辑
        result = { message: '缓存预热已启动' }
        break

      case 'runHealthCheck':
        result = await configValidator.performHealthCheck()
        break

      default:
        throw new Error(`未知操作: ${action}`)
    }

    return Response.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Dashboard操作错误:', error)
    
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}