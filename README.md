# 🤖 AI 协作对话系统

> 一个创新的多AI协作问答平台，通过两个AI助手进行深度讨论，最终达成共识答案

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ 特性概览

- 🧠 **双AI协作** - 两个不同性格的AI助手深度讨论
- 📡 **实时流式** - 流式传输提供即时对话体验
- 🎯 **共识生成** - 多轮讨论后自动生成综合答案
- 🎨 **现代UI** - 响应式设计，优雅的用户界面
- 🔒 **安全可靠** - 完善的环境变量验证机制

## 🛠 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 15+ | React全栈框架 |
| TypeScript | 5.0+ | 类型安全开发 |
| Tailwind CSS | 3.4+ | 样式框架 |
| Radix UI | Latest | 组件库 |
| Lucide React | Latest | 图标库 |

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 2. 环境配置

```bash
# 复制环境变量模板
cp .env.local.example .env.local
```

### 3. 配置 API 密钥

在 `.env.local` 文件中配置以下必需的环境变量：

```env
# AI助手A配置
AI_A_API_URL=your_api_url_here
AI_A_API_KEY=your_api_key_here
AI_A_MODEL=your_model_name_here
AI_A_NAME=AI助手A
AI_A_PERSONALITY=analytical,logical,methodical

# AI助手B配置
AI_B_API_URL=your_api_url_here
AI_B_API_KEY=your_api_key_here
AI_B_MODEL=your_model_name_here
AI_B_NAME=AI助手B
AI_B_PERSONALITY=creative,critical,questioning

# 共识生成AI配置
CONSENSUS_API_URL=your_api_url_here
CONSENSUS_API_KEY=your_api_key_here
CONSENSUS_MODEL=your_model_name_here
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🔧 API 提供商配置

### OpenAI API

```env
AI_A_API_URL=https://api.openai.com/v1/chat/completions
AI_A_API_KEY=sk-your-openai-key
AI_A_MODEL=gpt-4
```

### Anthropic Claude API

```env
AI_B_API_URL=https://api.anthropic.com/v1/messages
AI_B_API_KEY=sk-ant-your-anthropic-key
AI_B_MODEL=claude-3-sonnet-20240229
```

### 自定义 API（OpenAI 兼容）

```env
AI_A_API_URL=http://your-server:port/v1/chat/completions
AI_A_API_KEY=your-custom-api-key
AI_A_MODEL=your-custom-model
```

## 📋 可用命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查（如果可用）
```

## 🎯 功能特点

### 🤖 AI 协作流程

1. **AI助手A** - 分析型思维，逻辑性强，方法论导向
2. **AI助手B** - 创造型思维，批判性强，善于质疑
3. **多轮讨论** - 最多4轮深度讨论
4. **共识生成** - 综合双方观点生成最终答案

### 🎨 用户体验

- ✅ 实时流式对话显示
- ✅ 智能折叠历史消息
- ✅ 悬浮输入框设计
- ✅ 随机问题推荐
- ✅ 完全响应式布局

### 🔒 安全特性

- ✅ 环境变量强制验证
- ✅ 无硬编码敏感信息
- ✅ 启动时配置检查
- ✅ API错误处理机制

## 📖 使用指南

1. **选择问题** - 点击推荐问题或输入自定义问题
2. **开始讨论** - AI助手们自动开始协作讨论
3. **观看过程** - 实时查看双AI讨论过程
4. **获得答案** - 最终获得经过深度讨论的共识答案

## 📁 项目结构

```text
├── app/                              # Next.js 应用目录
│   ├── layout.tsx                   # 根布局组件
│   ├── page.tsx                     # 主页面
│   └── globals.css                  # 全局样式
├── components/                       # React 组件
│   ├── conversation-flow-clean.tsx  # 主对话组件
│   ├── ai-config-panel.tsx         # AI配置面板
│   ├── ui/                          # UI组件库
│   └── layout/                      # 布局组件
├── lib/                             # 核心工具库
│   ├── env-validation.ts           # 环境变量验证
│   ├── startup-validation.ts       # 启动时验证
│   ├── ai-config.ts                # AI配置管理
│   └── utils.ts                     # 通用工具
├── actions/                         # Server Actions
│   ├── ai-conversation-v2.ts       # AI对话处理
│   └── streaming-actions.ts        # 流式响应
├── types/                           # TypeScript 类型定义
│   └── conversation.ts             # 对话相关类型
├── hooks/                           # React Hooks
├── styles/                          # 样式文件
└── .env.local.example              # 环境变量模板
```

## ⚠️ 故障排除

### 应用无法启动？

检查以下事项：

1. ✅ `.env.local` 文件是否存在
2. ✅ 所有环境变量是否都已配置
3. ✅ API URL和API Key是否正确
4. ✅ 尝试重启开发服务器

### API 连接失败？

1. ✅ 检查API URL格式是否正确
2. ✅ 验证API Key是否有效
3. ✅ 确认网络连接正常
4. ✅ 查看浏览器控制台错误信息

### 常见错误信息

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `Environment variables not configured` | 环境变量未配置 | 检查 `.env.local` 文件 |
| `API Key invalid` | API密钥无效 | 重新生成API密钥 |
| `Network error` | 网络连接问题 | 检查网络连接和防火墙设置 |

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 规则
- 保持代码简洁和可读性
- 添加适当的注释和文档

## 🗺️ 开发路线图

- [ ] 支持更多AI提供商
- [ ] 添加对话历史保存
- [ ] 实现用户认证系统
- [ ] 支持多语言界面
- [ ] 移动端优化

## 🔧 开发须知

- 本项目使用严格的环境变量验证
- 所有API配置必须来自环境变量
- 不允许硬编码敏感信息
- 支持多种AI API提供商

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - React框架
- [Radix UI](https://www.radix-ui.com/) - 组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Lucide](https://lucide.dev/) - 图标库

---

如果这个项目对您有帮助，请考虑给它一个 ⭐

有问题或建议？欢迎创建 Issue 进行讨论