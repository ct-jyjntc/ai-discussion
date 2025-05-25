"use client"

import { forwardRef, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { ComponentVariants } from "@/lib/design-system"

interface EnhancedCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof ComponentVariants.card
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ 
    className,
    variant = 'default',
    padding = 'md',
    hover = false,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        className={cn(
          // 基础样式
          'rounded-md transition-all duration-200',
          // 变体样式
          ComponentVariants.card[variant],
          // 内边距
          paddingClasses[padding],
          // 悬停效果
          hover && 'hover:shadow-md hover:border-slate-300 cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

EnhancedCard.displayName = "EnhancedCard"

// 卡片标题组件
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "border-b border-slate-100 pb-4 mb-6 last:mb-0 last:pb-0 last:border-0",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardHeader.displayName = "CardHeader"

// 卡片标题
export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        className={cn(
          "text-lg font-semibold text-slate-900 leading-none tracking-tight",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </h3>
    )
  }
)

CardTitle.displayName = "CardTitle"

// 卡片描述
export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        className={cn("text-sm text-slate-600 mt-1", className)}
        ref={ref}
        {...props}
      >
        {children}
      </p>
    )
  }
)

CardDescription.displayName = "CardDescription"

// 卡片内容
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn("", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardContent.displayName = "CardContent"

// 卡片底部
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "border-t border-slate-100 pt-4 mt-6 first:mt-0 first:pt-0 first:border-0",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = "CardFooter"