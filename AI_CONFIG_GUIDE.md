# AI双向对话系统配置指南

## 环境变量配置

系统支持为两个AI助手和共识生成器分别配置不同的API服务。所有配置都在 `.env.local` 文件中进行。

### 基本配置结构

```env
# AI助手A配置
AI_A_API_URL=http://31.22.111.51:8000/hf/v1/chat/completions
AI_A_API_KEY=a2366021253
AI_A_MODEL=gemini-2.5-flash-preview-05-20
AI_A_NAME=AI助手A
AI_A_PERSONALITY=analytical,logical,methodical

# AI助手B配置
AI_B_API_URL=http://31.22.111.51:8000/hf/v1/chat/completions
AI_B_API_KEY=a2366021253
AI_B_MODEL=gemini-2.5-flash-preview-05-20
AI_B_NAME=AI助手B
AI_B_PERSONALITY=creative,critical,questioning

# 共识生成AI配置
CONSENSUS_API_URL=http://31.22.111.51:8000/hf/v1/chat/completions
CONSENSUS_API_KEY=a2366021253
CONSENSUS_MODEL=gemini-2.5-flash-preview-05-20
```

## 支持的API服务

### 1. OpenAI API
```env
AI_A_API_URL=https://api.openai.com/v1/chat/completions
AI_A_API_KEY=sk-your-openai-key-here
AI_A_MODEL=gpt-4
```

### 2. Anthropic Claude API
```env
AI_B_API_URL=https://api.anthropic.com/v1/messages
AI_B_API_KEY=sk-ant-your-anthropic-key
AI_B_MODEL=claude-3-sonnet-20240229
```

### 3. 本地API/自部署模型
```env
AI_A_API_URL=http://localhost:8000/v1/chat/completions
AI_A_API_KEY=your-local-key
AI_A_MODEL=your-local-model
```

### 4. Gemini API
```env
AI_A_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
AI_A_API_KEY=your-gemini-key
AI_A_MODEL=gemini-pro
```

## 个性化配置

### AI助手A (分析型)
推荐特性：`analytical,logical,methodical,systematic,thorough`
- 专注于逻辑分析
- 系统性思考
- 详细推理过程

### AI助手B (批判型)
推荐特性：`creative,critical,questioning,innovative,challenging`
- 创造性思维
- 批判性评估
- 质疑和反思

### 共识生成器
推荐特性：`objective,balanced,comprehensive,synthesizing,fair`
- 客观中立
- 平衡观点
- 综合总结

## 混合配置示例

### 示例1：OpenAI + Anthropic 组合
```env
# AI助手A使用GPT-4 (更适合分析)
AI_A_API_URL=https://api.openai.com/v1/chat/completions
AI_A_API_KEY=sk-your-openai-key
AI_A_MODEL=gpt-4
AI_A_PERSONALITY=analytical,logical,systematic

# AI助手B使用Claude (更适合创造性思维)
AI_B_API_URL=https://api.anthropic.com/v1/messages
AI_B_API_KEY=sk-ant-your-key
AI_B_MODEL=claude-3-sonnet-20240229
AI_B_PERSONALITY=creative,critical,innovative

# 共识使用GPT-4 (更好的总结能力)
CONSENSUS_API_URL=https://api.openai.com/v1/chat/completions
CONSENSUS_API_KEY=sk-your-openai-key
CONSENSUS_MODEL=gpt-4
```

### 示例2：不同规模模型组合
```env
# AI助手A使用大模型进行深度分析
AI_A_MODEL=gpt-4-turbo
AI_A_PERSONALITY=analytical,thorough,detailed

# AI助手B使用快速模型进行敏捷思考
AI_B_MODEL=gpt-3.5-turbo
AI_B_PERSONALITY=quick,creative,intuitive

# 共识使用平衡模型
CONSENSUS_MODEL=gpt-4
```

## 配置验证

系统提供配置面板来验证每个AI的连接状态：

1. 点击右下角的设置按钮
2. 查看每个AI的配置信息
3. 点击"测试"按钮验证连接
4. 查看测试结果和响应

## 故障排除

### 常见问题

1. **API密钥错误**
   - 检查密钥格式是否正确
   - 确认密钥有效期未过

2. **网络连接问题**
   - 检查API URL是否正确
   - 确认网络可以访问API服务

3. **模型不存在**
   - 确认模型名称拼写正确
   - 检查账户是否有权限使用该模型

4. **请求格式错误**
   - 不同API服务的请求格式可能不同
   - 确认使用兼容的API格式

### 调试模式

在开发时，可以查看浏览器控制台的日志输出：
- API请求详情
- 响应内容
- 错误信息

## 性能优化建议

1. **模型选择**
   - 分析任务：选择逻辑能力强的模型
   - 创造任务：选择创意能力强的模型
   - 平衡成本和性能

2. **API配置**
   - 设置合适的温度参数 (当前: 0.7)
   - 无token数量限制，确保完整回答
   - 配置超时时间

3. **负载均衡**
   - 不同AI使用不同API服务
   - 分散请求负载
   - 提高系统可用性

## 安全注意事项

1. **密钥保护**
   - 不要将API密钥提交到代码仓库
   - 使用环境变量存储敏感信息
   - 定期轮换API密钥

2. **访问控制**
   - 限制API密钥权限
   - 监控API使用情况
   - 设置使用额度限制

3. **数据隐私**
   - 了解API服务的数据处理政策
   - 避免发送敏感信息
   - 考虑使用本地部署模型