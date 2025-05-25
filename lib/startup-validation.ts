// 应用启动时的环境变量验证
import { ensureEnvValidation } from './env-validation'

export function validateStartup() {
  console.log('🔍 正在验证应用配置...')
  
  try {
    // 验证环境变量
    ensureEnvValidation()
    
    // 验证关键配置
    const requiredVars = [
      'AI_A_API_URL',
      'AI_A_API_KEY', 
      'AI_A_MODEL',
      'AI_B_API_URL',
      'AI_B_API_KEY',
      'AI_B_MODEL',
      'CONSENSUS_API_URL',
      'CONSENSUS_API_KEY',
      'CONSENSUS_MODEL'
    ]
    
    const missingVars = requiredVars.filter(varName => {
      const value = process.env[varName]
      return !value || value.trim() === ''
    })
    
    if (missingVars.length > 0) {
      throw new Error(`缺少必需的环境变量: ${missingVars.join(', ')}`)
    }
    
    console.log('✅ 应用配置验证成功')
    console.log('📋 已加载配置:')
    console.log(`   - AI助手A: ${process.env.AI_A_NAME} (${process.env.AI_A_MODEL})`)
    console.log(`   - AI助手B: ${process.env.AI_B_NAME} (${process.env.AI_B_MODEL})`)
    console.log(`   - 共识模型: ${process.env.CONSENSUS_MODEL}`)
    
  } catch (error: any) {
    console.error('❌ 应用配置验证失败:', error.message)
    console.error('')
    console.error('💡 解决方案:')
    console.error('1. 检查项目根目录是否存在 .env.local 文件')
    console.error('2. 确保 .env.local 包含所有必需的环境变量')
    console.error('3. 确保环境变量值不为空')
    console.error('4. 重启开发服务器')
    console.error('')
    
    // 在开发环境中，抛出错误以阻止应用启动
    if (process.env.NODE_ENV === 'development') {
      throw error
    }
    
    // 在生产环境中，记录错误但不阻止启动
    return false
  }
  
  return true
}

// 如果在服务器端运行，自动执行验证
if (typeof window === 'undefined') {
  validateStartup()
}