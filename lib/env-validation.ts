// 环境变量验证和配置管理
interface RequiredEnvVars {
  // AI助手A配置
  AI_A_API_URL: string
  AI_A_API_KEY: string
  AI_A_MODEL: string
  AI_A_NAME: string
  AI_A_PERSONALITY: string

  // AI助手B配置
  AI_B_API_URL: string
  AI_B_API_KEY: string
  AI_B_MODEL: string
  AI_B_NAME: string
  AI_B_PERSONALITY: string

  // 共识生成AI配置
  CONSENSUS_API_URL: string
  CONSENSUS_API_KEY: string
  CONSENSUS_MODEL: string
}

function validateEnvVar(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`环境变量 ${name} 未设置或为空。请在 .env.local 文件中配置此变量。`)
  }
  return value.trim()
}

function validateRequiredEnvVars(): RequiredEnvVars {
  try {
    return {
      // AI助手A配置
      AI_A_API_URL: validateEnvVar('AI_A_API_URL', process.env.AI_A_API_URL),
      AI_A_API_KEY: validateEnvVar('AI_A_API_KEY', process.env.AI_A_API_KEY),
      AI_A_MODEL: validateEnvVar('AI_A_MODEL', process.env.AI_A_MODEL),
      AI_A_NAME: validateEnvVar('AI_A_NAME', process.env.AI_A_NAME),
      AI_A_PERSONALITY: validateEnvVar('AI_A_PERSONALITY', process.env.AI_A_PERSONALITY),

      // AI助手B配置
      AI_B_API_URL: validateEnvVar('AI_B_API_URL', process.env.AI_B_API_URL),
      AI_B_API_KEY: validateEnvVar('AI_B_API_KEY', process.env.AI_B_API_KEY),
      AI_B_MODEL: validateEnvVar('AI_B_MODEL', process.env.AI_B_MODEL),
      AI_B_NAME: validateEnvVar('AI_B_NAME', process.env.AI_B_NAME),
      AI_B_PERSONALITY: validateEnvVar('AI_B_PERSONALITY', process.env.AI_B_PERSONALITY),

      // 共识生成AI配置
      CONSENSUS_API_URL: validateEnvVar('CONSENSUS_API_URL', process.env.CONSENSUS_API_URL),
      CONSENSUS_API_KEY: validateEnvVar('CONSENSUS_API_KEY', process.env.CONSENSUS_API_KEY),
      CONSENSUS_MODEL: validateEnvVar('CONSENSUS_MODEL', process.env.CONSENSUS_MODEL),
    }
  } catch (error: any) {
    console.error('❌ 环境变量验证失败:', error.message)
    console.error('')
    console.error('请检查以下事项：')
    console.error('1. 确保 .env.local 文件存在于项目根目录')
    console.error('2. 确保所有必需的环境变量都已设置')
    console.error('3. 确保环境变量值不为空')
    console.error('')
    console.error('必需的环境变量列表：')
    console.error('- AI_A_API_URL, AI_A_API_KEY, AI_A_MODEL, AI_A_NAME, AI_A_PERSONALITY')
    console.error('- AI_B_API_URL, AI_B_API_KEY, AI_B_MODEL, AI_B_NAME, AI_B_PERSONALITY')
    console.error('- CONSENSUS_API_URL, CONSENSUS_API_KEY, CONSENSUS_MODEL')
    
    throw error
  }
}

// 验证并导出环境变量（仅在服务器端）
let ENV_CONFIG: RequiredEnvVars | null = null

export function getEnvConfig(): RequiredEnvVars {
  if (typeof window !== 'undefined') {
    throw new Error('环境变量配置仅在服务器端可用')
  }
  
  if (!ENV_CONFIG) {
    ENV_CONFIG = validateRequiredEnvVars()
  }
  
  return ENV_CONFIG
}

// 验证状态
let isValidated = false

export function ensureEnvValidation() {
  if (typeof window !== 'undefined') {
    // 客户端不执行验证
    return true
  }
  
  if (!isValidated) {
    validateRequiredEnvVars()
    isValidated = true
    console.log('✅ 环境变量验证通过')
  }
  return true
}

// 启动时自动验证（仅在服务器端）
if (typeof window === 'undefined') {
  ensureEnvValidation()
}