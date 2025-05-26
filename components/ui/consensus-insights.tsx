import React from 'react'
import { cn } from '@/lib/utils'
import type { ConsensusResult } from '@/actions/consensus-detection'
import { 
  AlertTriangle
} from 'lucide-react'

interface ConsensusInsightsProps {
  consensusResult: ConsensusResult
  className?: string
}

export function ConsensusInsights({ consensusResult, className }: ConsensusInsightsProps) {
  const unaddressedAspects = consensusResult.unaddressedAspects || []

  // 如果没有未解决的方面，不显示任何内容
  if (unaddressedAspects.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 未解决的方面 */}
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
    </div>
  )
}
