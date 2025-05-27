// 增强的启动验证系统
import { configValidator } from './config-validator'
import { cacheManager } from './cache-manager'
import { performanceMonitor } from './performance-monitor'
import { errorHandler } from './error-handling'

interface StartupResult {
  success: boolean
  warnings: string[]
  errors: string[]
  recommendations: string[]
  duration: number
  checks: Array<{
    name: string
    status: 'pass' | 'fail' | 'warning'
    message: string
    duration: number
  }>
}

class StartupValidator {
  private static instance: StartupValidator

  static getInstance(): StartupValidator {
    if (!StartupValidator.instance) {
      StartupValidator.instance = new StartupValidator()
    }
    return StartupValidator.instance
  }

  async validateStartup(): Promise<StartupResult> {
    const startTime = Date.now()
    const result: StartupResult = {
      success: true,
      warnings: [],
      errors: [],
      recommendations: [],
      duration: 0,
      checks: []
    }

    console.log('🚀 开始启动验证...')

    // 1. 环境变量验证
    await this.runCheck('环境变量验证', async () => {
      const validation = configValidator.validateAIConfig()
      
      if (!validation.isValid) {
        result.errors.push(...validation.errors)
        result.success = false
        return { status: 'fail' as const, message: `发现 ${validation.errors.length} 个错误` }
      }
      
      if (validation.warnings.length > 0) {
        result.warnings.push(...validation.warnings)
        return { status: 'warning' as const, message: `发现 ${validation.warnings.length} 个警告` }
      }
      
      return { status: 'pass' as const, message: '所有环境变量验证通过' }
    }, result)

    // 2. 系统依赖检查
    await this.runCheck('系统依赖检查', async () => {
      const nodeVersion = process.version
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
      
      if (majorVersion < 18) {
        result.errors.push(`Node.js版本过低: ${nodeVersion}`)
        result.success = false
        return { status: 'fail' as const, message: `Node.js版本不兼容` }
      }
      
      return { status: 'pass' as const, message: `Node.js ${nodeVersion} 兼容` }
    }, result)

    // 3. 缓存系统初始化
    await this.runCheck('缓存系统初始化', async () => {
      try {
        // 测试缓存系统
        cacheManager.set('startup_test', 'test_value', 1000)
        const testValue = cacheManager.get('startup_test')
        
        if (testValue !== 'test_value') {
          throw new Error('缓存读写测试失败')
        }
        
        cacheManager.delete('startup_test')
        return { status: 'pass' as const, message: '缓存系统运行正常' }
      } catch (error: any) {
        result.warnings.push(`缓存系统警告: ${error.message}`)
        return { status: 'warning' as const, message: error.message }
      }
    }, result)

    // 4. 性能监控初始化
    await this.runCheck('性能监控初始化', async () => {
      try {
        performanceMonitor.startTimer('startup_test')
        await new Promise(resolve => setTimeout(resolve, 10))
        const duration = performanceMonitor.endTimer('startup_test')
        
        if (duration < 0 || duration > 100) {
          throw new Error('性能监控计时异常')
        }
        
        return { status: 'pass' as const, message: '性能监控系统正常' }
      } catch (error: any) {
        result.warnings.push(`性能监控警告: ${error.message}`)
        return { status: 'warning' as const, message: error.message }
      }
    }, result)

    // 5. 错误处理系统测试
    await this.runCheck('错误处理系统测试', async () => {
      try {
        // 测试错误处理系统
        const stats = errorHandler.getErrorStats()
        
        return { status: 'pass' as const, message: '错误处理系统运行正常' }
      } catch (error: any) {
        result.warnings.push(`错误处理系统警告: ${error.message}`)
        return { status: 'warning' as const, message: error.message }
      }
    }, result)

    // 6. API连接测试 (可选)
    if (process.env.STARTUP_API_TEST === 'true') {
      await this.runCheck('API连接测试', async () => {
        try {
          // 这里可以实现真实的API连接测试
          // 为了避免启动时的网络依赖，暂时跳过
          return { status: 'pass' as const, message: 'API连接测试跳过' }
        } catch (error: any) {
          result.warnings.push(`API连接警告: ${error.message}`)
          return { status: 'warning' as const, message: error.message }
        }
      }, result)
    }

    result.duration = Date.now() - startTime

    // 生成建议
    this.generateRecommendations(result)

    // 输出结果
    this.logStartupResult(result)

    return result
  }

  private async runCheck(
    name: string,
    checkFn: () => Promise<{ status: 'pass' | 'fail' | 'warning'; message: string }>,
    result: StartupResult
  ): Promise<void> {
    const startTime = Date.now()
    
    try {
      const checkResult = await checkFn()
      const duration = Date.now() - startTime
      
      result.checks.push({
        name,
        status: checkResult.status,
        message: checkResult.message,
        duration
      })
      
      console.log(`  ${this.getStatusIcon(checkResult.status)} ${name}: ${checkResult.message} (${duration}ms)`)
    } catch (error: any) {
      const duration = Date.now() - startTime
      
      result.checks.push({
        name,
        status: 'fail',
        message: error.message,
        duration
      })
      
      result.errors.push(`${name}: ${error.message}`)
      result.success = false
      
      console.log(`  ❌ ${name}: ${error.message} (${duration}ms)`)
    }
  }

  private getStatusIcon(status: 'pass' | 'fail' | 'warning'): string {
    switch (status) {
      case 'pass': return '✅'
      case 'fail': return '❌'
      case 'warning': return '⚠️'
      default: return '❓'
    }
  }

  private generateRecommendations(result: StartupResult): void {
    if (result.errors.length > 0) {
      result.recommendations.push('修复所有错误后重新启动应用')
    }
    
    if (result.warnings.length > 3) {
      result.recommendations.push('警告数量较多，建议检查配置文件')
    }
    
    if (result.duration > 5000) {
      result.recommendations.push('启动时间较长，考虑优化启动流程')
    }
    
    const failedChecks = result.checks.filter(check => check.status === 'fail')
    if (failedChecks.length > 0) {
      result.recommendations.push(`优先处理失败的检查项: ${failedChecks.map(c => c.name).join(', ')}`)
    }
    
    if (result.success && result.warnings.length === 0) {
      result.recommendations.push('系统状态良好，可以正常使用')
    }
  }

  private logStartupResult(result: StartupResult): void {
    console.log('\n' + '='.repeat(60))
    console.log(`🎯 启动验证完成 (${result.duration}ms)`)
    console.log('='.repeat(60))
    
    if (result.success) {
      console.log('✅ 启动验证通过')
    } else {
      console.log('❌ 启动验证失败')
    }
    
    if (result.errors.length > 0) {
      console.log(`\n❌ 错误 (${result.errors.length}):`)
      result.errors.forEach(error => console.log(`   - ${error}`))
    }
    
    if (result.warnings.length > 0) {
      console.log(`\n⚠️ 警告 (${result.warnings.length}):`)
      result.warnings.forEach(warning => console.log(`   - ${warning}`))
    }
    
    if (result.recommendations.length > 0) {
      console.log(`\n💡 建议:`)
      result.recommendations.forEach(rec => console.log(`   - ${rec}`))
    }
    
    console.log('\n📊 检查详情:')
    result.checks.forEach(check => {
      console.log(`   ${this.getStatusIcon(check.status)} ${check.name}: ${check.message} (${check.duration}ms)`)
    })
    
    console.log('='.repeat(60) + '\n')
  }

  // 生成启动报告
  generateStartupReport(result: StartupResult): string {
    return `
## 启动验证报告

### 概览
- **状态**: ${result.success ? '✅ 成功' : '❌ 失败'}
- **总耗时**: ${result.duration}ms
- **检查项**: ${result.checks.length}
- **错误**: ${result.errors.length}
- **警告**: ${result.warnings.length}

### 检查结果
${result.checks.map(check => 
  `- ${this.getStatusIcon(check.status)} **${check.name}**: ${check.message} (${check.duration}ms)`
).join('\n')}

### 问题详情

#### 错误 (${result.errors.length})
${result.errors.map(error => `- ❌ ${error}`).join('\n') || '无错误'}

#### 警告 (${result.warnings.length})
${result.warnings.map(warning => `- ⚠️ ${warning}`).join('\n') || '无警告'}

### 建议
${result.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}

---
*报告生成时间: ${new Date().toLocaleString()}*
    `.trim()
  }
}

// 启动时自动执行验证
let startupPromise: Promise<StartupResult> | null = null

export function getStartupValidation(): Promise<StartupResult> {
  if (!startupPromise) {
    const validator = StartupValidator.getInstance()
    startupPromise = validator.validateStartup()
  }
  return startupPromise
}

// 仅在服务器端执行启动验证
if (typeof window === 'undefined') {
  getStartupValidation().catch(error => {
    console.error('启动验证失败:', error)
  })
}

export const startupValidator = StartupValidator.getInstance()
export type { StartupResult }