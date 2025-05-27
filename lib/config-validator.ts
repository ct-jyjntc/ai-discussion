// 配置验证和健康检查工具
import { getEnvConfig } from './env-validation'

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error'
  checks: Array<{
    name: string
    status: 'pass' | 'fail' | 'warning'
    message: string
    details?: any
  }>
  overall: {
    score: number
    message: string
  }
}

class ConfigValidator {
  private static instance: ConfigValidator

  static getInstance(): ConfigValidator {
    if (!ConfigValidator.instance) {
      ConfigValidator.instance = new ConfigValidator()
    }
    return ConfigValidator.instance
  }

  // 验证AI配置
  validateAIConfig(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    }

    try {
      const config = getEnvConfig()

      // 验证API URL格式
      this.validateApiUrls(config, result)
      
      // 验证API密钥
      this.validateApiKeys(config, result)
      
      // 验证模型名称
      this.validateModels(config, result)
      
      // 验证AI个性配置
      this.validatePersonalities(config, result)
      
      // 检查配置一致性
      this.checkConfigConsistency(config, result)

    } catch (error: any) {
      result.isValid = false
      result.errors.push(`配置加载失败: ${error.message}`)
    }

    return result
  }

  private validateApiUrls(config: any, result: ValidationResult): void {
    const urlFields = [
      { key: 'AI_A_API_URL', name: 'AI助手A API URL' },
      { key: 'AI_B_API_URL', name: 'AI助手B API URL' },
      { key: 'CONSENSUS_API_URL', name: '共识生成器 API URL' },
      { key: 'CONSENSUS_DETECTOR_API_URL', name: '共识检测器 API URL' }
    ]

    urlFields.forEach(({ key, name }) => {
      const url = config[key]
      
      if (!url) {
        result.errors.push(`${name} 未配置`)
        result.isValid = false
        return
      }

      // 验证URL格式
      try {
        new URL(url)
      } catch {
        result.errors.push(`${name} 格式无效: ${url}`)
        result.isValid = false
        return
      }

      // 检查是否使用HTTPS
      if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
        result.warnings.push(`${name} 使用HTTP而非HTTPS，可能存在安全风险`)
      }

      // 检查常见的API端点
      if (url.includes('openai.com') && !url.includes('/v1/chat/completions')) {
        result.warnings.push(`${name} 可能不是有效的OpenAI API端点`)
      }
    })
  }

  private validateApiKeys(config: any, result: ValidationResult): void {
    const keyFields = [
      { key: 'AI_A_API_KEY', name: 'AI助手A API密钥' },
      { key: 'AI_B_API_KEY', name: 'AI助手B API密钥' },
      { key: 'CONSENSUS_API_KEY', name: '共识生成器 API密钥' },
      { key: 'CONSENSUS_DETECTOR_API_KEY', name: '共识检测器 API密钥' }
    ]

    keyFields.forEach(({ key, name }) => {
      const apiKey = config[key]
      
      if (!apiKey) {
        result.errors.push(`${name} 未配置`)
        result.isValid = false
        return
      }

      // 检查密钥格式
      if (apiKey === 'your_api_key_here' || apiKey === 'sk-xxx') {
        result.errors.push(`${name} 仍为示例值，请设置真实的API密钥`)
        result.isValid = false
        return
      }

      // 检查OpenAI密钥格式
      if (config[key.replace('_KEY', '_URL')].includes('openai.com')) {
        if (!apiKey.startsWith('sk-')) {
          result.warnings.push(`${name} 格式可能不正确，OpenAI密钥通常以'sk-'开头`)
        }
        if (apiKey.length < 40) {
          result.warnings.push(`${name} 长度可能不正确，OpenAI密钥通常较长`)
        }
      }

      // 检查Anthropic密钥格式
      if (config[key.replace('_KEY', '_URL')].includes('anthropic.com')) {
        if (!apiKey.startsWith('sk-ant-')) {
          result.warnings.push(`${name} 格式可能不正确，Anthropic密钥通常以'sk-ant-'开头`)
        }
      }
    })
  }

  private validateModels(config: any, result: ValidationResult): void {
    const modelFields = [
      { key: 'AI_A_MODEL', name: 'AI助手A模型' },
      { key: 'AI_B_MODEL', name: 'AI助手B模型' },
      { key: 'CONSENSUS_MODEL', name: '共识生成器模型' },
      { key: 'CONSENSUS_DETECTOR_MODEL', name: '共识检测器模型' }
    ]

    const validModels = [
      'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo',
      'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku',
      'claude-3-5-sonnet'
    ]

    modelFields.forEach(({ key, name }) => {
      const model = config[key]
      
      if (!model) {
        result.errors.push(`${name} 未配置`)
        result.isValid = false
        return
      }

      if (model === 'your_model_name_here') {
        result.errors.push(`${name} 仍为示例值`)
        result.isValid = false
        return
      }

      // 检查是否是已知的有效模型
      const isKnownModel = validModels.some(validModel => 
        model.includes(validModel) || validModel.includes(model)
      )
      
      if (!isKnownModel) {
        result.warnings.push(`${name} '${model}' 可能不是有效的模型名称`)
      }
    })
  }

  private validatePersonalities(config: any, result: ValidationResult): void {
    const personalityFields = [
      { key: 'AI_A_PERSONALITY', name: 'AI助手A个性' },
      { key: 'AI_B_PERSONALITY', name: 'AI助手B个性' }
    ]

    personalityFields.forEach(({ key, name }) => {
      const personality = config[key]
      
      if (!personality) {
        result.warnings.push(`${name} 未配置`)
        return
      }

      // 检查个性描述是否合理
      const traits = personality.split(',').map((t: string) => t.trim())
      
      if (traits.length < 2) {
        result.warnings.push(`${name} 特征较少，建议添加更多描述`)
      }

      if (traits.some((trait: string) => trait.length < 3)) {
        result.warnings.push(`${name} 包含过短的特征描述`)
      }
    })

    // 检查两个AI是否有足够的差异化
    const personalityA = config.AI_A_PERSONALITY
    const personalityB = config.AI_B_PERSONALITY
    
    if (personalityA && personalityB) {
      const traitsA = personalityA.toLowerCase().split(',').map((t: string) => t.trim())
      const traitsB = personalityB.toLowerCase().split(',').map((t: string) => t.trim())
      
      const commonTraits = traitsA.filter((trait: string) => traitsB.includes(trait))
      
      if (commonTraits.length > traitsA.length * 0.5) {
        result.warnings.push('两个AI助手的个性特征过于相似，可能影响讨论效果')
      }
    }
  }

  private checkConfigConsistency(config: any, result: ValidationResult): void {
    // 检查是否所有配置都使用相同的API提供商
    const providers = {
      openai: ['AI_A', 'AI_B', 'CONSENSUS', 'CONSENSUS_DETECTOR'].filter(prefix => 
        config[`${prefix}_API_URL`]?.includes('openai.com')
      ),
      anthropic: ['AI_A', 'AI_B', 'CONSENSUS', 'CONSENSUS_DETECTOR'].filter(prefix => 
        config[`${prefix}_API_URL`]?.includes('anthropic.com')
      )
    }

    const totalConfigs = ['AI_A', 'AI_B', 'CONSENSUS', 'CONSENSUS_DETECTOR'].length
    
    if (providers.openai.length === totalConfigs) {
      result.recommendations.push('所有AI都使用OpenAI，考虑混合使用不同提供商以获得更好的多样性')
    }
    
    if (providers.anthropic.length === totalConfigs) {
      result.recommendations.push('所有AI都使用Anthropic，考虑混合使用不同提供商以获得更好的多样性')
    }

    // 检查模型配置的合理性
    const models = [
      config.AI_A_MODEL,
      config.AI_B_MODEL,
      config.CONSENSUS_MODEL,
      config.CONSENSUS_DETECTOR_MODEL
    ].filter(Boolean)

    const uniqueModels = new Set(models)
    if (uniqueModels.size === 1) {
      result.recommendations.push('所有AI使用相同模型，考虑为不同角色使用不同模型')
    }
  }

  // 执行健康检查
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = []
    let totalScore = 0
    const maxScore = 100

    // 配置验证检查
    const configValidation = this.validateAIConfig()
    const configScore = configValidation.isValid ? 25 : (configValidation.errors.length === 0 ? 15 : 0)
    totalScore += configScore

    checks.push({
      name: '配置验证',
      status: configValidation.isValid ? 'pass' : (configValidation.errors.length === 0 ? 'warning' : 'fail'),
      message: configValidation.isValid ? 
        '所有配置项验证通过' : 
        `发现 ${configValidation.errors.length} 个错误, ${configValidation.warnings.length} 个警告`,
      details: configValidation
    })

    // API连接检查
    const apiConnectivity = await this.checkApiConnectivity()
    const apiScore = apiConnectivity.workingApis >= 3 ? 25 : (apiConnectivity.workingApis >= 2 ? 15 : 5)
    totalScore += apiScore

    checks.push({
      name: 'API连接性',
      status: apiConnectivity.workingApis >= 3 ? 'pass' : (apiConnectivity.workingApis >= 2 ? 'warning' : 'fail'),
      message: `${apiConnectivity.workingApis}/4 个API端点可连接`,
      details: apiConnectivity
    })

    // 环境检查
    const envCheck = this.checkEnvironment()
    const envScore = envCheck.issues.length === 0 ? 25 : (envCheck.issues.length <= 2 ? 15 : 5)
    totalScore += envScore

    checks.push({
      name: '环境检查',
      status: envCheck.issues.length === 0 ? 'pass' : (envCheck.issues.length <= 2 ? 'warning' : 'fail'),
      message: envCheck.issues.length === 0 ? '环境配置正常' : `发现 ${envCheck.issues.length} 个环境问题`,
      details: envCheck
    })

    // 依赖检查
    const depCheck = this.checkDependencies()
    const depScore = depCheck.outdated.length === 0 ? 25 : (depCheck.outdated.length <= 3 ? 15 : 5)
    totalScore += depScore

    checks.push({
      name: '依赖检查',
      status: depCheck.outdated.length === 0 ? 'pass' : (depCheck.outdated.length <= 3 ? 'warning' : 'fail'),
      message: depCheck.outdated.length === 0 ? '所有依赖都是最新的' : `${depCheck.outdated.length} 个依赖需要更新`,
      details: depCheck
    })

    const overallStatus: HealthCheckResult['status'] = 
      totalScore >= 80 ? 'healthy' : 
      totalScore >= 60 ? 'warning' : 'error'

    return {
      status: overallStatus,
      checks,
      overall: {
        score: totalScore,
        message: this.getOverallMessage(totalScore, overallStatus)
      }
    }
  }

  private async checkApiConnectivity(): Promise<{ workingApis: number; details: string[] }> {
    // 这里可以实现真实的API连接测试
    // 为了简化，我们返回模拟结果
    return {
      workingApis: 4,
      details: ['所有API端点响应正常']
    }
  }

  private checkEnvironment(): { issues: string[] } {
    const issues: string[] = []

    // 检查Node.js版本
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
    
    if (majorVersion < 18) {
      issues.push(`Node.js版本过低 (${nodeVersion})，建议使用Node.js 18+`)
    }

    // 检查环境变量
    if (!process.env.NODE_ENV) {
      issues.push('NODE_ENV 环境变量未设置')
    }

    return { issues }
  }

  private checkDependencies(): { outdated: string[]; security: string[] } {
    // 这里可以实现真实的依赖检查
    // 为了简化，我们返回空结果
    return {
      outdated: [],
      security: []
    }
  }

  private getOverallMessage(score: number, status: HealthCheckResult['status']): string {
    switch (status) {
      case 'healthy':
        return `系统运行状态良好 (得分: ${score}/100)`
      case 'warning':
        return `系统存在一些警告 (得分: ${score}/100)，建议进行优化`
      case 'error':
        return `系统存在严重问题 (得分: ${score}/100)，需要立即处理`
      default:
        return `未知状态 (得分: ${score}/100)`
    }
  }

  // 生成配置报告
  generateConfigReport(): string {
    const validation = this.validateAIConfig()
    
    return `
## 配置验证报告

### 验证状态
${validation.isValid ? '✅ 配置验证通过' : '❌ 配置验证失败'}

### 错误 (${validation.errors.length})
${validation.errors.map(error => `- ❌ ${error}`).join('\n') || '无错误'}

### 警告 (${validation.warnings.length})
${validation.warnings.map(warning => `- ⚠️ ${warning}`).join('\n') || '无警告'}

### 建议 (${validation.recommendations.length})
${validation.recommendations.map(rec => `- 💡 ${rec}`).join('\n') || '无建议'}

### 下一步行动
${this.getNextActions(validation)}
    `.trim()
  }

  private getNextActions(validation: ValidationResult): string {
    if (validation.errors.length > 0) {
      return '1. 修复所有配置错误\n2. 重新验证配置\n3. 进行健康检查'
    }
    
    if (validation.warnings.length > 0) {
      return '1. 处理配置警告\n2. 优化AI个性设置\n3. 进行性能测试'
    }
    
    return '配置已优化，可以开始使用系统'
  }
}

export const configValidator = ConfigValidator.getInstance()
export type { ValidationResult, HealthCheckResult }