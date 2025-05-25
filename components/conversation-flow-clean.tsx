"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { EnhancedCard } from "./ui/enhanced-card"
import { 
  MainContainer, 
  StickyHeader, 
  MainContent, 
  StickyFooter, 
  EmptyState, 
  ErrorState 
} from "./layout/optimized-layout"
import { AIConfigPanel } from "./ai-config-panel"
import type { ConversationState, Message } from "@/types/conversation"
import { testAPI } from "@/actions/ai-conversation-v2"
import {
  analyzeQuestionStreaming,
  aiDiscussionStreaming,
  continueDiscussionStreaming,
  generateConsensusAnswerStreaming
} from "@/lib/streaming-api"
import { 
  Loader2, 
  Send, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Brain, 
  MessageSquare, 
  Sparkles, 
  User,
  AlertCircle,
  RefreshCw,
  TestTube
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function ConversationFlowClean() {
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
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set())
  const [apiTestResult, setApiTestResult] = useState<string>("")
  const [isTestingAPI, setIsTestingAPI] = useState(false)
  const [error, setError] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation.messages, streamingMessages])

  // 自动折叠逻辑
  useEffect(() => {
    if (activeMessageId) {
      const timer = setTimeout(() => {
        const prevActiveMessage = conversation.messages.find(m => m.id === activeMessageId)
        if (prevActiveMessage && prevActiveMessage.role !== 'consensus' && prevActiveMessage.role !== 'user') {
          setCollapsedMessages(prev => new Set([...prev, activeMessageId]))
        }
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [activeMessageId, conversation.messages])

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

    setCollapsedMessages(prev => {
      const newSet = new Set(prev)
      newSet.delete(newMessage.id)
      return newSet
    })
    
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

  const toggleMessageCollapse = (messageId: string) => {
    setCollapsedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const testAPIConnection = async () => {
    setIsTestingAPI(true)
    setApiTestResult("")
    setError("")

    try {
      const result = await testAPI()
      if (result.success) {
        setApiTestResult("API连接正常")
      } else {
        setApiTestResult("API连接失败")
        setError(result.error || "未知错误")
      }
    } catch (error: any) {
      setApiTestResult("API连接错误")
      setError(error.message)
    } finally {
      setIsTestingAPI(false)
    }
  }

  const startConversation = async () => {
    if (!question.trim()) return

    setError("")
    setConversation({
      messages: [],
      currentRound: 1,
      isComplete: false,
      isProcessing: true,
      originalQuestion: question,
    })

    setCollapsedMessages(new Set())
    addMessage("user", question)

    try {
      await processRound(question, 1)
    } catch (error: any) {
      console.error("Error starting conversation:", error)
      setError(`启动对话时出错: ${error.message}`)
      setConversation((prev) => ({ ...prev, isProcessing: false, isComplete: true }))
    }
  }

  const processRound = async (originalQuestion: string, round: number, fullDiscussion: string = "") => {
    try {
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
      await new Promise((resolve) => setTimeout(resolve, 1000))

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
        setConversation((prev) => ({
          ...prev,
          currentRound: round + 1,
        }))

        await new Promise((resolve) => setTimeout(resolve, 1000))
        await processRound(originalQuestion, round + 1, completeDiscussion)
      }
    } catch (error: any) {
      console.error("Error in round processing:", error)
      setError(`处理第${round}轮讨论时出错: ${error.message}`)
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
    setCollapsedMessages(new Set())
    setQuestion("")
    setApiTestResult("")
    setError("")
  }

  const getMessageIcon = (role: Message["role"]) => {
    switch (role) {
      case "ai_a":
        return <Brain className="w-4 h-4 text-slate-600" />
      case "ai_b":
        return <MessageSquare className="w-4 h-4 text-slate-600" />
      case "user":
        return <User className="w-4 h-4 text-slate-500" />
      case "consensus":
        return <Sparkles className="w-4 h-4 text-slate-800" />
    }
  }

  const getMessageTitle = (message: Message) => {
    switch (message.role) {
      case "ai_a":
        return `AI助手 Alpha ${message.round ? `· 第${message.round}轮` : ""}`
      case "ai_b":
        return `AI助手 Beta ${message.round ? `· 第${message.round}轮` : ""}`
      case "user":
        return "用户问题"
      case "consensus":
        return "🎯 共识答案"
    }
  }

  const MessageCard = ({ message }: { message: Message }) => {
    const isActive = activeMessageId === message.id
    const isStreaming = !!streamingMessages[message.id]
    const isCollapsed = collapsedMessages.has(message.id)
    const canCollapse = message.role !== 'consensus' && message.role !== 'user'
    const displayContent = isStreaming ? streamingMessages[message.id] : message.content

    return (
      <EnhancedCard
        variant={message.role === 'consensus' ? 'elevated' : 'default'}
        padding="none"
        className={cn(
          "transition-all duration-500 ease-out",
          isActive && "scale-[1.01] ring-1 ring-slate-200 shadow-md",
          message.role === 'consensus' && "bg-slate-50"
        )}
      >
        {/* 头部 */}
        <div 
          className={cn(
            "flex items-center justify-between p-4",
            canCollapse && "cursor-pointer hover:bg-slate-50/50",
            canCollapse && !isCollapsed && !isStreaming && "border-b border-slate-100",
            "transition-colors duration-200"
          )}
          onClick={() => canCollapse && toggleMessageCollapse(message.id)}
        >
          <div className="flex items-center gap-3">
            {canCollapse && (
              <div className="transition-transform duration-200">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            )}
            
            {getMessageIcon(message.role)}
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {getMessageTitle(message)}
              </span>
              
              {isStreaming && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-xs text-slate-500">正在思考</span>
                </div>
              )}
            </div>
          </div>
          
          <time className="text-xs text-slate-400">
            {new Date(message.timestamp).toLocaleTimeString()}
          </time>
        </div>

        {/* 内容区域 */}
        {(!isCollapsed || !canCollapse) && (
          <div className="px-4 pb-4">
            <div className="prose prose-sm prose-slate max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 last:mb-0 text-slate-700 leading-relaxed">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-slate-600">{children}</em>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className || !className.includes('language-')
                    return isInline ? (
                      <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded-md text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-slate-100 p-4 rounded-md overflow-x-auto">
                        <code className="text-sm font-mono text-slate-800">{children}</code>
                      </pre>
                    )
                  },
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 text-slate-700">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 text-slate-700">{children}</ol>
                  ),
                }}
              >
                {displayContent}
              </ReactMarkdown>
              
              {/* 流式光标 */}
              {isStreaming && (
                <span className="inline-block w-2 h-5 bg-slate-400 animate-pulse ml-1"></span>
              )}
            </div>
          </div>
        )}
      </EnhancedCard>
    )
  }

  // 渲染主内容
  const renderMainContent = () => {
    if (error && !conversation.isProcessing) {
      return (
        <ErrorState
          title="对话出现错误"
          message={error}
          retry={() => {
            setError("")
            if (conversation.originalQuestion) {
              startConversation()
            }
          }}
        />
      )
    }

    if (conversation.messages.length === 0) {
      return (
        <EmptyState
          icon={<MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />}
          title="开始智能协作对话"
          description="输入任何需要深度思考的问题，观看两个AI助手展开专业讨论，直到达成共识"
        />
      )
    }

    return (
      <div className="space-y-6">
        {conversation.messages.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    )
  }

  return (
    <MainContainer>
      {/* 主要内容区域 */}
      <MainContent className="pt-6 sm:pt-8 pb-40 sm:pb-48">
        {renderMainContent()}
      </MainContent>

      {/* 悬浮在底部的输入框 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-40">
        <div className="max-w-4xl mx-auto">
          {/* API状态提示 */}
          {error && (
            <div className="mb-3 p-3 rounded-md border bg-red-50 border-red-200 text-red-700 flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">连接异常</div>
                <div className="text-xs mt-1 opacity-75">{error}</div>
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <div className="relative">
            <textarea
              placeholder="请详细描述您的问题，AI助手们将进行深度讨论..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={conversation.isProcessing}
              className={cn(
                "w-full min-h-[80px] sm:min-h-[100px] p-3 pr-20 pb-14",
                "text-sm sm:text-base resize-none rounded-md",
                "border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
                "transition-all duration-200 placeholder:text-slate-400",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault()
                  startConversation()
                }
              }}
            />
            
            {/* 输入框内的按钮 */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1">
              {/* 重新开始按钮 */}
              {conversation.messages.length > 0 && (
                <button
                  onClick={resetConversation}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors duration-200"
                  title="重新开始"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              
              {/* 发送按钮 */}
              <button
                onClick={startConversation}
                disabled={!question.trim() || conversation.isProcessing}
                className="p-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
                title="发送"
              >
                {conversation.isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainContainer>
  )
}