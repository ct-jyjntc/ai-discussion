"use client"

import { useState, useEffect } from "react"
import type { Message } from "@/types/conversation"
import { Brain, CheckCircle, User, Sparkles, ChevronDown, ChevronRight } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface CollapsibleMessageCardProps {
  message: Message
  isActive?: boolean // 当前正在进行的步骤
  isStreaming?: boolean // 是否正在流式传输
  streamingContent?: string // 流式传输的内容
  onToggle?: () => void
  defaultCollapsed?: boolean
}

export function CollapsibleMessageCard({ 
  message, 
  isActive = false, 
  isStreaming = false,
  streamingContent = "",
  onToggle,
  defaultCollapsed = false 
}: CollapsibleMessageCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  // 如果是当前活跃步骤，自动展开
  useEffect(() => {
    if (isActive) {
      setIsCollapsed(false)
    }
  }, [isActive])

  // 如果不是最终结果，步骤完成后自动折叠
  useEffect(() => {
    if (!isActive && !isStreaming && message.role !== 'consensus' && message.role !== 'user') {
      const timer = setTimeout(() => {
        setIsCollapsed(true)
      }, 3000) // 3秒后自动折叠
      return () => clearTimeout(timer)
    }
  }, [isActive, isStreaming, message.role])

  const getIcon = () => {
    switch (message.role) {
      case "ai_a":
        return <Brain className="h-4 w-4" />
      case "ai_b":
        return <CheckCircle className="h-4 w-4" />
      case "user":
        return <User className="h-4 w-4" />
      case "consensus":
        return <Sparkles className="h-4 w-4" />
    }
  }

  const getColor = () => {
    switch (message.role) {
      case "ai_a":
        return "bg-gray-50 border-l-2 border-gray-300"
      case "ai_b":
        return "bg-white border-l-2 border-gray-400"
      case "user":
        return "bg-gray-100 border-l-2 border-gray-500"
      case "consensus":
        return "bg-gray-900 text-white border-l-2 border-gray-700"
    }
  }

  const getTitle = () => {
    switch (message.role) {
      case "ai_a":
        return `AI助手A ${message.round ? `(第${message.round}轮)` : ""}`
      case "ai_b":
        return `AI助手B ${message.round ? `(第${message.round}轮)` : ""}`
      case "user":
        return "用户问题"
      case "consensus":
        return "🎯 共识答案"
    }
  }

  const getBadgeColor = () => {
    switch (message.role) {
      case "ai_a":
        return "text-gray-600"
      case "ai_b":
        return "text-gray-700"
      case "user":
        return "text-gray-500"
      case "consensus":
        return "text-gray-300"
    }
  }

  const canCollapse = message.role !== 'consensus' && message.role !== 'user'
  const displayContent = isStreaming ? streamingContent : message.content

  const handleToggle = () => {
    if (canCollapse) {
      setIsCollapsed(!isCollapsed)
      onToggle?.()
    }
  }

  return (
    <div className={`${getColor()} rounded-lg transition-all duration-300 ${isActive ? 'ring-1 ring-gray-400 shadow-sm' : ''}`}>
      {/* 标题栏 - 始终显示 */}
      <div 
        className={`flex items-center justify-between p-4 ${canCollapse ? 'cursor-pointer hover:bg-black/5' : ''}`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          {canCollapse && (
            <div className="transition-transform duration-200">
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          )}
          {getIcon()}
          <span className="text-sm font-medium text-gray-700">{getTitle()}</span>
          {isStreaming && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600">思考中...</span>
            </div>
          )}
        </div>
        <div className={`text-xs ${getBadgeColor()}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* 内容区域 - 可折叠 */}
      {(!isCollapsed || !canCollapse) && (
        <div className="px-4 pb-4">
          <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                    {children}
                  </td>
                ),
                code: ({ children, className }) => {
                  const isInline = !className || !className.includes('language-')
                  return isInline ? (
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto">
                      <code className="text-xs font-mono">{children}</code>
                    </pre>
                  )
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-blue-400 pl-3 py-1 bg-blue-50 dark:bg-blue-900/20 italic text-sm">
                    {children}
                  </blockquote>
                ),
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-0.5 ml-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-0.5 ml-2">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm">{children}</li>
                ),
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
                ),
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>

          {/* 流式传输光标 */}
          {isStreaming && (
            <div className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1"></div>
          )}
        </div>
      )}
    </div>
  )
}