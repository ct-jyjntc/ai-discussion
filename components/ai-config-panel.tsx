"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, CheckCircle, Sparkles, TestTube, Loader2, Settings } from "lucide-react"
import { testAPI } from "@/actions/ai-conversation-v2"

interface AIConfigInfo {
  name: string
  model: string
  personality: string[]
  role: string
  icon: React.ReactNode
  color: string
}

const AI_CONFIGS: AIConfigInfo[] = [
  {
    name: "AI助手A",
    model: "gemini-2.5-flash-preview-05-20",
    personality: ["分析性", "逻辑性", "系统性"],
    role: "负责问题分析和逻辑推理",
    icon: <Brain className="h-4 w-4" />,
    color: "text-blue-600"
  },
  {
    name: "AI助手B", 
    model: "gemini-2.5-flash-preview-05-20",
    personality: ["创造性", "批判性", "质疑性"],
    role: "负责观点评估和反思质疑",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600"
  },
  {
    name: "共识生成器",
    model: "gemini-2.5-flash-preview-05-20", 
    personality: ["客观性", "平衡性", "综合性"],
    role: "负责整合观点生成最终答案",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-purple-600"
  }
]

export function AIConfigPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'testing' | 'success' | 'error', message?: string }>>({})

  const testAIConnection = async (aiName: string) => {
    setTestResults(prev => ({ ...prev, [aiName]: { status: 'testing' } }))
    
    try {
      const result = await testAPI()
      if (result.success) {
        setTestResults(prev => ({ 
          ...prev, 
          [aiName]: { 
            status: 'success', 
            message: result.data 
          } 
        }))
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          [aiName]: { 
            status: 'error', 
            message: result.error 
          } 
        }))
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        [aiName]: { 
          status: 'error', 
          message: error.message 
        } 
      }))
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-2.5 sm:p-3 bg-white rounded-md shadow-lg border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-200 z-40"
      >
        <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto border-slate-200 shadow-xl">
        <CardHeader className="border-b border-slate-100 p-4 sm:p-6">
          <CardTitle className="flex items-center justify-between">
            <span className="text-base sm:text-lg text-slate-900">AI配置信息</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-lg transition-colors p-1"
            >
              ✕
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {AI_CONFIGS.map((config) => (
            <div key={config.name} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-slate-600">
                    {config.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900">{config.name}</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testAIConnection(config.name)}
                  disabled={testResults[config.name]?.status === 'testing'}
                  className="border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  {testResults[config.name]?.status === 'testing' ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <TestTube className="h-3 w-3 mr-1" />
                  )}
                  测试
                </Button>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500">模型:</span>
                  <span className="ml-2 font-mono text-xs bg-white px-2 py-1 rounded border border-slate-200">
                    {config.model}
                  </span>
                </div>
                
                <div>
                  <span className="text-slate-500">特性:</span>
                  <div className="flex gap-1 mt-1">
                    {config.personality.map((trait) => (
                      <Badge key={trait} variant="secondary" className="text-xs bg-slate-200 text-slate-700">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="text-slate-500">角色:</span>
                  <span className="ml-2 text-slate-700">{config.role}</span>
                </div>

                {testResults[config.name] && (
                  <div className="mt-3 p-3 rounded-lg text-xs">
                    {testResults[config.name].status === 'success' && (
                      <div className="text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                        ✅ 连接成功: {testResults[config.name].message}
                      </div>
                    )}
                    {testResults[config.name].status === 'error' && (
                      <div className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                        ❌ 连接失败: {testResults[config.name].message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">配置说明</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 所有AI当前使用相同的API端点，但具有不同的个性特征</p>
              <p>• 可以在 .env.local 文件中为每个AI配置不同的API</p>
              <p>• 支持OpenAI、Anthropic等兼容API</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}