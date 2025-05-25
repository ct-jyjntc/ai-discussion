"use client"

import { useState, useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { AIConfigPanel } from "./ai-config-panel"
import type { ConversationState, Message } from "@/types/conversation"
import { testAPI } from "@/actions/ai-conversation-v2"
import {
  analyzeQuestionStreaming,
  aiDiscussionStreaming,
  continueDiscussionStreaming,
  generateConsensusAnswerStreaming
} from "@/lib/streaming-api"
import { Loader2, Send, TestTube, Check, ChevronDown, ChevronRight, Brain, MessageSquare, Sparkles, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ModernMessage extends Message {
  isStreaming?: boolean
  streamingContent?: string
  isCollapsed?: boolean
}

export function ConversationFlowModern() {
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
      }, 4000) // 4秒后自动折叠

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

    // 自动展开当前消息
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
    setApiTestResult("测试中...")

    try {
      const result = await testAPI()
      if (result.success) {
        setApiTestResult("连接正常")
      } else {
        setApiTestResult("连接失败")
      }
    } catch (error: any) {
      setApiTestResult("连接错误")
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

    setCollapsedMessages(new Set())
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
    setCollapsedMessages(new Set())
    setQuestion("")
    setApiTestResult("")
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
        return `助手 A ${message.round ? `· 第${message.round}轮` : ""}`
      case "ai_b":
        return `助手 B ${message.round ? `· 第${message.round}轮` : ""}`
      case "user":
        return "问题"
      case "consensus":
        return "答案"
    }
  }

  const MessageCard = ({ message }: { message: Message }) => {
    const isActive = activeMessageId === message.id
    const isStreaming = !!streamingMessages[message.id]
    const isCollapsed = collapsedMessages.has(message.id)
    const canCollapse = message.role !== 'consensus' && message.role !== 'user'
    const displayContent = isStreaming ? streamingMessages[message.id] : message.content

    return (
      <div className={`group relative transition-all duration-500 ease-out ${
        isActive ? 'scale-[1.01] shadow-sm' : ''
      }`}>
        {/* 消息卡片 */}
        <div className={`relative bg-white rounded-md border transition-all duration-300 ${
          message.role === 'consensus' 
            ? 'border-slate-200 shadow-sm bg-slate-50' 
            : 'border-slate-100 hover:border-slate-200'
        } ${isActive ? 'ring-1 ring-slate-200' : ''}`}>
          
          {/* 头部 */}
          <div 
            className={`flex items-center justify-between p-4 ${
              canCollapse ? 'cursor-pointer' : ''
            } ${canCollapse && !isCollapsed && !isStreaming ? 'border-b border-slate-100' : ''}`}
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
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></div>
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
                        <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-slate-100 p-4 rounded-lg overflow-x-auto">
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto">
        {/* 顶部标题 */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200/60">
          <div className="px-4 sm:px-6 py-6 sm:py-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                AI 协作对话
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                两个AI助手将深度讨论您的问题，直到达成共识
              </p>
              
              {/* 进度指示 */}
              {conversation.isProcessing && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span className="text-sm text-slate-500">第 {conversation.currentRound} 轮讨论进行中</span>
                </div>
              )}
              
              {conversation.isComplete && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-600">讨论已完成</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 对话区域 */}
        <div className="px-6 py-8">
          {conversation.messages.length === 0 ? (
            /* 空状态 */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                开始智能对话
              </h2>
              <p className="text-slate-600 mb-8 max-w-md">
                输入任何需要深度思考的问题，观看AI助手们展开专业讨论
              </p>
              
              <div className="flex items-center gap-8 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                  <span>自动折叠过程</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  <span>实时流式显示</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                  <span>突出最终答案</span>
                </div>
              </div>
            </div>
          ) : (
            /* 消息列表 */
            <div className="space-y-6">
              {conversation.messages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 底部输入区 */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-slate-200/60">
          <div className="px-6 py-6">
            {/* API状态 */}
            {apiTestResult && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className={`w-2 h-2 rounded-full ${
                    apiTestResult.includes('正常') ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}></div>
                  <span>API状态: {apiTestResult}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* 输入框 */}
              <div className="relative">
                <Textarea
                  placeholder="请描述您的问题..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={conversation.isProcessing}
                  className="min-h-[100px] text-base resize-none border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 rounded-xl px-4 py-4 pr-16 transition-all duration-200 placeholder:text-slate-400 disabled:opacity-50"
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault()
                      startConversation()
                    }
                  }}
                />
                <div className="absolute bottom-4 right-4 text-xs text-slate-400">
                  {question.length}
                </div>
              </div>

              {/* 操作栏 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={startConversation}
                    disabled={!question.trim() || conversation.isProcessing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {conversation.isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {conversation.isProcessing ? "讨论中..." : "开始讨论"}
                  </button>

                  <button
                    onClick={testAPIConnection}
                    disabled={isTestingAPI}
                    className="inline-flex items-center gap-2 px-3 py-2.5 text-slate-600 text-sm hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition-all duration-200"
                  >
                    {isTestingAPI ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    测试
                  </button>

                  {conversation.messages.length > 0 && (
                    <button
                      onClick={resetConversation}
                      className="inline-flex items-center gap-2 px-3 py-2.5 text-slate-500 text-sm hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    >
                      重置
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600">⌘ Enter</kbd>
                  <span>发送</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 配置面板 */}
      <AIConfigPanel />
    </div>
  )
}