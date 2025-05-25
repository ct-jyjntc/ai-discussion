"use server"

// Direct API call function with better error handling
async function callCustomAPI(systemPrompt: string, userPrompt: string) {
  try {
    console.log("Making direct API call...")

    const requestBody = {
      model: "gemini-2.5-flash-preview-05-20",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    }

    console.log("Request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch("http://31.22.111.51:8000/hf/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer a2366021253`,
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("Raw response text:", responseText)

    // Handle non-200 status codes
    if (!response.ok) {
      console.error("HTTP Error Response:", responseText)

      // If the response looks like an error message, return it as is
      if (responseText.includes("Invalid") || responseText.includes("Error") || responseText.includes("error")) {
        throw new Error(`API Error (${response.status}): ${responseText}`)
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Check if response is empty
    if (!responseText.trim()) {
      throw new Error("Empty response from API")
    }

    // Try to parse as JSON first
    let data
    try {
      data = JSON.parse(responseText)
      console.log("Successfully parsed JSON:", data)
    } catch (parseError: any) {
      console.log("Response is not JSON, treating as plain text")
      console.log("Parse error:", parseError.message)
      console.log("Response text:", responseText)

      // If it's not JSON, check if it looks like a valid response
      if (responseText.trim().length > 0) {
        // Return the plain text response
        return responseText.trim()
      }

      throw new Error(`Invalid response format. Expected JSON but got: ${responseText.slice(0, 200)}...`)
    }

    // Extract content from JSON response with more thorough checking
    if (data.choices && data.choices[0]) {
      if (data.choices[0].message && data.choices[0].message.content) {
        const content = data.choices[0].message.content
        console.log("Found content in choices[0].message.content, length:", content.length)
        return content
      } else if (data.choices[0].text) {
        const content = data.choices[0].text
        console.log("Found content in choices[0].text, length:", content.length)
        return content
      } else if (data.choices[0].delta && data.choices[0].delta.content) {
        const content = data.choices[0].delta.content
        console.log("Found content in choices[0].delta.content, length:", content.length)
        return content
      }
    }

    if (data.response) {
      console.log("Found content in response, length:", data.response.length)
      return data.response
    }

    if (data.content) {
      console.log("Found content in content, length:", data.content.length)
      return data.content
    }

    if (data.text) {
      console.log("Found content in text, length:", data.text.length)
      return data.text
    }

    if (data.error) {
      throw new Error(`API Error: ${JSON.stringify(data.error)}`)
    }

    // If we can't find content in expected places, return the whole response
    console.log("Unexpected JSON structure, returning stringified response:", data)
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error("API call failed:", error)
    throw error
  }
}

// Alternative API call with different endpoint format
async function callAlternativeAPI(systemPrompt: string, userPrompt: string) {
  try {
    console.log("Trying alternative API format...")

    // Try different request formats
    const alternatives = [
      // Format 1: Combined prompt
      {
        model: "gemini-2.5-flash-preview-05-20",
        prompt: `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`,
        temperature: 0.7,
      },
      // Format 2: Simple text completion
      {
        model: "gemini-2.5-flash-preview-05-20",
        input: userPrompt,
        temperature: 0.7,
      },
      // Format 3: Different message format
      {
        model: "gemini-2.5-flash-preview-05-20",
        messages: [{ role: "user", content: `${systemPrompt}\n\n${userPrompt}` }],
        temperature: 0.7,
      },
    ]

    for (let i = 0; i < alternatives.length; i++) {
      try {
        console.log(`Trying alternative format ${i + 1}:`, alternatives[i])

        const response = await fetch("http://31.22.111.51:8000/hf/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer a2366021253`,
            Accept: "application/json",
          },
          body: JSON.stringify(alternatives[i]),
        })

        const responseText = await response.text()
        console.log(`Alternative ${i + 1} response:`, responseText)

        if (response.ok && responseText.trim()) {
          // 尝试解析JSON响应
          try {
            const jsonData = JSON.parse(responseText)
            console.log(`Alternative ${i + 1} parsed JSON:`, jsonData)
            
            // 提取内容
            if (jsonData.choices && jsonData.choices[0]) {
              if (jsonData.choices[0].message && jsonData.choices[0].message.content) {
                return jsonData.choices[0].message.content
              } else if (jsonData.choices[0].text) {
                return jsonData.choices[0].text
              }
            }
            
            if (jsonData.response) {
              return jsonData.response
            }
            
            if (jsonData.content) {
              return jsonData.content
            }
            
            if (jsonData.text) {
              return jsonData.text
            }
            
            // 如果无法解析内容结构，返回原始响应
            return responseText.trim()
          } catch (parseError: any) {
            console.log(`Alternative ${i + 1} JSON parse failed:`, parseError.message)
            // 如果不是JSON，返回原始文本
            return responseText.trim()
          }
        }
      } catch (altError: any) {
        console.log(`Alternative ${i + 1} failed:`, altError.message)
        continue
      }
    }

    throw new Error("All alternative formats failed")
  } catch (error) {
    console.error("Alternative API call failed:", error)
    throw error
  }
}

export async function testAPI() {
  try {
    console.log("Testing API connection...")

    // First try the standard format
    try {
      const result = await callCustomAPI(
        "You are a helpful assistant.",
        "Hello, this is a test message. Please respond with 'Test successful!'",
      )
      console.log("Standard format test result:", result)
      return { success: true, data: result, method: "standard" }
    } catch (standardError: any) {
      console.log("Standard format failed, trying alternatives...")

      // Try alternative formats
      try {
        const result = await callAlternativeAPI(
          "You are a helpful assistant.",
          "Hello, this is a test message. Please respond with 'Test successful!'",
        )
        console.log("Alternative format test result:", result)
        return { success: true, data: result, method: "alternative" }
      } catch (altError: any) {
        console.log("Alternative formats also failed")
        return {
          success: false,
          error: `Standard: ${standardError.message}, Alternative: ${altError.message}`,
        }
      }
    }
  } catch (error: any) {
    console.error("API test failed:", error)
    return { success: false, error: error.message }
  }
}

export async function analyzeQuestion(question: string, round = 1, previousDiscussion = "") {
  const systemPrompt = generateSystemPrompt(AI_A_CONFIG, 'ai_a', round)

  let userPrompt = `用户问题："${question}"`
  
  if (previousDiscussion) {
    userPrompt += `\n\n之前的讨论：\n${previousDiscussion}\n\n请继续讨论，提出你的观点。`
  } else {
    userPrompt += `\n\n请开始分析这个问题，提出你的初步观点。`
  }

  try {
    return await callCustomAPI(systemPrompt, userPrompt)
  } catch (error: any) {
    console.error("Standard analyzer failed, trying alternative:", error)
    try {
      return await callAlternativeAPI(systemPrompt, userPrompt)
    } catch (altError: any) {
      console.error("Alternative analyzer also failed:", altError)
      return `As the Analyzer AI (Round ${round}), I would break down your question "${question}" into its key components and identify any ambiguities. However, I'm experiencing technical difficulties with the API connection. Error details: ${error.message}`
    }
  }
}

export async function aiDiscussion(question: string, aiAResponse: string, round: number, fullDiscussion = "") {
  const systemPrompt = generateSystemPrompt(AI_B_CONFIG, 'ai_b', round)

  const userPrompt = `用户问题："${question}"

${AI_A_CONFIG.name}的观点：
${aiAResponse}

${fullDiscussion ? `\n完整讨论历史：\n${fullDiscussion}\n` : ''}

请回应${AI_A_CONFIG.name}的观点，继续讨论。`

  try {
    return await callCustomAPI(systemPrompt, userPrompt)
  } catch (error: any) {
    console.error("Standard verifier failed, trying alternative:", error)
    try {
      return await callAlternativeAPI(systemPrompt, userPrompt)
    } catch (altError: any) {
      console.error("Alternative verifier also failed:", altError)
      return `As the Verifier AI (Round ${round}), I would review the analysis. Due to technical issues (${error.message}), I'll say: SUFFICIENT - we can proceed with answering based on the current analysis.`
    }
  }
}

export async function continueDiscussion(
  question: string,
  fullDiscussion: string,
  round: number,
  isAiA: boolean = true
) {
  const systemPrompt = `你是AI助手${isAiA ? 'A' : 'B'}。你的任务是与AI助手${isAiA ? 'B' : 'A'}进行对话讨论，共同解决用户的问题。请用中文回复。

对话规则：
1. 基于之前的完整讨论继续对话
2. 可以进一步阐述、补充或修正观点
3. 如果认为讨论已经充分，明确说出"我们达成共识"
4. 如果需要继续讨论，提出新的观点或问题
5. 保持建设性的对话态度

这是第${round}轮讨论。`

  const userPrompt = `用户问题："${question}"

完整讨论历史：
${fullDiscussion}

请继续讨论，提出你的进一步观点。`

  try {
    return await callCustomAPI(systemPrompt, userPrompt)
  } catch (error: any) {
    console.error("Standard refiner failed, trying alternative:", error)
    try {
      return await callAlternativeAPI(systemPrompt, userPrompt)
    } catch (altError: any) {
      console.error("Alternative refiner also failed:", altError)
      return `As the Analyzer AI (Round ${round}), I would refine my analysis based on the Verifier's feedback. Due to technical issues (${error.message}), here's my refined understanding of your question: "${question}"`
    }
  }
}

export async function generateConsensusAnswer(question: string, fullDiscussion: string) {
  const systemPrompt = `你是总结AI。请基于两个AI助手的完整讨论，生成最终的共识答案。请用中文回复。

要求：
1. 综合两个AI的观点
2. 突出他们达成的共识
3. 提供完整、准确的最终答案
4. 如果有不同观点，要平衡表述
5. 确保答案完整，不被截断`

  const userPrompt = `用户问题："${question}"

两个AI助手的完整讨论：
${fullDiscussion}

请基于他们的讨论，生成最终的共识答案。`

  try {
    return await callCustomAPI(systemPrompt, userPrompt)
  } catch (error: any) {
    console.error("Standard final answer failed, trying alternative:", error)
    try {
      return await callAlternativeAPI(systemPrompt, userPrompt)
    } catch (altError: any) {
      console.error("Alternative final answer also failed:", altError)
      return `基于两个AI助手的协作讨论，这是我对您问题"${question}"的理解：${fullDiscussion}

但是我遇到了技术问题(${error.message})，无法提供完整的回答。请重试或检查API配置。`
    }
  }
}
