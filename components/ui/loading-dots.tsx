"use client"

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
    </div>
  )
}