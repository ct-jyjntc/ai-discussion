// 设计系统 - 统一的设计语言
export const DesignSystem = {
  // 颜色系统
  colors: {
    // 主色调 - 基于slate的现代色彩
    primary: {
      50: 'rgb(248 250 252)',  // slate-50
      100: 'rgb(241 245 249)', // slate-100  
      200: 'rgb(226 232 240)', // slate-200
      300: 'rgb(203 213 225)', // slate-300
      400: 'rgb(148 163 184)', // slate-400
      500: 'rgb(100 116 139)', // slate-500
      600: 'rgb(71 85 105)',   // slate-600
      700: 'rgb(51 65 85)',    // slate-700
      800: 'rgb(30 41 59)',    // slate-800
      900: 'rgb(15 23 42)',    // slate-900
    },
    // 功能色彩
    semantic: {
      success: 'rgb(34 197 94)',   // green-500
      warning: 'rgb(245 158 11)',  // amber-500
      error: 'rgb(239 68 68)',     // red-500
      info: 'rgb(59 130 246)',     // blue-500
    },
    // 背景色彩
    background: {
      primary: 'rgb(255 255 255)',    // white
      secondary: 'rgb(248 250 252)',  // slate-50
      tertiary: 'rgb(241 245 249)',   // slate-100
      overlay: 'rgba(15 23 42 / 0.1)', // slate-900/10
    }
  },

  // 间距系统
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.5rem',   // 24px
    '2xl': '2rem',  // 32px
    '3xl': '3rem',  // 48px
  },

  // 圆角系统
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '6px',      // 主要使用
    lg: '8px',
    full: '9999px',
  },

  // 阴影系统
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // 字体系统
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Consolas", monospace',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],     // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],    // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],   // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  },

  // 过渡动画
  transitions: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
    elastic: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Z-index层级
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },

  // 断点系统
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
} as const

// 组件变体系统
export const ComponentVariants = {
  button: {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-2 focus:ring-slate-300',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-2 focus:ring-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-2 focus:ring-slate-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-300',
  },
  
  card: {
    default: 'bg-white border border-slate-200 shadow-sm',
    elevated: 'bg-white border border-slate-200 shadow-md',
    interactive: 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300',
  },

  input: {
    default: 'border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
    error: 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200',
    success: 'border-green-300 focus:border-green-400 focus:ring-2 focus:ring-green-200',
  },

  text: {
    primary: 'text-slate-900',
    secondary: 'text-slate-600',
    tertiary: 'text-slate-400',
    inverse: 'text-white',
    success: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
  }
} as const

// 可访问性配置
export const AccessibilityConfig = {
  // 焦点环配置
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-offset-2',
  
  // 屏幕阅读器文本
  srOnly: 'sr-only',
  
  // 跳转链接
  skipLink: 'absolute -top-40 left-6 z-50 bg-slate-900 text-white px-4 py-2 rounded-md focus:top-6',
  
  // 最小触摸目标
  minTouchTarget: 'min-h-[44px] min-w-[44px]',
  
  // 对比度确保
  contrastText: {
    onLight: 'text-slate-900',
    onDark: 'text-white',
    onPrimary: 'text-white',
  }
} as const

// 响应式设计配置
export const ResponsiveConfig = {
  // 容器最大宽度
  container: {
    sm: 'max-w-sm',   // 640px
    md: 'max-w-2xl',  // 768px
    lg: 'max-w-4xl',  // 1024px
    xl: 'max-w-6xl',  // 1280px
  },
  
  // 间距响应式
  spacing: {
    section: 'py-8 sm:py-12 lg:py-16',
    component: 'px-4 sm:px-6 lg:px-8',
  },
  
  // 文字响应式
  text: {
    hero: 'text-2xl sm:text-3xl lg:text-4xl',
    heading: 'text-lg sm:text-xl lg:text-2xl',
    body: 'text-sm sm:text-base',
  }
} as const

// 性能优化配置
export const PerformanceConfig = {
  // 懒加载阈值
  lazyLoadThreshold: '50px',
  
  // 防抖延迟
  debounceDelay: 300,
  
  // 虚拟滚动
  virtualScrollItemHeight: 100,
  virtualScrollBuffer: 5,
  
  // 图片优化
  imageOptimization: {
    quality: 85,
    formats: ['webp', 'jpg'],
    sizes: '(max-width: 768px) 100vw, 50vw',
  }
} as const