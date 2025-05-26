"use server"

import { CONSENSUS_DETECTOR_CONFIG, generateSystemPrompt, callAI } from "@/lib/ai-config"

export interface ConsensusResult {
  hasConsensus: boolean
  confidence: number
  reason: string
  recommendAction: "continue" | "consensus" | "extend"
  keyPoints: string[]
  suggestions: string[]
}

/**
 * 使用AI检测两个AI助手是否达成共识
 * @param question 原始问题
 * @param fullDiscussion 完整的讨论内容
 * @param round 当前轮次
 * @returns 共识检测结果
 */
export async function detectConsensus(
  question: string,
  fullDiscussion: string,
  round: number
): Promise<ConsensusResult> {
  const systemPrompt = generateSystemPrompt(CONSENSUS_DETECTOR_CONFIG, 'consensus_detector', round)
  
  const userPrompt = `分析以下AI对话，判断是否达成共识：

原始问题：「${question}」

完整对话记录：
${fullDiscussion}

当前轮次：第${round}轮

请按照要求的JSON格式返回分析结果。`

  try {
    const response = await callAI(CONSENSUS_DETECTOR_CONFIG, systemPrompt, userPrompt)
    
    // 解析AI返回的JSON响应
    const cleanedResponse = response.trim()
    let jsonStart = cleanedResponse.indexOf('{')
    let jsonEnd = cleanedResponse.lastIndexOf('}') + 1
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('AI响应中未找到有效的JSON格式')
    }
    
    const jsonStr = cleanedResponse.substring(jsonStart, jsonEnd)
    const result: ConsensusResult = JSON.parse(jsonStr)
    
    // 验证返回结果的完整性
    if (typeof result.hasConsensus !== 'boolean' ||
        typeof result.confidence !== 'number' ||
        typeof result.reason !== 'string') {
      throw new Error('AI返回的JSON格式不完整')
    }
    
    // 确保所有字段都存在，提供默认值
    return {
      hasConsensus: result.hasConsensus,
      confidence: Math.max(0, Math.min(100, result.confidence)), // 确保在0-100范围内
      reason: result.reason,
      recommendAction: result.recommendAction || (result.hasConsensus ? "consensus" : "continue"),
      keyPoints: result.keyPoints || [],
      suggestions: result.suggestions || []
    }
    
  } catch (error: any) {
    console.error('共识检测失败:', error)
    
    // 如果AI检测失败，回退到简单的关键词检测
    const fallbackResult = fallbackConsensusDetection(fullDiscussion, round)
    
    return {
      hasConsensus: fallbackResult.hasConsensus,
      confidence: 30, // 较低的置信度表示这是回退结果
      reason: `AI检测失败，使用关键词回退检测: ${fallbackResult.reason}`,
      recommendAction: fallbackResult.hasConsensus ? "consensus" : "continue",
      keyPoints: [],
      suggestions: ["建议检查共识检测AI配置"]
    }
  }
}

/**
 * 回退的共识检测方法 - 基于关键词匹配
 */
function fallbackConsensusDetection(fullDiscussion: string, round: number): {
  hasConsensus: boolean
  reason: string
} {
  const consensusKeywords = [
    "我们达成共识",
    "达成共识", 
    "我同意",
    "我认同",
    "完全同意",
    "赞同你的观点",
    "我们的观点一致",
    "没有分歧",
    "观点相同"
  ]
  
  const hasKeyword = consensusKeywords.some(keyword => 
    fullDiscussion.includes(keyword)
  )
  
  const maxRounds = 4
  const forceConsensus = round >= maxRounds
  
  let reason = ""
  if (hasKeyword) {
    reason = "检测到共识关键词"
  } else if (forceConsensus) {
    reason = `已达到最大轮次 (${maxRounds})，强制生成共识`
  } else {
    reason = "未检测到明确的共识信号"
  }
  
  return {
    hasConsensus: hasKeyword || forceConsensus,
    reason
  }
}

/**
 * 流式版本的共识检测（用于实时处理）
 */
export async function detectConsensusStreaming(
  question: string,
  fullDiscussion: string,
  round: number,
  onProgress?: (status: string) => void
): Promise<ConsensusResult> {
  if (onProgress) {
    onProgress("正在启动共识检测AI...")
  }
  
  try {
    if (onProgress) {
      onProgress("正在分析对话内容...")
    }
    
    const result = await detectConsensus(question, fullDiscussion, round)
    
    if (onProgress) {
      onProgress(`检测完成: ${result.hasConsensus ? '已达成共识' : '需要继续讨论'}`)
    }
    
    return result
    
  } catch (error: any) {
    if (onProgress) {
      onProgress("检测过程中出现错误，使用备用方法...")
    }
    
    throw error
  }
}