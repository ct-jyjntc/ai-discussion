import type { Message } from "@/types/conversation"
import { Brain, CheckCircle, User, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MessageCardProps {
  message: Message
}

export function MessageCardSimple({ message }: MessageCardProps) {
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
        return "bg-blue-50 border-l-2 border-blue-400"
      case "ai_b":
        return "bg-green-50 border-l-2 border-green-400"
      case "user":
        return "bg-gray-50 border-l-2 border-gray-400"
      case "consensus":
        return "bg-purple-50 border-l-2 border-purple-400"
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
        return "共识答案"
    }
  }

  const getBadgeColor = () => {
    switch (message.role) {
      case "ai_a":
        return "text-blue-600"
      case "ai_b":
        return "text-green-600"
      case "user":
        return "text-gray-600"
      case "consensus":
        return "text-purple-600"
    }
  }

  return (
    <div className={`${getColor()} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-medium text-gray-700">{getTitle()}</span>
        </div>
        <div className={`text-xs ${getBadgeColor()}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
      
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
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}