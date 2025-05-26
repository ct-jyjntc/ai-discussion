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
  
  // 提取最新两次对话内容
  const recentDialogue = extractRecentDialogue(fullDiscussion, 2)
  
  const userPrompt = `分析以下AI对话，判断是否达成共识：

原始问题：「${question}」

最新两轮对话内容：
${recentDialogue}

当前轮次：第${round}轮
总讨论内容长度：${fullDiscussion.length}字符

请重点分析最新两轮对话中双方的表态，判断是否明确达成了共识。只有当双方都明确表示同意并且没有分歧时才判断为达成共识。`

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
    const fallbackResult = fallbackConsensusDetection(recentDialogue, round)
    
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
 * 提取最新N轮对话内容
 */
function extractRecentDialogue(fullDiscussion: string, rounds: number): string {
  const lines = fullDiscussion.split('\n')
  const dialogueBlocks: string[] = []
  let currentBlock = ""
  
  for (const line of lines) {
    if (line.includes('【AI助手') || line.includes('【') && line.includes('】')) {
      if (currentBlock.trim()) {
        dialogueBlocks.push(currentBlock.trim())
      }
      currentBlock = line
    } else if (line.trim()) {
      currentBlock += '\n' + line
    }
  }
  
  // 添加最后一个对话块
  if (currentBlock.trim()) {
    dialogueBlocks.push(currentBlock.trim())
  }
  
  // 返回最新的N轮对话（每轮包含A和B的发言）
  const recentBlocks = dialogueBlocks.slice(-rounds * 2)
  return recentBlocks.join('\n\n')
}

/**
 * 回退的共识检测方法 - 基于关键词匹配
 */
function fallbackConsensusDetection(recentDialogue: string, round: number): {
  hasConsensus: boolean
  reason: string
} {
  const consensusKeywords = [
    "我同意你的观点",
    "我们在这点上达成了一致", 
    "我认为我们已经达成共识",
    "我们达成共识",
    "达成共识",
    "我同意",
    "我认同",
    "完全同意",
    "我们的观点一致",
    "没有分歧",
    "观点相同"
  ]
  
  const hasKeyword = consensusKeywords.some(keyword => 
    recentDialogue.includes(keyword)
  )
  
  let reason = ""
  if (hasKeyword) {
    reason = "在最新对话中检测到共识关键词"
  } else {
    reason = "在最新对话中未检测到明确的共识信号"
  }
  
  return {
    hasConsensus: hasKeyword,
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