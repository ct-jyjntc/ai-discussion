"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCard } from "./message-card"
import type { ConversationState, Message } from "@/types/conversation"
import {
  analyzeQuestion,
  aiDiscussion,
  continueDiscussion,
  generateConsensusAnswer,
  testAPI,
} from "@/actions/ai-conversation"
import { Loader2, Send, TestTube, AlertCircle, Sparkles, Brain } from "lucide-react"

export function ConversationFlow() {
  const [question, setQuestion] = useState("")
  const [conversation, setConversation] = useState<ConversationState>({
    messages: [],
    currentRound: 0,
    isComplete: false,
    isProcessing: false,
    originalQuestion: "",
  })
  const [apiTestResult, setApiTestResult] = useState<string>("")
  const [isTestingAPI, setIsTestingAPI] = useState(false)

  const addMessage = (role: Message["role"], content: string, round?: number) => {
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

  const testAPIConnection = async () => {
    setIsTestingAPI(true)
    setApiTestResult("Testing API connection...")

    try {
      const result = await testAPI()
      if (result.success) {
        setApiTestResult(`✅ API connection successful! Response: ${result.data}`)
      } else {
        setApiTestResult(`❌ API test failed: ${result.error}`)
      }
    } catch (error: any) {
      setApiTestResult(`❌ API test error: ${error.message}`)
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

    // Add user question
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
      let aiAResponse: string
      if (round === 1) {
        console.log("AI助手A开始分析...")
        aiAResponse = await analyzeQuestion(originalQuestion, round)
      } else {
        console.log("AI助手A继续讨论...")
        aiAResponse = await continueDiscussion(originalQuestion, fullDiscussion, round, true)
      }

      console.log("AI助手A回复:", aiAResponse.slice(0, 100) + "...")
      addMessage("ai_a", aiAResponse, round)
      
      // 更新讨论历史
      const newDiscussion = fullDiscussion + `\n\n【AI助手A - 第${round}轮】：\n${aiAResponse}`

      // 延迟以改善用户体验
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // AI助手B回应
      console.log("AI助手B回应...")
      const aiBResponse = await aiDiscussion(originalQuestion, aiAResponse, round, newDiscussion)
      console.log("AI助手B回复:", aiBResponse.slice(0, 100) + "...")
      addMessage("ai_b", aiBResponse, round)

      // 更新完整讨论历史
      const completeDiscussion = newDiscussion + `\n\n【AI助手B - 第${round}轮】：\n${aiBResponse}`

      // 检查是否达成共识或达到最大轮数
      const hasConsensus = aiBResponse.includes("我们达成共识") || aiBResponse.includes("达成共识") ||
                          aiBResponse.includes("我同意") || aiBResponse.includes("我认同")
      
      if (hasConsensus || round >= 4) {
        // 生成共识答案
        console.log("生成共识答案...")
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const consensusAnswer = await generateConsensusAnswer(originalQuestion, completeDiscussion)
        console.log("共识答案:", consensusAnswer.slice(0, 100) + "...")
        addMessage("consensus", consensusAnswer)

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

        await new Promise((resolve) => setTimeout(resolve, 2000))
        await processRound(originalQuestion, round + 1, completeDiscussion)
      }
    } catch (error: any) {
      console.error("Error in round processing:", error)

      addMessage(
        "consensus",
        `在处理您的问题时遇到错误: ${error.message}。请使用"测试API"按钮检查连接后重试。`,
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
    setQuestion("")
    setApiTestResult("")
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">AI双向对话协作系统</CardTitle>
          <p className="text-center text-muted-foreground">
            观看两个AI助手互相讨论，直到达成共识来回答您的问题
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md text-sm">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span>提示：建议先测试API连接，确保系统正常工作。</span>
          </div>

          <Textarea
            placeholder="请在这里输入您的问题..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={conversation.isProcessing}
            className="min-h-[100px]"
          />

          <div className="flex gap-2">
            <Button
              onClick={startConversation}
              disabled={!question.trim() || conversation.isProcessing}
              className="flex-1"
            >
              {conversation.isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  对话进行中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Start AI Collaboration
                </>
              )}
            </Button>

            <Button variant="outline" onClick={testAPIConnection} disabled={isTestingAPI}>
              {isTestingAPI ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
              测试API
            </Button>

            {conversation.messages.length > 0 && (
              <Button variant="outline" onClick={resetConversation}>
                重置
              </Button>
            )}
          </div>

          {apiTestResult && (
            <div className="p-3 bg-gray-50 rounded-md text-sm border">
              <strong>API测试结果：</strong>
              <div className="mt-1 whitespace-pre-wrap">{apiTestResult}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {conversation.messages.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border-2">
              <h2 className="text-xl font-bold text-gray-800">💬 AI对话流程</h2>
              {conversation.isProcessing && (
                <div className="flex items-center text-sm text-blue-600 font-medium">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  第{conversation.currentRound}轮对话进行中...
                </div>
              )}
              {conversation.isComplete && (
                <div className="flex items-center text-sm text-green-600 font-medium">
                  <Sparkles className="h-4 w-4 mr-1" />
                  协作完成
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            {conversation.messages.map((message, index) => (
              <div key={message.id} className="relative">
                {index > 0 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
                <MessageCard message={message} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
