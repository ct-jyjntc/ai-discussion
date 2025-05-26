import type { ConsensusResult } from "@/actions/consensus-detection"

export interface Message {
  id: string
  role: "ai_a" | "ai_b" | "user" | "consensus"
  content: string
  timestamp: Date
  round?: number
  consensusResult?: ConsensusResult // 添加共识检测结果
}

export interface ConversationState {
  messages: Message[]
  currentRound: number
  isComplete: boolean
  isProcessing: boolean
  originalQuestion: string
  finalConsensusResult?: ConsensusResult // 添加最终共识结果
}
