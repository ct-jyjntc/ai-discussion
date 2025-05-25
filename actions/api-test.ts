"use server"

import { getAIConfig } from "@/lib/ai-config"

export async function testAllAPIs() {
  const results = []
  
  // 测试AI助手A
  try {
    const aiAConfig = getAIConfig('ai_a')
    const response = await fetch(aiAConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${aiAConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiAConfig.model,
        messages: [
          {
            role: "user",
            content: "测试连接"
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      }),
    })
    
    if (response.ok) {
      const data = await response.text()
      results.push({
        name: aiAConfig.name,
        status: "success",
        message: "连接成功",
        url: aiAConfig.apiUrl
      })
    } else {
      results.push({
        name: aiAConfig.name,
        status: "error",
        message: `HTTP ${response.status}: ${response.statusText}`,
        url: aiAConfig.apiUrl
      })
    }
  } catch (error: any) {
    results.push({
      name: "AI助手A",
      status: "error",
      message: error.message,
      url: "配置错误"
    })
  }
  
  // 测试AI助手B
  try {
    const aiBConfig = getAIConfig('ai_b')
    const response = await fetch(aiBConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${aiBConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiBConfig.model,
        messages: [
          {
            role: "user",
            content: "测试连接"
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      }),
    })
    
    if (response.ok) {
      const data = await response.text()
      results.push({
        name: aiBConfig.name,
        status: "success",
        message: "连接成功",
        url: aiBConfig.apiUrl
      })
    } else {
      results.push({
        name: aiBConfig.name,
        status: "error",
        message: `HTTP ${response.status}: ${response.statusText}`,
        url: aiBConfig.apiUrl
      })
    }
  } catch (error: any) {
    results.push({
      name: "AI助手B",
      status: "error",
      message: error.message,
      url: "配置错误"
    })
  }
  
  // 测试共识生成AI
  try {
    const consensusConfig = getAIConfig('consensus')
    const response = await fetch(consensusConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${consensusConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: consensusConfig.model,
        messages: [
          {
            role: "user",
            content: "测试连接"
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      }),
    })
    
    if (response.ok) {
      const data = await response.text()
      results.push({
        name: "共识生成器",
        status: "success",
        message: "连接成功",
        url: consensusConfig.apiUrl
      })
    } else {
      results.push({
        name: "共识生成器",
        status: "error",
        message: `HTTP ${response.status}: ${response.statusText}`,
        url: consensusConfig.apiUrl
      })
    }
  } catch (error: any) {
    results.push({
      name: "共识生成器",
      status: "error",
      message: error.message,
      url: "配置错误"
    })
  }
  
  return results
}

export async function quickAPITest() {
  try {
    const aiAConfig = getAIConfig('ai_a')
    
    // 简单的健康检查
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
    
    const response = await fetch(aiAConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${aiAConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiAConfig.model,
        messages: [
          {
            role: "user",
            content: "Hello"
          }
        ],
        max_tokens: 5,
        temperature: 0.1
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      return {
        success: true,
        message: "API连接正常",
        status: response.status
      }
    } else {
      return {
        success: false,
        message: `API响应错误: ${response.status} ${response.statusText}`,
        status: response.status
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: "API连接超时(10秒)",
        status: 408
      }
    }
    
    return {
      success: false,
      message: `API连接失败: ${error.message}`,
      status: 0
    }
  }
}