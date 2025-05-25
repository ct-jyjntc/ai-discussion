import { createOpenAI } from "@ai-sdk/openai"
import { getEnvConfig } from './env-validation'

// OpenAI Compatible API Configuration - 从环境变量读取（延迟初始化）
function getCustomOpenAI() {
  const ENV_CONFIG = getEnvConfig()
  return createOpenAI({
    apiKey: ENV_CONFIG.AI_A_API_KEY,
    baseURL: ENV_CONFIG.AI_A_API_URL.replace('/chat/completions', ''),
    compatibility: "compatible", // OpenAI compatible mode
  })
}

function getModel() {
  const ENV_CONFIG = getEnvConfig()
  return getCustomOpenAI()(ENV_CONFIG.AI_A_MODEL)
}

// 导出延迟初始化的函数
export function getCustomOpenAIInstance() {
  return getCustomOpenAI()
}

export function getCustomModel() {
  return getModel()
}

// Alternative: Direct fetch approach for testing
export async function testAPIConnection() {
  try {
    const ENV_CONFIG = getEnvConfig()
    const response = await fetch(ENV_CONFIG.AI_A_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV_CONFIG.AI_A_API_KEY}`,
      },
      body: JSON.stringify({
        model: ENV_CONFIG.AI_A_MODEL,
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message.",
          },
        ],
        temperature: 0.7,
      }),
    })

    const data = await response.text()
    console.log("Raw API Response:", data)

    try {
      const jsonData = JSON.parse(data)
      console.log("Parsed JSON:", jsonData)
      return { success: true, data: jsonData }
    } catch (parseError: any) {
      console.log("Failed to parse as JSON:", parseError)
      return { success: false, error: "Invalid JSON", rawResponse: data }
    }
  } catch (error: any) {
    console.error("API Connection Error:", error)
    return { success: false, error: error.message }
  }
}
