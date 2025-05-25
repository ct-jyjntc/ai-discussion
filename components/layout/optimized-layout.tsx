"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ResponsiveConfig, AccessibilityConfig } from "@/lib/design-system"

interface OptimizedLayoutProps {
  children: ReactNode
  className?: string
}

// 主容器组件
export function MainContainer({ children, className }: OptimizedLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-slate-50/50",
        // 支持深色模式
        "dark:bg-slate-900",
        className
      )}
    >
      {children}
    </div>
  )
}

// 内容容器
export function ContentContainer({ children, className }: OptimizedLayoutProps) {
  return (
    <div 
      className={cn(
        "max-w-4xl mx-auto",
        ResponsiveConfig.spacing.component,
        className
      )}
    >
      {children}
    </div>
  )
}

// 粘性头部
interface StickyHeaderProps extends OptimizedLayoutProps {
  blur?: boolean
  border?: boolean
}

export function StickyHeader({ 
  children, 
  className, 
  blur = true, 
  border = true 
}: StickyHeaderProps) {
  return (
    <header 
      className={cn(
        "sticky top-0 z-40",
        "bg-white/95",
        blur && "backdrop-blur-md",
        border && "border-b border-slate-200/60",
        "transition-all duration-200",
        // 深色模式
        "dark:bg-slate-900/95 dark:border-slate-700/60",
        className
      )}
    >
      <ContentContainer>
        {children}
      </ContentContainer>
    </header>
  )
}

// 主内容区域
export function MainContent({ children, className }: OptimizedLayoutProps) {
  return (
    <main
      id="main-content"
      className={cn(
        "flex-1",
        ResponsiveConfig.spacing.section,
        className
      )}
      // 无障碍访问
      role="main"
      aria-label="主要内容"
    >
      <ContentContainer>
        {children}
      </ContentContainer>
    </main>
  )
}

// 粘性底部
export function StickyFooter({ 
  children, 
  className, 
  blur = true, 
  border = true 
}: StickyHeaderProps) {
  return (
    <footer 
      className={cn(
        "sticky bottom-0 z-40",
        "bg-white/95",
        blur && "backdrop-blur-md",
        border && "border-t border-slate-200/60",
        "transition-all duration-200",
        // 深色模式
        "dark:bg-slate-900/95 dark:border-slate-700/60",
        className
      )}
    >
      <ContentContainer>
        {children}
      </ContentContainer>
    </footer>
  )
}

// 空状态组件
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center",
        ResponsiveConfig.spacing.section,
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-md flex items-center justify-center mb-6 dark:bg-slate-800">
          {icon}
        </div>
      )}
      
      <h2 className={cn(
        "font-semibold text-slate-900 mb-2",
        ResponsiveConfig.text.heading,
        "dark:text-slate-100"
      )}>
        {title}
      </h2>
      
      {description && (
        <p className={cn(
          "text-slate-600 mb-6 max-w-md px-4",
          ResponsiveConfig.text.body,
          "dark:text-slate-400"
        )}>
          {description}
        </p>
      )}
      
      {action}
    </div>
  )
}

// 加载状态组件
interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = "加载中...", className }: LoadingStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center",
        ResponsiveConfig.spacing.section,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
        <span className="text-slate-600 dark:text-slate-400">{message}</span>
      </div>
    </div>
  )
}

// 错误状态组件
interface ErrorStateProps {
  title?: string
  message: string
  retry?: () => void
  className?: string
}

export function ErrorState({ 
  title = "出现错误", 
  message, 
  retry, 
  className 
}: ErrorStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center",
        ResponsiveConfig.spacing.section,
        className
      )}
      role="alert"
    >
      <div className="w-14 h-14 bg-red-100 rounded-md flex items-center justify-center mb-4 dark:bg-red-900/20">
        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h2 className="text-lg font-semibold text-slate-900 mb-2 dark:text-slate-100">
        {title}
      </h2>
      
      <p className="text-slate-600 mb-6 max-w-md dark:text-slate-400">
        {message}
      </p>
      
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors duration-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          重试
        </button>
      )}
    </div>
  )
}

// 响应式网格容器
interface ResponsiveGridProps extends OptimizedLayoutProps {
  cols?: {
    default?: 1 | 2 | 3 | 4 | 5 | 6
    sm?: 1 | 2 | 3 | 4 | 5 | 6
    md?: 1 | 2 | 3 | 4 | 5 | 6
    lg?: 1 | 2 | 3 | 4 | 5 | 6
    xl?: 1 | 2 | 3 | 4 | 5 | 6
  }
  gap?: 'sm' | 'md' | 'lg'
}

const gridCols: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
}

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
}

export function ResponsiveGrid({ 
  children, 
  className, 
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 'md'
}: ResponsiveGridProps) {
  return (
    <div 
      className={cn(
        "grid",
        cols.default && gridCols[cols.default],
        cols.sm && `sm:${gridCols[cols.sm]}`,
        cols.md && `md:${gridCols[cols.md]}`,
        cols.lg && `lg:${gridCols[cols.lg]}`,
        cols.xl && `xl:${gridCols[cols.xl]}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}