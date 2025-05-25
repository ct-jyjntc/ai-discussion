"use client"

import { forwardRef, ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { ComponentVariants, AccessibilityConfig } from "@/lib/design-system"
import { Loader2 } from "lucide-react"

interface EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof ComponentVariants.button
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md',
    loading = false,
    disabled,
    fullWidth = false,
    leftIcon,
    rightIcon,
    children, 
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        className={cn(
          // 基础样式
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200',
          // 可访问性
          AccessibilityConfig.focusRing,
          AccessibilityConfig.minTouchTarget,
          // 变体样式
          ComponentVariants.button[variant],
          // 尺寸样式
          sizeClasses[size],
          // 状态样式
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && leftIcon && leftIcon}
        {children}
        {!loading && rightIcon && rightIcon}
      </button>
    )
  }
)

EnhancedButton.displayName = "EnhancedButton"