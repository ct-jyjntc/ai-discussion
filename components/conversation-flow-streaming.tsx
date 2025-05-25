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

export function ConversationFlowStreaming() {
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
      // 完成流式传输，更新最终消息
      setConversation(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, content } : msg
        )
      }))
      
      // 清理流式状态
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
        setApiTestResult(`✅ API连接成功！响应: ${result.data}`)
      } else {
        setApiTestResult(`❌ API测试失败: ${result.error}`)
      }
    } catch (error: any) {
      setApiTestResult(`❌ API测试错误: ${error.message}`)
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

    // 添加用户问题
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

      // AI助手A发言 - 流式传输
      const aiAMessage = createStreamingMessage("ai_a", round)
      let aiAResponse: string

      if (round === 1) {
        console.log("AI助手A开始分析...")
        aiAResponse = await analyzeQuestionStreaming(
          originalQuestion, 
          round,
          (chunk, isComplete) => updateStreamingMessage(aiAMessage.id, chunk, isComplete)
        )
      } else {
        console.log("AI助手A继续讨论...")
        aiAResponse = await continueDiscussionStreaming(
          originalQuestion,
          fullDiscussion,
          round,
          true,
          (chunk, isComplete) => updateStreamingMessage(aiAMessage.id, chunk, isComplete)
        )
      }

      // 更新讨论历史
      const newDiscussion = fullDiscussion + `\n\n【AI助手A - 第${round}轮】：\n${aiAResponse}`

      // 延迟以改善用户体验
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // AI助手B回应 - 流式传输
      const aiBMessage = createStreamingMessage("ai_b", round)
      console.log("AI助手B回应...")
      
      const aiBResponse = await aiDiscussionStreaming(
        originalQuestion,
        aiAResponse,
        round,
        (chunk, isComplete) => updateStreamingMessage(aiBMessage.id, chunk, isComplete),
        newDiscussion
      )

      // 更新完整讨论历史
      const completeDiscussion = newDiscussion + `\n\n【AI助手B - 第${round}轮】：\n${aiBResponse}`

      // 检查是否达成共识或达到最大轮数
      const hasConsensus = aiBResponse.includes("我们达成共识") || 
                          aiBResponse.includes("达成共识") || 
                          aiBResponse.includes("我同意") || 
                          aiBResponse.includes("我认同")
      
      if (hasConsensus || round >= 4) {
        // 生成共识答案 - 流式传输
        console.log("生成共识答案...")
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
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
        // 继续下一轮对话
        console.log(`继续第${round + 1}轮对话`)
        setConversation((prev) => ({
          ...prev,
          currentRound: round + 1,
        }))

        await new Promise((resolve) => setTimeout(resolve, 1000))
        await processRound(originalQuestion, round + 1, completeDiscussion)
      }
    } catch (error: any) {
      console.error("Error in round processing:", error)

      addMessage(
        "consensus",
        `在处理您的问题时遇到错误: ${error.message}。请使用"测试连接"按钮检查连接后重试。`,
      )

      setConversation((prev) => ({
        ...prev,
        isProcessing: false,
        isComplete: true,
      }))
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 顶部标题栏 */}
      <div className="flex-shrink-0 p-4 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
            AI双向对话协作系统
          </h1>
          <p className="text-sm text-gray-600 text-center mt-1">
            观看两个AI助手实时讨论，可折叠查看过程
          </p>
          
          {/* 状态指示器 */}
          {conversation.messages.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-3 text-sm text-gray-500">
              <div className="h-px bg-gray-300 flex-1"></div>
              <div className="flex items-center gap-2">
                {conversation.isProcessing && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    <span>第{conversation.currentRound}轮讨论</span>
                  </>
                )}
                {conversation.isComplete && (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
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
              <div className="text-6xl mb-4">🤖💬🤖</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">智能折叠对话系统</h2>
              <p className="text-gray-600 mb-6">
                支持流式传输和智能折叠，专注当前步骤，保持界面整洁
              </p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>过程步骤可自动折叠</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>实时流式传输效果</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>最终结果始终展开</span>
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
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
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
      <div className="flex-shrink-0 p-4 bg-white/90 backdrop-blur-sm border-t">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* API状态提示 */}
          {apiTestResult && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
              <div className={`w-2 h-2 rounded-full mt-2 ${apiTestResult.includes('✅') ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="flex-1 text-gray-700">{apiTestResult}</div>
            </div>
          )}

          {/* 输入框和操作区 */}
          <div className="space-y-3">
            <div className="relative">
              <Textarea
                placeholder="请输入您的问题，系统将实时展示AI对话过程，中间步骤可以折叠..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={conversation.isProcessing}
                className="min-h-[80px] text-base resize-none border-2 border-gray-200 focus:border-blue-400 rounded-xl px-4 py-3 pr-16 transition-all duration-300 placeholder:text-gray-400"
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault()
                    startConversation()
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-1 rounded">
                {question.length}/2000
              </div>
            </div>

            {/* 操作按钮栏 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={startConversation}
                  disabled={!question.trim() || conversation.isProcessing}
                  className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
                >
                  {conversation.isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  )}
                  {conversation.isProcessing ? "实时讨论中..." : "开始流式协作"}
                </button>

                <div className="h-4 w-px bg-gray-300"></div>

                <button
                  onClick={testAPIConnection}
                  disabled={isTestingAPI}
                  className="group flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 transition-colors"
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
                      className="group flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <div className="h-4 w-4 rounded-full border border-current group-hover:rotate-180 transition-transform duration-300"></div>
                      重置
                    </button>
                  </>
                )}
              </div>

              <div className="text-xs text-gray-400">
                按 <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘ + Enter</kbd> 快速发送
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