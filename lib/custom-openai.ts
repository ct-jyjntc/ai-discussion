import { createOpenAI } from "@ai-sdk/openai"

// OpenAI Compatible API Configuration
// API: http://31.22.111.51:8000/hf/v1/chat/completions
// Model: gemini-2.5-flash-preview-05-20
// API Key: a2366021253 (stored in .env.local)
export const customOpenAI = createOpenAI({
  apiKey: process.env.CUSTOM_API_KEY!,
  baseURL: "http://31.22.111.51:8000/hf/v1",
  compatibility: "compatible", // OpenAI compatible mode
})

export const model = customOpenAI("gemini-2.5-flash-preview-05-20")

// Alternative: Direct fetch approach for testing
export async function testAPIConnection() {
  try {
    const response = await fetch("http://31.22.111.51:8000/hf/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer a2366021253`,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash-preview-05-20",
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
