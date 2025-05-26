import React from 'react'
import { cn } from '@/lib/utils'
import type { ConsensusResult } from '@/actions/consensus-detection'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  BarChart3,
  Target,
  FileCheck
} from 'lucide-react'

interface ConsensusInsightsProps {
  consensusResult: ConsensusResult
  className?: string
}

export function ConsensusInsights({ consensusResult, className }: ConsensusInsightsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-50 border-green-200'
    if (score >= 50) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getCoverageIcon = (coverage: string) => {
    switch (coverage) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'minimal':
        return <XCircle className="w-4 h-4 text-orange-600" />
      case 'off-topic':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const getCoverageLabel = (coverage: string) => {
    const labels = {
      'complete': '完整覆盖',
      'partial': '部分覆盖',
      'minimal': '最低覆盖',
      'off-topic': '偏离主题'
    }
    return labels[coverage as keyof typeof labels] || coverage
  }

  const getCompletenessIcon = (completeness: string) => {
    switch (completeness) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'incomplete':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'unclear':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const getCompletenessLabel = (completeness: string) => {
    const labels = {
      'complete': '完整解决',
      'incomplete': '部分解决',
      'unclear': '解决不明确'
    }
    return labels[completeness as keyof typeof labels] || completeness
  }

  const questionMatchScore = consensusResult.questionMatchScore || 0
  const questionCoverage = consensusResult.questionCoverage || 'partial'
  const solutionCompleteness = consensusResult.solutionCompleteness || 'incomplete'
  const unaddressedAspects = consensusResult.unaddressedAspects || []

  return (
    <div className={cn("space-y-4", className)}>
      {/* 问题解答质量总览 */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-slate-600" />
          <h4 className="font-medium text-slate-800">问题解答质量评估</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 问题匹配度分数 */}
          <div className={cn(
            "p-3 rounded-lg border",
            getScoreBgColor(questionMatchScore)
          )}>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium text-slate-700">匹配度分数</span>
            </div>
            <div className={cn("text-xl font-bold", getScoreColor(questionMatchScore))}>
              {questionMatchScore}/100
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {questionMatchScore >= 70 ? '优秀' : questionMatchScore >= 50 ? '良好' : '需改进'}
            </div>
          </div>

          {/* 问题覆盖程度 */}
          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium text-slate-700">覆盖程度</span>
            </div>
            <div className="flex items-center gap-2">
              {getCoverageIcon(questionCoverage)}
              <span className="text-sm font-medium text-slate-800">
                {getCoverageLabel(questionCoverage)}
              </span>
            </div>
          </div>

          {/* 解决方案完整性 */}
          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="w-4 h-4" />
              <span className="text-sm font-medium text-slate-700">解决完整性</span>
            </div>
            <div className="flex items-center gap-2">
              {getCompletenessIcon(solutionCompleteness)}
              <span className="text-sm font-medium text-slate-800">
                {getCompletenessLabel(solutionCompleteness)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 未解决的方面 */}
      {unaddressedAspects.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">需要进一步讨论的方面</h4>
          </div>
          <ul className="space-y-1">
            {unaddressedAspects.map((aspect, index) => (
              <li key={index} className="text-sm text-yellow-700 flex items-start gap-1">
                <span className="text-yellow-500 mt-1">•</span>
                {aspect}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 共识状态说明 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-blue-800">共识分析</h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">
              <strong>状态:</strong> {consensusResult.hasConsensus ? '已达成共识' : '需要继续讨论'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">
              <strong>置信度:</strong> {consensusResult.confidence}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">
              <strong>推荐行动:</strong> {
                consensusResult.recommendAction === 'consensus' ? '生成共识答案' :
                consensusResult.recommendAction === 'continue' ? '继续讨论' :
                '扩展讨论'
              }
            </span>
          </div>
        </div>
      </div>

      {/* 详细原因 */}
      {consensusResult.reason && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="font-medium text-slate-800 mb-2">分析详情</h4>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {consensusResult.reason}
          </p>
        </div>
      )}
    </div>
  )
}
