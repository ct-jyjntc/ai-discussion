import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DISCUSSION',
  description: 'AI协作对话讨论系统',
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
