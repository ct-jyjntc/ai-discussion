"use client"

import { forwardRef, TextareaHTMLAttributes, useState } from "react"
import { cn } from "@/lib/utils"
import { ComponentVariants, AccessibilityConfig } from "@/lib/design-system"

interface EnhancedTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  showCharCount?: boolean
  maxLength?: number
  variant?: keyof typeof ComponentVariants.input
}

export const EnhancedTextarea = forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  ({ 
    className,
    label,
    error,
    helperText,
    showCharCount = false,
    maxLength,
    variant = 'default',
    value,
    onChange,
    ...props 
  }, ref) => {
    const [charCount, setCharCount] = useState(
      typeof value === 'string' ? value.length : 0
    )

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      onChange?.(e)
    }

    const inputVariant = error ? 'error' : variant

    return (
      <div className="space-y-2">
        {/* 标签 */}
        {label && (
          <label 
            htmlFor={props.id}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* 输入区域容器 */}
        <div className="relative">
          <textarea
            className={cn(
              // 基础样式
              'w-full rounded-md px-3 py-3 text-sm transition-all duration-200',
              'placeholder:text-slate-400 resize-none',
              // 可访问性
              AccessibilityConfig.focusRing,
              // 变体样式
              ComponentVariants.input[inputVariant],
              // 错误状态
              error && 'border-red-300 focus:border-red-400 focus:ring-red-200',
              // 字符计数器的右边距
              showCharCount && 'pr-16',
              className
            )}
            ref={ref}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            aria-describedby={
              error ? `${props.id}-error` : 
              helperText ? `${props.id}-helper` : undefined
            }
            aria-invalid={!!error}
            {...props}
          />

          {/* 字符计数器 */}
          {showCharCount && (
            <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white px-1 rounded">
              {charCount}{maxLength && `/${maxLength}`}
            </div>
          )}
        </div>

        {/* 帮助文本或错误信息 */}
        {error && (
          <p 
            id={`${props.id}-error`}
            className="text-sm text-red-600 flex items-center gap-1"
            role="alert"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p 
            id={`${props.id}-helper`}
            className="text-sm text-slate-500"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

EnhancedTextarea.displayName = "EnhancedTextarea"