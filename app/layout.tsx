import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI双向对话协作系统',
  description: '观看两个AI助手深度讨论，直到达成共识',
  keywords: 'AI对话,人工智能,协作讨论,问答系统',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}
