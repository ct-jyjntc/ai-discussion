"use server"

import { CONSENSUS_DETECTOR_CONFIG, generateSystemPrompt, callAI } from "@/lib/ai-config"
import { analyzeQuestion, generateEnhancedConsensusPrompt } from "@/lib/enhanced-ai-prompts"

export interface ConsensusResult {
  hasConsensus: boolean
  confidence: number
  consensusLevel?: "strong" | "medium" | "weak" | "none"
  reason: string
  recommendAction: "continue" | "consensus" | "extend"
  keyPoints: string[]
  remainingIssues?: string[]
  suggestions: string[]
  discussionQuality?: "superficial" | "adequate" | "thorough" | "excellent"
  // 新增：问题匹配度评估
  questionMatchScore?: number // 0-100，表示共识对原始问题的解答程度
  questionCoverage?: "complete" | "partial" | "minimal" | "off-topic" // 问题覆盖程度
  unaddressedAspects?: string[] // 用户问题中未被充分讨论的方面
  solutionCompleteness?: "complete" | "incomplete" | "unclear" // 解决方案的完整性
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
  // 使用增强的问题分析来生成更针对性的共识检测提示词
  const enhancedPrompt = generateEnhancedConsensusPrompt(question, fullDiscussion)
  const systemPrompt = generateSystemPrompt(CONSENSUS_DETECTOR_CONFIG, 'consensus_detector', round)
  
  // 根据轮次动态调整分析策略
  const analysisStrategy = getAnalysisStrategy(round)
  
  // 提取关键对话内容
  const dialogueAnalysis = analyzeDialogueStructure(fullDiscussion)
  
  // 分析问题特征以更好地评估答案质量
  const questionAnalysis = analyzeQuestion(question)
  
  const userPrompt = `${enhancedPrompt}

## 补充分析上下文

**原始问题特征分析：**
- 问题类型: ${questionAnalysis.questionType}
- 期望输出: ${questionAnalysis.expectedOutputType}
- 具体性要求: ${questionAnalysis.specificityLevel}
- 关键要素: ${questionAnalysis.keyElements.join(', ') || '无'}

**对话背景：**
- 原始问题: ${question}
- 当前轮次: 第${round}轮
- 讨论总长度: ${fullDiscussion.length}字符
- 对话轮数: ${dialogueAnalysis.totalRounds}轮
- 分析策略: ${analysisStrategy}

## 最新对话内容（重点分析）
${dialogueAnalysis.recentDialogue}

## 完整讨论脉络
${dialogueAnalysis.discussionSummary}

## 分析要求
请结合以下因素进行综合判断：
1. **观点收敛度：** 双方观点是否朝着一致方向发展
2. **互动质量：** 是否有建设性的观点交流和相互认可
3. **问题覆盖度：** 核心问题是否得到充分讨论
4. **共识稳定性：** 达成的一致是否具有说服力
5. **讨论成熟度：** 当前轮次下的讨论是否已经充分
6. **问题匹配度：** 重要！双方共识是否真正解决了用户的原始问题

## 问题匹配度评估（关键）：
- **完整匹配**：讨论充分回答了用户问题的所有关键方面
- **部分匹配**：回答了问题的主要部分，但还有重要方面未涉及
- **最低匹配**：只触及问题表面，核心问题仍未解决
- **偏离主题**：讨论偏离了用户的原始问题

请特别关注：
- 明确的同意/认同表述
- 观点的相互补充和融合
- 分歧的解决或缓解
- 解决方案的趋同性
- **关键：共识是否真正解答了用户的问题**

基于${round}轮讨论的情况，请给出客观、平衡的共识评估。`

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
    
    // 验证和规范化返回结果
    const normalizedResult = normalizeConsensusResult(result, round, dialogueAnalysis)
    
    console.log(`共识检测结果 - 轮次${round}:`, {
      hasConsensus: normalizedResult.hasConsensus,
      confidence: normalizedResult.confidence,
      level: normalizedResult.consensusLevel,
      action: normalizedResult.recommendAction
    })
    
    return normalizedResult
    
  } catch (error: any) {
    console.error('共识检测失败:', error)
    
    // 增强的回退检测
    const fallbackResult = enhancedFallbackDetection(fullDiscussion, round, dialogueAnalysis)
    
    return {
      hasConsensus: fallbackResult.hasConsensus,
      confidence: 25, // 较低的置信度表示这是回退结果
      consensusLevel: "weak",
      reason: `AI检测失败，使用增强回退检测: ${fallbackResult.reason}`,
      recommendAction: fallbackResult.recommendAction,
      keyPoints: fallbackResult.keyPoints,
      remainingIssues: ["共识检测AI暂时不可用"],
      suggestions: ["建议检查共识检测AI配置", "可以手动判断是否继续讨论"],
      discussionQuality: "adequate",
      // 问题匹配字段 - 回退时设置为保守值
      questionMatchScore: 40, // 较低分数，倾向于继续讨论
      questionCoverage: "partial",
      unaddressedAspects: ["AI检测失败，无法准确评估"],
      solutionCompleteness: "unclear"
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
 * 根据轮次确定分析策略
 */
function getAnalysisStrategy(round: number): string {
  if (round <= 2) {
    return "早期探索阶段 - 重点关注观点建立和初步交流"
  } else if (round <= 4) {
    return "深化讨论阶段 - 重点关注观点碰撞和深化分析" 
  } else if (round <= 6) {
    return "趋向收敛阶段 - 重点关注观点整合和共识形成"
  } else {
    return "充分讨论阶段 - 重点关注最终共识或合理结束"
  }
}

/**
 * 分析对话结构
 */
function analyzeDialogueStructure(fullDiscussion: string): {
  totalRounds: number
  recentDialogue: string
  discussionSummary: string
} {
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
  
  if (currentBlock.trim()) {
    dialogueBlocks.push(currentBlock.trim())
  }
  
  const totalRounds = Math.ceil(dialogueBlocks.length / 2)
  const recentDialogue = dialogueBlocks.slice(-4).join('\n\n') // 最近2轮完整对话
  
  // 生成讨论摘要
  const discussionSummary = generateDiscussionSummary(dialogueBlocks)
  
  return {
    totalRounds,
    recentDialogue,
    discussionSummary
  }
}

/**
 * 生成讨论摘要
 */
function generateDiscussionSummary(dialogueBlocks: string[]): string {
  if (dialogueBlocks.length <= 4) {
    return "讨论处于早期阶段，双方正在建立和表达各自观点"
  }
  
  const rounds = Math.ceil(dialogueBlocks.length / 2)
  return `经过${rounds}轮讨论，双方已进行了较为深入的观点交流。请基于完整对话脉络判断当前的共识状态。`
}

/**
 * 规范化共识检测结果
 */
function normalizeConsensusResult(
  result: any, 
  round: number, 
  dialogueAnalysis: any
): ConsensusResult {
  // 验证必需字段
  if (typeof result.hasConsensus !== 'boolean') {
    result.hasConsensus = false
  }
  
  if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 100) {
    result.confidence = Math.max(0, Math.min(100, result.confidence || 50))
  }
  
  // 验证和规范化问题匹配相关字段
  if (typeof result.questionMatchScore !== 'number' || result.questionMatchScore < 0 || result.questionMatchScore > 100) {
    result.questionMatchScore = result.questionMatchScore || 50
  }
  
  if (!["complete", "partial", "minimal", "off-topic"].includes(result.questionCoverage)) {
    result.questionCoverage = "partial"
  }
  
  if (!Array.isArray(result.unaddressedAspects)) {
    result.unaddressedAspects = []
  }
  
  if (!["complete", "incomplete", "unclear"].includes(result.solutionCompleteness)) {
    result.solutionCompleteness = "incomplete"
  }
  
  // 根据轮次调整置信度
  if (round <= 2 && result.hasConsensus && result.confidence > 70) {
    result.confidence = Math.min(70, result.confidence) // 早期轮次降低过高置信度
  }
  
  // 修复逻辑矛盾：确保行动建议与共识状态一致
  let finalAction = result.recommendAction || (result.hasConsensus ? "consensus" : "continue")
  let finalConsensus = result.hasConsensus
  let finalConfidence = result.confidence
  let adjustmentReason = ""
  
  // 关键优化：问题匹配度检查
  const questionMatchThreshold = 70
  const hasGoodQuestionMatch = result.questionMatchScore >= questionMatchThreshold && 
                              result.questionCoverage === "complete" &&
                              result.solutionCompleteness === "complete"
  
  if (finalConsensus && !hasGoodQuestionMatch) {
    // 即使AI认为达成共识，但问题匹配度不足，应该继续讨论
    finalConsensus = false
    finalAction = "continue"
    finalConfidence = Math.min(finalConfidence, 60) // 降低置信度
    adjustmentReason = `问题匹配度不足(${result.questionMatchScore}/100, 覆盖度:${result.questionCoverage}, 完整性:${result.solutionCompleteness})，需继续讨论以充分解答用户问题`
    console.log(`问题匹配度检查失败，调整共识状态: ${adjustmentReason}`)
  }
  
  // 如果存在其他矛盾，根据置信度和轮次调整
  if (finalConsensus && finalAction === "continue") {
    if (finalConfidence < 80 || round <= 3) {
      // 置信度不够高或轮次较早，倾向于继续讨论
      finalConsensus = false
      finalAction = "continue"
      adjustmentReason = `置信度不够或轮次较早 (置信度: ${finalConfidence}, 轮次: ${round})`
      console.log(`检测到共识状态矛盾，调整为继续讨论: ${adjustmentReason}`)
    } else {
      // 置信度较高且轮次较多，倾向于达成共识
      finalAction = "consensus"
      console.log(`检测到共识状态矛盾，调整为达成共识 (置信度: ${finalConfidence}, 轮次: ${round})`)
    }
  }
  
  // 根据讨论质量进一步调整
  const discussionQuality = result.discussionQuality || "adequate"
  if (finalConsensus && discussionQuality === "superficial" && round <= 4) {
    finalConsensus = false
    finalAction = "continue"
    adjustmentReason = "讨论质量不足，需要继续深入讨论"
    console.log(adjustmentReason)
  }
  
  // 更新原因说明，包含调整信息
  let finalReason = result.reason || "基于对话内容的综合分析"
  if (adjustmentReason) {
    finalReason += `\n\n系统调整: ${adjustmentReason}`
  }
  
  // 设置默认值并确保一致性
  return {
    hasConsensus: finalConsensus,
    confidence: finalConfidence,
    consensusLevel: result.consensusLevel || (finalConsensus ? "medium" : "none"),
    reason: finalReason,
    recommendAction: finalAction,
    keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : [],
    remainingIssues: Array.isArray(result.remainingIssues) ? result.remainingIssues : [],
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    discussionQuality: discussionQuality,
    // 问题匹配相关字段
    questionMatchScore: result.questionMatchScore,
    questionCoverage: result.questionCoverage,
    unaddressedAspects: result.unaddressedAspects,
    solutionCompleteness: result.solutionCompleteness
  }
}

/**
 * 增强的回退检测方法
 */
function enhancedFallbackDetection(
  fullDiscussion: string, 
  round: number,
  dialogueAnalysis: any
): {
  hasConsensus: boolean
  reason: string
  recommendAction: "continue" | "consensus" | "extend"
  keyPoints: string[]
} {
  const recentDialogue = dialogueAnalysis.recentDialogue
  
  // 强共识关键词
  const strongConsensusKeywords = [
    "我同意你的观点",
    "我们达成共识",
    "我们的观点一致",
    "完全赞同",
    "我认为我们已经达成共识"
  ]
  
  // 中等共识关键词  
  const mediumConsensusKeywords = [
    "我同意",
    "我认同",
    "没有异议",
    "你说得对",
    "我们在这点上一致",
    "我支持这个观点"
  ]
  
  // 分歧关键词
  const disagreementKeywords = [
    "我不同意",
    "我认为不对",
    "存在分歧",
    "我有不同看法",
    "我持保留意见"
  ]
  
  // 问题解决关键词 - 新增
  const problemSolvingKeywords = [
    "解决了用户的问题",
    "回答了问题",
    "这样就能解决",
    "完整的解决方案",
    "全面回答了",
    "充分解决了"
  ]
  
  // 问题未解决关键词 - 新增
  const problemUnsolvedKeywords = [
    "还没有完全解决",
    "问题仍然存在",
    "还需要进一步",
    "还有疑问",
    "不够充分",
    "需要更详细"
  ]
  
  const hasStrongConsensus = strongConsensusKeywords.some(keyword => 
    recentDialogue.includes(keyword)
  )
  
  const hasMediumConsensus = mediumConsensusKeywords.some(keyword => 
    recentDialogue.includes(keyword)
  )
  
  const hasDisagreement = disagreementKeywords.some(keyword => 
    recentDialogue.includes(keyword)
  )
  
  const hasProblemSolving = problemSolvingKeywords.some(keyword => 
    recentDialogue.includes(keyword)
  )
  
  const hasProblemUnsolved = problemUnsolvedKeywords.some(keyword => 
    recentDialogue.includes(keyword)
  )
  
  let hasConsensus = false
  let reason = ""
  let recommendAction: "continue" | "consensus" | "extend" = "continue"
  let keyPoints: string[] = []
  
  // 问题匹配度检查 - 即使有共识信号，如果问题未解决也不应结束
  if (hasProblemUnsolved) {
    hasConsensus = false
    reason = "检测到问题仍未充分解决的信号，需要继续讨论"
    recommendAction = "continue"
    keyPoints = ["用户问题仍需进一步解答"]
  } else if (hasStrongConsensus && !hasDisagreement && hasProblemSolving) {
    hasConsensus = true
    reason = "检测到明确的共识表述且无分歧信号，并且问题得到解决"
    recommendAction = "consensus"
    keyPoints = ["双方明确表达了共识", "用户问题得到了解决"]
  } else if (hasStrongConsensus && !hasDisagreement) {
    // 有强共识但不确定问题是否解决
    hasConsensus = round >= 4 // 需要更多轮次确保充分讨论
    reason = hasConsensus ? 
      "检测到明确的共识表述且无分歧信号，但问题解决程度需要验证" : 
      "检测到共识信号但讨论轮次较少，建议继续以确保问题充分解决"
    recommendAction = hasConsensus ? "consensus" : "continue"
    keyPoints = hasConsensus ? ["双方明确表达了共识"] : []
  } else if (hasMediumConsensus && !hasDisagreement && hasProblemSolving) {
    hasConsensus = round >= 3 // 需要至少3轮讨论
    reason = hasConsensus ? 
      "检测到认同信号且问题得到解决，经过充分讨论" : 
      "检测到认同信号但讨论轮次较少，建议继续"
    recommendAction = hasConsensus ? "consensus" : "continue"
    keyPoints = hasConsensus ? ["双方表现出认同态度", "问题得到解决"] : []
  } else if (hasMediumConsensus && !hasDisagreement) {
    hasConsensus = false // 没有明确的问题解决信号，不建议结束
    reason = "检测到认同信号但问题解决程度不明确，建议继续讨论"
    recommendAction = "continue"
    keyPoints = []
  } else if (hasDisagreement) {
    hasConsensus = false
    reason = "检测到明确的分歧表述"
    recommendAction = round >= 6 ? "extend" : "continue"
  } else {
    hasConsensus = false
    reason = "未检测到明确的共识或分歧信号，也未确认问题是否得到解决"
    recommendAction = round >= 5 ? "extend" : "continue"
  }
  
  return {
    hasConsensus,
    reason,
    recommendAction,
    keyPoints
  }
}

/**
 * 回退的共识检测方法 - 基于关键词匹配（保持向后兼容）
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