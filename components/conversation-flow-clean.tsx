"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { EnhancedCard } from "./ui/enhanced-card"
import { ConsensusInsights } from "./ui/consensus-insights"
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
} from "@/actions/streaming-actions"
import type { ConsensusResult } from "@/actions/consensus-detection"
import {
  Loader2,
  SendHorizontal,
  Check,
  ChevronDown,
  ChevronRight,
  Brain,
  MessageSquare,
  Sparkles,
  User,
  AlertCircle,
  RefreshCw,
  TestTube,
  Github
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
    finalConsensusResult: undefined,
  })
  const [streamingMessages, setStreamingMessages] = useState<Record<string, string>>({})
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set())
  const [apiTestResult, setApiTestResult] = useState<string>("")
  const [isTestingAPI, setIsTestingAPI] = useState(false)
  const [error, setError] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 随机问题库
  const randomQuestions = [
    "如何在工作中保持高效和创造力的平衡？",
    "人工智能对未来教育模式会产生什么影响？",
    "在数字化时代，如何培养深度思考的能力？",
    "远程工作与传统办公相比有哪些优缺点？",
    "如何在快节奏的生活中保持心理健康？",
    "区块链技术除了加密货币还有哪些应用前景？",
    "可持续发展和经济增长之间如何找到平衡？",
    "社交媒体对人际关系的影响是积极还是消极？",
    "如何设计一个理想的城市交通系统？",
    "在人工智能时代，哪些技能最值得学习？"
  ]

  const getRandomQuestions = () => {
    const shuffled = [...randomQuestions].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3)
  }

  const [displayQuestions, setDisplayQuestions] = useState(randomQuestions.slice(0, 3))

  useEffect(() => {
    // 仅在客户端执行随机化
    setDisplayQuestions(getRandomQuestions())
  }, [])

  const handleQuestionClick = (selectedQuestion: string) => {
    setQuestion(selectedQuestion)
    // 稍微延迟一下，让用户看到问题被填入
    setTimeout(() => {
      startConversation()
    }, 100)
  }

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

    setCollapsedMessages(prev => {
      const newSet = new Set(prev)
      newSet.delete(newMessage.id)
      return newSet
    })
    
    // 如果是共识消息开始，折叠所有之前的AI消息
    if (role === 'consensus') {
      setTimeout(() => {
        setCollapsedMessages(prev => {
          const newSet = new Set(prev)
          conversation.messages.forEach(msg => {
            if (msg.role === 'ai_a' || msg.role === 'ai_b') {
              newSet.add(msg.id)
            }
          })
          return newSet
        })
      }, 100) // 小延迟确保消息已添加到状态中
    }
    
    setActiveMessageId(newMessage.id)
    return newMessage
  }

  const updateStreamingMessage = (messageId: string, content: string, isComplete: boolean) => {
    setStreamingMessages(prev => ({ ...prev, [messageId]: content }))
    
    if (isComplete) {
      setConversation(prev => {
        const updatedMessages = prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, content } : msg
        )
        
        // 获取刚完成的消息信息
        const completedMessage = updatedMessages.find(m => m.id === messageId)
        
        // 如果是AI消息完成，延迟2秒后折叠
        if (completedMessage && completedMessage.role !== 'consensus' && completedMessage.role !== 'user') {
          setTimeout(() => {
            setCollapsedMessages(prevCollapsed => new Set([...prevCollapsed, messageId]))
          }, 2000)
        }
        
        return {
          ...prev,
          messages: updatedMessages
        }
      })
      
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
      finalConsensusResult: undefined,
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
      let aiAResponse: string = ""

      try {
        if (round === 1) {
          aiAResponse = await streamAnalyzeQuestionRealTime(
            originalQuestion, 
            round,
            (chunk: string) => {
              aiAResponse += chunk
              updateStreamingMessage(aiAMessage.id, aiAResponse, false)
            }
          )
        } else {
          aiAResponse = await streamContinueDiscussionRealTime(
            originalQuestion,
            fullDiscussion,
            round,
            true,
            (chunk: string) => {
              aiAResponse += chunk
              updateStreamingMessage(aiAMessage.id, aiAResponse, false)
            }
          )
        }
      } catch (error: any) {
        console.error(`AI助手A第${round}轮失败:`, error)
        aiAResponse = `[AI助手A暂时无法响应，可能是由于API使用限制。错误信息: ${error.message}]`
        updateStreamingMessage(aiAMessage.id, aiAResponse, false)
        
        // 如果是API限制错误，不继续执行
        if (error.message.includes("Too many computers") || error.message.includes("rate limit")) {
          updateStreamingMessage(aiAMessage.id, aiAResponse + "\n\n请稍后重试或联系管理员。", true)
          throw new Error("API使用限制，请稍后重试")
        }
      }
      
      // 确保有内容才继续
      if (!aiAResponse.trim()) {
        aiAResponse = `[AI助手A在第${round}轮没有提供有效回应]`
      }
      
      // 标记完成
      updateStreamingMessage(aiAMessage.id, aiAResponse, true)

      const newDiscussion = fullDiscussion + `\n\n【AI助手A - 第${round}轮】：\n${aiAResponse}`
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // AI助手B回应
      const aiBMessage = createStreamingMessage("ai_b", round)
      let aiBResponse: string = ""
      
      try {
        aiBResponse = await streamAIDiscussionRealTime(
          originalQuestion,
          aiAResponse,
          round,
          newDiscussion,
          (chunk: string) => {
            aiBResponse += chunk
            updateStreamingMessage(aiBMessage.id, aiBResponse, false)
          }
        )
      } catch (error: any) {
        console.error(`AI助手B第${round}轮失败:`, error)
        aiBResponse = `[AI助手B暂时无法响应，可能是由于API使用限制。错误信息: ${error.message}]`
        updateStreamingMessage(aiBMessage.id, aiBResponse, false)
        
        // 如果是API限制错误，不继续执行
        if (error.message.includes("Too many computers") || error.message.includes("rate limit")) {
          updateStreamingMessage(aiBMessage.id, aiBResponse + "\n\n请稍后重试或联系管理员。", true)
          throw new Error("API使用限制，请稍后重试")
        }
      }
      
      // 确保有内容才继续
      if (!aiBResponse.trim()) {
        aiBResponse = `[AI助手B在第${round}轮没有提供有效回应]`
      }
      
      // 标记完成
      updateStreamingMessage(aiBMessage.id, aiBResponse, true)

      const completeDiscussion = newDiscussion + `\n\n【AI助手B - 第${round}轮】：\n${aiBResponse}`

      // 使用AI检测共识
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // 创建共识检测状态消息（简单提示，不可展开）
      const consensusDetectionMessage = createStreamingMessage("system")
      updateStreamingMessage(consensusDetectionMessage.id, "正在分析对话内容...", false)
      
      try {
        console.log(`开始共识检测 - 第${round}轮`)
        
        const consensusResult = await streamConsensusDetectionRealTime(
          originalQuestion,
          completeDiscussion,
          round,
          (status: string) => {
            console.log(`共识检测进度: ${status}`)
            // 保持简单的提示文本，不更新状态
            // updateStreamingMessage(consensusDetectionMessage.id, `🤖 ${status}`, false)
          }
        )
        
        console.log(`共识检测结果:`, consensusResult)
        
        // 删除检测状态消息
        setConversation((prev) => ({
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== consensusDetectionMessage.id)
        }))
        setStreamingMessages(prev => {
          const { [consensusDetectionMessage.id]: _, ...rest } = prev
          return rest
        })
        
        // 决策逻辑优化：优先基于 recommendAction，确保逻辑一致性
        const shouldGenerateConsensus = consensusResult.recommendAction === "consensus"
        
        // 如果检测到矛盾，记录日志
        if (consensusResult.hasConsensus && consensusResult.recommendAction === "continue") {
          console.log(`检测到共识状态矛盾: hasConsensus=${consensusResult.hasConsensus}, recommendAction=${consensusResult.recommendAction}`)
          console.log(`基于 recommendAction 决定继续讨论`)
        }
        
        if (shouldGenerateConsensus) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          
          const consensusMessage = createStreamingMessage("consensus")
          let consensusResponse: string = ""
          
          consensusResponse = await streamGenerateConsensusAnswerRealTime(
            originalQuestion,
            completeDiscussion,
            (chunk: string) => {
              consensusResponse += chunk
              updateStreamingMessage(consensusMessage.id, consensusResponse, false)
            }
          )
          
          // 标记完成并添加共识检测结果
          updateStreamingMessage(consensusMessage.id, consensusResponse, true)

          // 更新消息并添加共识检测结果
          setConversation((prev) => ({
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === consensusMessage.id 
                ? { ...msg, consensusResult } 
                : msg
            ),
            finalConsensusResult: consensusResult,
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
        
      } catch (consensusError: any) {
        console.error("共识检测失败，使用备用方案:", consensusError)
        
        // 删除检测状态消息
        setConversation((prev) => ({
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== consensusDetectionMessage.id)
        }))
        setStreamingMessages(prev => {
          const { [consensusDetectionMessage.id]: _, ...rest } = prev
          return rest
        })
        
        // 如果是API限制错误，直接结束
        if (consensusError.message.includes("Too many computers") || 
            consensusError.message.includes("rate limit")) {
          throw consensusError
        }
        
        // 回退到简单的关键词检测（仅基于明确的共识表达）
        const hasConsensus = aiBResponse.includes("我同意你的观点") ||
                            aiBResponse.includes("我们在这点上达成了一致") ||
                            aiBResponse.includes("我认为我们已经达成共识") ||
                            aiBResponse.includes("我们达成共识") ||
                            aiBResponse.includes("达成共识")
        
        if (hasConsensus) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          
          const consensusMessage = createStreamingMessage("consensus")
          let consensusResponse: string = ""
          
          consensusResponse = await streamGenerateConsensusAnswerRealTime(
            originalQuestion,
            completeDiscussion,
            (chunk: string) => {
              consensusResponse += chunk
              updateStreamingMessage(consensusMessage.id, consensusResponse, false)
            }
          )
          
          // 标记完成
          updateStreamingMessage(consensusMessage.id, consensusResponse, true)

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
      finalConsensusResult: undefined,
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
      case "system":
        return <AlertCircle className="w-4 h-4 text-slate-600" />
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
      case "system":
        return "💭 系统提示"
    }
  }

  const MessageCard = ({ message }: { message: Message }) => {
    const isActive = activeMessageId === message.id
    const isStreaming = !!streamingMessages[message.id]
    const isCollapsed = collapsedMessages.has(message.id)
    const canCollapse = message.role !== 'consensus' && message.role !== 'user' && message.role !== 'system'
    const displayContent = isStreaming ? streamingMessages[message.id] : message.content

    // 系统消息显示为简单的状态条
    if (message.role === 'system') {
      return (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
            <div className="flex items-center gap-0.5">
              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
            <span className="text-xs text-slate-600">{displayContent}</span>
          </div>
        </div>
      )
    }

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
            
            {/* 共识答案的问题匹配度分析 */}
            {message.role === 'consensus' && message.consensusResult && !isStreaming && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <ConsensusInsights 
                  consensusResult={message.consensusResult}
                  className="bg-white"
                />
              </div>
            )}
          </div>
        )}
      </EnhancedCard>
    )
  }

  // 渲染主内容
  const renderMainContent = () => {
    if (error && !conversation.isProcessing) {
      // 检查是否是API限制错误
      const isApiLimitError = error.includes("Too many computers") || 
                             error.includes("rate limit") ||
                             error.includes("API使用限制")
      
      return (
        <ErrorState
          title={isApiLimitError ? "API使用限制" : "对话出现错误"}
          message={isApiLimitError ? 
            "当前API提供商设置了使用限制，请稍后重试或联系管理员更换API配置。" :
            error
          }
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
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="space-y-3 w-full max-w-2xl">
            {displayQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuestionClick(question)}
                className="w-full p-4 text-left bg-white border border-slate-200 rounded-md hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-slate-600 font-medium">{index + 1}</span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 group-hover:text-slate-900 transition-colors duration-200">
                    {question}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
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

  // 流式传输辅助函数
  const streamResponse = async (
    endpoint: string,
    data: any,
    onChunk: (chunk: string) => void
  ): Promise<string> => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ""

    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              
              if (data === '[DONE]') {
                return fullContent
              }

              try {
                const json = JSON.parse(data)
                const content = json.content || ''
                
                if (content) {
                  fullContent += content
                  onChunk(content)
                }
              } catch (parseError) {
                continue
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    }

    return fullContent
  }

  // 实时流式分析问题
  const streamAnalyzeQuestionRealTime = async (
    question: string,
    round: number,
    onChunk: (chunk: string) => void
  ): Promise<string> => {
    return await streamResponse('/api/stream/analyze', { question, round }, onChunk)
  }

  // 实时流式AI讨论
  const streamAIDiscussionRealTime = async (
    question: string,
    aiAResponse: string,
    round: number,
    fullDiscussion: string,
    onChunk: (chunk: string) => void
  ): Promise<string> => {
    return await streamResponse('/api/stream/discuss', {
      question,
      aiAResponse,
      round,
      fullDiscussion
    }, onChunk)
  }

  // 实时流式继续讨论
  const streamContinueDiscussionRealTime = async (
    question: string,
    fullDiscussion: string,
    round: number,
    isAiA: boolean,
    onChunk: (chunk: string) => void
  ): Promise<string> => {
    return await streamResponse('/api/stream/continue', {
      question,
      fullDiscussion,
      round,
      isAiA
    }, onChunk)
  }

  // 实时流式生成共识答案
  const streamGenerateConsensusAnswerRealTime = async (
    question: string,
    fullDiscussion: string,
    onChunk: (chunk: string) => void
  ): Promise<string> => {
    return await streamResponse('/api/stream/consensus', {
      question,
      fullDiscussion
    }, onChunk)
  }

  // 实时流式共识检测
  const streamConsensusDetectionRealTime = async (
    question: string,
    fullDiscussion: string,
    round: number,
    onProgress?: (status: string) => void
  ): Promise<ConsensusResult> => {
    const response = await fetch('/api/stream/consensus-detection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, fullDiscussion, round }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let result: ConsensusResult | null = null

    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              
              if (data === '[DONE]') {
                return result || {
                  hasConsensus: false,
                  confidence: 0,
                  reason: "检测失败",
                  recommendAction: "continue",
                  keyPoints: [],
                  suggestions: []
                }
              }

              try {
                const json = JSON.parse(data)
                
                if (json.type === 'progress' && onProgress) {
                  onProgress(json.content)
                } else if (json.type === 'result') {
                  result = json.content
                } else if (json.type === 'error') {
                  throw new Error(json.content)
                }
              } catch (parseError) {
                continue
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    }

    return result || {
      hasConsensus: false,
      confidence: 0,
      reason: "检测失败",
      recommendAction: "continue",
      keyPoints: [],
      suggestions: []
    }
  }

  return (
    <MainContainer>
      {/* DISCUSSION标题 - 左上角 */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 p-2.5 sm:p-3 bg-white rounded-md shadow-lg border border-slate-200 z-40">
        <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-wide">
          DISCUSSION
        </h1>
      </div>

      {/* GitHub链接 - 右上角 */}
      <a
        href="https://github.com/ct-jyjntc/ai-discussion"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 p-2.5 sm:p-3 bg-white rounded-md shadow-lg border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-200 z-40"
        title="查看GitHub源码"
      >
        <Github className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
      </a>

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
                "text-sm sm:text-base resize-none rounded-md shadow-lg",
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
            <div className="absolute bottom-3 right-2 flex items-center gap-1">
              {/* 重新开始按钮 */}
              {conversation.messages.length > 0 && (
                <button
                  onClick={resetConversation}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors duration-200"
                  title="重新开始"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              
              {/* 发送按钮 */}
              <button
                onClick={startConversation}
                disabled={!question.trim() || conversation.isProcessing}
                className="p-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors duration-200"
                title="发送"
              >
                {conversation.isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainContainer>
  )
}