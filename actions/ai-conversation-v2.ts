"use server"

import type { ConversationState, Message } from "@/types/conversation"
import { AI_A_CONFIG, AI_B_CONFIG, CONSENSUS_CONFIG, generateSystemPrompt, callAI } from "@/lib/ai-config"

export async function testAPI() {
  try {
    const result = await callAI(
      AI_A_CONFIG, 
      "你是一个测试AI，请简短回复。", 
      "请回复'连接成功'"
    )
    
    return { 
      success: true, 
      data: result 
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    }
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
    return await callAI(AI_A_CONFIG, systemPrompt, userPrompt)
  } catch (error: any) {
    throw new Error(`${AI_A_CONFIG.name}分析失败: ${error.message}`)
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
    return await callAI(AI_B_CONFIG, systemPrompt, userPrompt)
  } catch (error: any) {
    throw new Error(`${AI_B_CONFIG.name}讨论失败: ${error.message}`)
  }
}

export async function continueDiscussion(
  question: string,
  fullDiscussion: string,
  round: number,
  isAiA: boolean = true
) {
  const config = isAiA ? AI_A_CONFIG : AI_B_CONFIG
  const role = isAiA ? 'ai_a' : 'ai_b'
  const systemPrompt = generateSystemPrompt(config, role, round)

  const userPrompt = `用户问题："${question}"

完整讨论历史：
${fullDiscussion}

请继续讨论，提出你的进一步观点。`

  try {
    return await callAI(config, systemPrompt, userPrompt)
  } catch (error: any) {
    throw new Error(`${config.name}继续讨论失败: ${error.message}`)
  }
}

export async function generateConsensusAnswer(question: string, fullDiscussion: string) {
  const systemPrompt = generateSystemPrompt(CONSENSUS_CONFIG, 'consensus', 1)

  const userPrompt = `用户问题："${question}"

${AI_A_CONFIG.name}和${AI_B_CONFIG.name}的完整讨论：
${fullDiscussion}

请基于他们的讨论，生成最终的共识答案。`

  try {
    return await callAI(CONSENSUS_CONFIG, systemPrompt, userPrompt)
  } catch (error: any) {
    throw new Error(`生成共识答案失败: ${error.message}`)
  }
}

// 智能对话处理器 - 整合所有对话逻辑
export async function startCollaborativeDiscussion(question: string): Promise<ConversationState> {
  const conversation: ConversationState = {
    messages: [],
    currentRound: 0,
    isComplete: false,
    isProcessing: true,
    originalQuestion: question,
  }

  try {
    // 添加用户问题
    conversation.messages.push({
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    })

    let fullDiscussion = ""
    let round = 1
    const maxRounds = 4

    while (round <= maxRounds) {
      conversation.currentRound = round

      // AI助手A发言
      let aiAResponse: string
      if (round === 1) {
        aiAResponse = await analyzeQuestion(question, round)
      } else {
        aiAResponse = await continueDiscussion(question, fullDiscussion, round, true)
      }

      conversation.messages.push({
        id: `ai_a_${round}_${Date.now()}`,
        role: "ai_a",
        content: aiAResponse,
        timestamp: new Date(),
        round,
      })

      // 更新讨论历史
      fullDiscussion += `\n\n【${AI_A_CONFIG.name} - 第${round}轮】：\n${aiAResponse}`

      // AI助手B回应
      const aiBResponse = await aiDiscussion(question, aiAResponse, round, fullDiscussion)
      
      conversation.messages.push({
        id: `ai_b_${round}_${Date.now()}`,
        role: "ai_b",
        content: aiBResponse,
        timestamp: new Date(),
        round,
      })

      // 更新完整讨论历史
      fullDiscussion += `\n\n【${AI_B_CONFIG.name} - 第${round}轮】：\n${aiBResponse}`

      // 检查是否达成共识
      const hasConsensus = aiBResponse.includes("我们达成共识") || 
                          aiBResponse.includes("达成共识") || 
                          aiBResponse.includes("我同意") || 
                          aiBResponse.includes("我认同")

      if (hasConsensus || round >= maxRounds) {
        // 生成共识答案
        const consensusAnswer = await generateConsensusAnswer(question, fullDiscussion)
        
        conversation.messages.push({
          id: `consensus_${Date.now()}`,
          role: "consensus",
          content: consensusAnswer,
          timestamp: new Date(),
        })

        conversation.isComplete = true
        conversation.isProcessing = false
        break
      }

      round++
    }

    return conversation
  } catch (error: any) {
    conversation.messages.push({
      id: `error_${Date.now()}`,
      role: "consensus",
      content: `对话过程中出现错误: ${error.message}`,
      timestamp: new Date(),
    })
    
    conversation.isComplete = true
    conversation.isProcessing = false
    
    return conversation
  }
}