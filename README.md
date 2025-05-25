# AI Collaborative Question-Answering System

这是一个创新的多AI协作问答系统，使用两个AI代理（分析器和验证器）协作处理用户问题。

## 技术栈

- **Next.js 15** - React全栈框架
- **TypeScript** - 类型安全开发
- **Tailwind CSS** - 样式框架
- **Radix UI** - 组件库
- **Gemini 2.5 Flash** - AI模型

## API 配置

项目配置使用OpenAI兼容的API格式：

- **API端点**: `http://31.22.111.51:8000/hf/v1/chat/completions`
- **API密钥**: `a2366021253`
- **模型**: `gemini-2.5-flash-preview-05-20`
- **Token限制**: 4000 tokens (避免响应截断)

## 功能特点

### 多AI协作流程
1. **分析器AI** - 分析用户问题，识别关键信息和潜在歧义
2. **验证器AI** - 验证分析结果，判断是否需要进一步改进
3. **多轮对话** - 最多3轮协作优化
4. **最终答案** - 基于协作分析生成完整答案

### 用户体验
- 实时显示AI思考过程
- 可视化对话流程
- API连接测试功能
- 响应式设计

## 开发命令

```bash
# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 环境配置

确保 `.env.local` 文件包含：

```
CUSTOM_API_KEY=a2366021253
```

## 解决截断问题

项目已优化以避免API响应截断：

1. **增加Token限制** - 从1000提升到4000 tokens
2. **完整响应处理** - 支持多种API响应格式
3. **错误处理机制** - 提供备用API调用方案
4. **无前端限制** - 消息显示组件支持完整内容展示

## 使用说明

1. 在输入框中输入您的问题
2. 点击"Test API"按钮测试连接（推荐）
3. 点击"Start AI Collaboration"开始协作分析
4. 观察两个AI代理的协作过程
5. 获得基于深度分析的最终答案

## 项目结构

```
├── app/              # Next.js页面
├── components/       # React组件
├── actions/          # Server Actions
├── lib/              # 工具函数
├── types/            # TypeScript类型
└── styles/           # 样式文件