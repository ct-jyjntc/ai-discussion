"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CollapsibleMessageCard } from "./collapsible-message-card"
import { AIConfigPanel } from "./ai-config-panel"
import type { ConversationState, Message } from "@/types/conversation"
import { testAPI } from "@/actions/ai-conversation-v2"
import {
  analyzeQuestionStreaming,
  aiDiscussionStreaming,
  continueDiscussionStreaming,
  generateConsensusAnswerStreaming
} from "@/lib/streaming-api"
import { Loader2, Send, TestTube, Check } from "lucide-react"

interface StreamingMessage extends Message {
  isStreaming?: boolean
  streamingContent?: string
}

export function ConversationFlowMinimal() {
  const [question, setQuestion] = useState("")
  const [conversation, setConversation] = useState<ConversationState>({
    messages: [],
    currentRound: 0,
    isComplete: false,
    isProcessing: false,
    originalQuestion: "",
  })
  const [streamingMessages, setStreamingMessages] = useState<Record<string, string>>({})
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const [apiTestResult, setApiTestResult] = useState<string>("")
  const [isTestingAPI, setIsTestingAPI] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation.messages, streamingMessages])

  const addMessage = (role: Message["role"], content: string, round?: number): Message => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      round,
    }

    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }))

    return newMessage
  }

  const createStreamingMessage = (role: Message["role"], round?: number): Message => {
    const newMessage: Message = {
      id: `streaming_${Date.now()}`,
      role,
      content: "",
      timestamp: new Date(),
      round,
    }

    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }))

    setActiveMessageId(newMessage.id)
    return newMessage
  }

  const updateStreamingMessage = (messageId: string, content: string, isComplete: boolean) => {
    setStreamingMessages(prev => ({ ...prev, [messageId]: content }))
    
    if (isComplete) {
      setConversation(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, content } : msg
        )
      }))
      
      setStreamingMessages(prev => {
        const { [messageId]: _, ...rest } = prev
        return rest
      })
      
      setActiveMessageId(null)
    }
  }

  const testAPIConnection = async () => {
    setIsTestingAPI(true)
    setApiTestResult("正在测试API连接...")

    try {
      const result = await testAPI()
      if (result.success) {
        setApiTestResult(`✅ 连接成功`)
      } else {
        setApiTestResult(`❌ 连接失败`)
      }
    } catch (error: any) {
      setApiTestResult(`❌ 连接错误`)
    } finally {
      setIsTestingAPI(false)
    }
  }

  const startConversation = async () => {
    if (!question.trim()) return

    setConversation({
      messages: [],
      currentRound: 1,
      isComplete: false,
      isProcessing: true,
      originalQuestion: question,
    })

    addMessage("user", question)

    try {
      await processRound(question, 1)
    } catch (error: any) {
      console.error("Error starting conversation:", error)
      addMessage("consensus", `启动对话时出错: ${error.message}`)
      setConversation((prev) => ({ ...prev, isProcessing: false, isComplete: true }))
    }
  }

  const processRound = async (originalQuestion: string, round: number, fullDiscussion: string = "") => {
    try {
      console.log(`Starting round ${round}`)

      // AI助手A发言
      const aiAMessage = createStreamingMessage("ai_a", round)
      let aiAResponse: string

      if (round === 1) {
        aiAResponse = await analyzeQuestionStreaming(
          originalQuestion, 
          round,
          (chunk, isComplete) => updateStreamingMessage(aiAMessage.id, chunk, isComplete)
        )
      } else {
        aiAResponse = await continueDiscussionStreaming(
          originalQuestion,
          fullDiscussion,
          round,
          true,
          (chunk, isComplete) => updateStreamingMessage(aiAMessage.id, chunk, isComplete)
        )
      }

      const newDiscussion = fullDiscussion + `\n\n【AI助手A - 第${round}轮】：\n${aiAResponse}`
      await new Promise((resolve) => setTimeout(resolve, 800))

      // AI助手B回应
      const aiBMessage = createStreamingMessage("ai_b", round)
      const aiBResponse = await aiDiscussionStreaming(
        originalQuestion,
        aiAResponse,
        round,
        (chunk, isComplete) => updateStreamingMessage(aiBMessage.id, chunk, isComplete),
        newDiscussion
      )

      const completeDiscussion = newDiscussion + `\n\n【AI助手B - 第${round}轮】：\n${aiBResponse}`

      // 检查共识
      const hasConsensus = aiBResponse.includes("我们达成共识") || 
                          aiBResponse.includes("达成共识") || 
                          aiBResponse.includes("我同意") || 
                          aiBResponse.includes("我认同")
      
      if (hasConsensus || round >= 4) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        
        const consensusMessage = createStreamingMessage("consensus")
        await generateConsensusAnswerStreaming(
          originalQuestion,
          completeDiscussion,
          (chunk, isComplete) => updateStreamingMessage(consensusMessage.id, chunk, isComplete)
        )

        setConversation((prev) => ({
          ...prev,
          isComplete: true,
          isProcessing: false,
        }))
      } else {
        setConversation((prev) => ({
          ...prev,
          currentRound: round + 1,
        }))

        await new Promise((resolve) => setTimeout(resolve, 800))
        await processRound(originalQuestion, round + 1, completeDiscussion)
      }
    } catch (error: any) {
      console.error("Error in round processing:", error)
      addMessage("consensus", `处理错误: ${error.message}`)
      setConversation((prev) => ({ ...prev, isProcessing: false, isComplete: true }))
    }
  }

  const resetConversation = () => {
    setConversation({
      messages: [],
      currentRound: 0,
      isComplete: false,
      isProcessing: false,
      originalQuestion: "",
    })
    setStreamingMessages({})
    setActiveMessageId(null)
    setQuestion("")
    setApiTestResult("")
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            AI双向对话协作系统
          </h1>
          <p className="text-sm text-gray-500 text-center mt-1">
            实时对话流程，智能折叠展示
          </p>
          
          {/* 状态指示器 */}
          {conversation.messages.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-500">
              <div className="h-px bg-gray-300 flex-1"></div>
              <div className="flex items-center gap-2">
                {conversation.isProcessing && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                    <span>第{conversation.currentRound}轮讨论</span>
                  </>
                )}
                {conversation.isComplete && (
                  <>
                    <Check className="h-3 w-3 text-gray-600" />
                    <span>讨论完成</span>
                  </>
                )}
              </div>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
          )}
        </div>
      </div>

      {/* 中间对话区域 */}
      <div className="flex-1 overflow-hidden">
        {conversation.messages.length === 0 ? (
          /* 欢迎界面 */
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">⚪⚫⚪</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">简约对话系统</h2>
              <p className="text-gray-600 mb-6">
                流式传输，智能折叠，专注内容
              </p>
              
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>过程步骤自动折叠</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span>实时流式传输</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  <span>最终结果突出</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 对话消息区域 */
          <div className="h-full overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {conversation.messages.map((message, index) => (
                <div key={message.id} className="relative">
                  {index > 0 && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                  )}
                  <CollapsibleMessageCard 
                    message={message}
                    isActive={activeMessageId === message.id}
                    isStreaming={!!streamingMessages[message.id]}
                    streamingContent={streamingMessages[message.id] || ""}
                    defaultCollapsed={false}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* 底部输入区域 */}
      <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* API状态提示 */}
          {apiTestResult && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
              <div className={`w-2 h-2 rounded-full mt-2 ${apiTestResult.includes('✅') ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
              <div className="flex-1 text-gray-700">{apiTestResult}</div>
            </div>
          )}

          {/* 输入框和操作区 */}
          <div className="space-y-3">
            <div className="relative">
              <Textarea
                placeholder="请输入您的问题..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={conversation.isProcessing}
                className="min-h-[80px] text-base resize-none border border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 rounded-lg px-4 py-3 pr-16 transition-all duration-200 placeholder:text-gray-400"
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault()
                    startConversation()
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-1 rounded">
                {question.length}
              </div>
            </div>

            {/* 操作按钮栏 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={startConversation}
                  disabled={!question.trim() || conversation.isProcessing}
                  className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:text-gray-400 transition-colors"
                >
                  {conversation.isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  )}
                  {conversation.isProcessing ? "讨论中" : "开始"}
                </button>

                <div className="h-4 w-px bg-gray-300"></div>

                <button
                  onClick={testAPIConnection}
                  disabled={isTestingAPI}
                  className="group flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-400 transition-colors"
                >
                  {isTestingAPI ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  )}
                  测试
                </button>

                {conversation.messages.length > 0 && (
                  <>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <button
                      onClick={resetConversation}
                      className="group flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <div className="h-4 w-4 rounded-full border border-current group-hover:rotate-180 transition-transform duration-300"></div>
                      重置
                    </button>
                  </>
                )}
              </div>

              <div className="text-xs text-gray-400">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘ Enter</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI配置面板 */}
      <AIConfigPanel />
    </div>
  )
}