# DISCUSSION - AI协作对话系统

这是一个创新的多AI协作问答系统，使用两个AI助手进行深度讨论，直到达成共识答案。

## 技术栈

- **Next.js 15** - React全栈框架
- **TypeScript** - 类型安全开发
- **Tailwind CSS** - 样式框架
- **Radix UI** - 组件库
- **流式传输** - 实时对话体验

## ⚠️ 环境配置（必须）

**重要：应用启动前必须正确配置环境变量，否则无法运行！**

### 1. 创建环境配置文件

```bash
# 复制模板文件
cp .env.local.example .env.local
```

### 2. 配置必需的环境变量

在 `.env.local` 文件中配置以下变量：

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

### 3. API提供商示例

#### OpenAI API
```env
AI_A_API_URL=https://api.openai.com/v1/chat/completions
AI_A_API_KEY=sk-your-openai-key
AI_A_MODEL=gpt-4
```

#### Anthropic Claude API
```env
AI_B_API_URL=https://api.anthropic.com/v1/messages
AI_B_API_KEY=sk-ant-your-anthropic-key
AI_B_MODEL=claude-3-sonnet-20240229
```

#### 自定义API（OpenAI兼容）
```env
AI_A_API_URL=http://your-server:port/v1/chat/completions
AI_A_API_KEY=your-custom-api-key
AI_A_MODEL=your-custom-model
```

## 开发命令

```bash
# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器（会自动验证环境变量）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 功能特点

### 🤖 双AI协作流程
1. **AI助手A** - 分析型思维，逻辑性强，方法论导向
2. **AI助手B** - 创造型思维，批判性强，善于质疑
3. **多轮讨论** - 最多4轮深度讨论
4. **共识生成** - 综合双方观点生成最终答案

### 🎨 用户体验
- 实时流式对话显示
- 智能折叠历史消息
- 悬浮输入框设计
- 随机问题推荐
- 完全响应式布局

### 🔒 安全特性
- 环境变量强制验证
- 无硬编码敏感信息
- 启动时配置检查
- API错误处理机制

## 🚀 使用说明

1. **选择问题** - 点击推荐问题或输入自定义问题
2. **开始讨论** - AI助手们自动开始协作讨论
3. **观看过程** - 实时查看双AI讨论过程
4. **获得答案** - 最终获得经过深度讨论的共识答案

## 📁 项目结构

```
├── app/                    # Next.js应用
│   ├── layout.tsx         # 应用布局
│   ├── page.tsx           # 主页面
│   └── globals.css        # 全局样式
├── components/            # React组件
│   ├── conversation-flow-clean.tsx  # 主对话组件
│   ├── ui/                # UI组件库
│   └── layout/            # 布局组件
├── lib/                   # 核心库
│   ├── env-validation.ts  # 环境变量验证
│   ├── startup-validation.ts # 启动验证
│   ├── ai-config.ts       # AI配置管理
│   └── streaming-api.ts   # 流式API
├── actions/               # Server Actions
├── types/                 # TypeScript类型
└── .env.local.example     # 环境变量模板
```

## ⚠️ 常见问题

### 应用无法启动？
检查以下事项：
1. `.env.local` 文件是否存在
2. 所有环境变量是否都已配置
3. API URL和API Key是否正确
4. 重启开发服务器

### API连接失败？
1. 检查API URL格式是否正确
2. 验证API Key是否有效
3. 确认网络连接正常
4. 查看控制台错误信息

## 🔧 开发须知

- 本项目使用严格的环境变量验证
- 所有API配置必须来自环境变量
- 不允许硬编码敏感信息
- 支持多种AI API提供商

## 📝 许可证

MIT License