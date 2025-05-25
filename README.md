# DISCUSSION - AI协作对话系统

一个现代化的AI协作对话平台，让两个AI助手就用户问题进行深度讨论，直到达成共识。

## ✨ 功能特点

- 🤖 **双AI协作**: 两个具有不同思维方式的AI助手协作讨论
- 💬 **流式对话**: 实时显示AI思考和回答过程
- 🎯 **智能共识**: 自动生成综合性的共识答案
- 📱 **响应式设计**: 完美适配桌面端和移动端
- 🎨 **现代UI**: 简洁优雅的用户界面
- 🚀 **快速体验**: 提供随机问题快速开始讨论
- 🎭 **智能折叠**: AI输出完成后自动折叠，保持界面整洁

## 🛠 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **部署**: Vercel Ready

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/ct-jyjntc/ai-discussion.git
cd ai-discussion
```

### 2. 安装依赖
```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 3. 配置环境变量
复制并配置 `.env.local` 文件：

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

# 开发服务器端口
PORT=3000
```

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 访问应用
打开浏览器访问 `http://localhost:3000`

## 📖 使用方法

1. **快速开始**: 点击页面中展示的随机问题即可开始讨论
2. **自定义问题**: 在底部悬浮输入框输入您的问题
3. **观看讨论**: 两个AI助手会进行多轮深度讨论
4. **获得共识**: 讨论结束后生成综合性答案
5. **重新开始**: 点击重置按钮开始新的讨论

## 🎮 界面功能

- **悬浮输入**: 输入框固定在底部，随时可用
- **智能折叠**: AI讨论完成后自动折叠，可手动展开
- **丝滑动画**: 500ms的流畅折叠/展开动画
- **圆形发送**: 现代化的圆形发送按钮
- **GitHub链接**: 右上角可直接访问项目源码
- **品牌标识**: 左上角DISCUSSION标题

## ⚙️ 配置说明

### 支持的AI服务
- OpenAI GPT系列
- Anthropic Claude系列  
- Google Gemini系列
- 其他兼容OpenAI API格式的服务

### AI助手特点
- **AI助手A**: 分析型、逻辑性、系统性思维
- **AI助手B**: 创造性、批判性、质疑性思维
- **共识生成**: 综合双方观点生成最终答案

### 随机问题库
系统内置10个精心设计的讨论话题：
- 工作效率与创造力平衡
- AI对教育的影响
- 数字时代的深度思考
- 远程工作利弊分析
- 心理健康维护
- 区块链应用前景
- 可持续发展平衡
- 社交媒体影响
- 城市交通系统设计
- AI时代技能学习

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 全局布局
│   ├── page.tsx           # 主页
│   └── globals.css        # 全局样式
├── components/            # React组件
│   ├── ui/               # 基础UI组件
│   ├── layout/           # 布局组件
│   └── conversation-flow-clean.tsx  # 主对话组件
├── lib/                  # 工具函数和配置
│   ├── streaming-api.ts  # 流式API处理
│   ├── design-system.ts  # 设计系统
│   └── utils.ts          # 工具函数
├── types/                # TypeScript类型定义
├── actions/              # Server Actions
└── public/               # 静态资源
```

## 🔧 开发指南

### 本地开发
```bash
npm run dev          # 启动开发服务器 (默认端口3000)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
```

### 自定义端口
在 `.env.local` 中设置：
```env
PORT=3001  # 或其他端口
```

### 环境变量
- 开发环境: `.env.local`
- 生产环境: 通过部署平台配置

## 🚀 部署

### Vercel部署 (推荐)
1. 连接GitHub仓库到Vercel
2. 在Vercel控制台配置环境变量
3. 自动部署完成

### 其他平台
支持任何支持Next.js的平台：
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🎨 设计特色

### 视觉系统
- **配色**: 基于Slate的现代单色调
- **圆角**: 统一6px圆角设计
- **阴影**: 多层次shadow-lg效果
- **动画**: 丝滑的ease-out过渡

### 响应式设计
- 移动端优先的响应式布局
- 完美适配所有屏幕尺寸
- 触摸友好的交互设计

### 无障碍访问
- 完整的键盘导航支持
- 屏幕阅读器友好
- 高对比度模式支持

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 贡献流程
1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 发起Pull Request

### 开发规范
- 使用TypeScript进行类型安全开发
- 遵循ESLint规则
- 使用Prettier格式化代码
- 编写清晰的提交信息

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [项目主页](https://github.com/ct-jyjntc/ai-discussion)
- [在线演示](https://ai-discussion-demo.vercel.app)
- [Next.js文档](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues: [提交问题](https://github.com/ct-jyjntc/ai-discussion/issues)
- GitHub Discussions: [参与讨论](https://github.com/ct-jyjntc/ai-discussion/discussions)

---

⭐ 如果这个项目对您有帮助，请给个星标支持！