export interface Message {
  id: string
  role: "ai_a" | "ai_b" | "user" | "consensus"
  content: string
  timestamp: Date
  round?: number
}

export interface ConversationState {
  messages: Message[]
  currentRound: number
  isComplete: boolean
  isProcessing: boolean
  originalQuestion: string
}
