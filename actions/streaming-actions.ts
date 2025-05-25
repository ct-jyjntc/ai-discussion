"use server"

import { AI_A_CONFIG, AI_B_CONFIG, CONSENSUS_CONFIG, generateSystemPrompt, callAI } from "@/lib/ai-config"

// 分析问题 - 流式传输
export async function analyzeQuestionStreaming(question: string, round: number = 1) {
  const systemPrompt = generateSystemPrompt(AI_A_CONFIG, 'ai_a', round)
  const userPrompt = `用户问题："${question}"\n\n请开始分析这个问题，提出你的初步观点。`
  
  try {
    return await callAI(AI_A_CONFIG, systemPrompt, userPrompt)
  } catch (error: any) {
    throw new Error(`${AI_A_CONFIG.name}分析失败: ${error.message}`)
  }
}

// AI讨论 - 流式传输
export async function aiDiscussionStreaming(
  question: string,
  aiAResponse: string,
  round: number,
  fullDiscussion: string = ""
) {
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

// 继续讨论 - 流式传输
export async function continueDiscussionStreaming(
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

// 生成共识答案 - 流式传输
export async function generateConsensusAnswerStreaming(
  question: string,
  fullDiscussion: string
) {
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