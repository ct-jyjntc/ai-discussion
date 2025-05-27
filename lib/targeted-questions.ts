// 针对性问题库 - 专门测试AI指向性解答能力
export const targetedQuestions = {
  // 技术实现类问题 - 需要具体步骤和代码
  technical: [
    "如何在Next.js中实现服务端渲染的用户认证？",
    "React Hook useState 和 useReducer 的具体使用场景和实现差异？",
    "如何优化Python中大数据文件的读取性能？",
    "Docker容器化Node.js应用的最佳实践配置？",
    "如何实现MySQL数据库的读写分离架构？"
  ],

  // 问题解决类 - 需要诊断和解决方案
  troubleshooting: [
    "React应用中出现'Maximum update depth exceeded'错误如何解决？",
    "为什么API请求在生产环境中比开发环境慢很多？",
    "Node.js应用内存泄漏如何排查和修复？",
    "微服务架构中服务间通信超时问题的解决方案？",
    "前端页面在移动设备上加载缓慢的原因和优化方法？"
  ],

  // 架构设计类 - 需要具体设计方案
  architecture: [
    "设计一个支持百万用户的电商系统架构方案？",
    "如何设计一个高可用的分布式缓存系统？",
    "微服务和单体应用的选择依据和迁移策略？",
    "如何设计一个安全可靠的用户权限管理系统？",
    "实时聊天系统的技术架构和关键组件选择？"
  ],

  // 性能优化类 - 需要具体优化方案
  performance: [
    "React应用首屏加载时间过长的优化策略？",
    "SQL查询性能优化的具体方法和工具？",
    "CDN配置对网站性能的提升方案？",
    "前端代码打包体积优化的实践方法？",
    "Redis缓存策略设计和过期时间设置原则？"
  ],

  // 最佳实践类 - 需要具体的实施建议
  bestPractices: [
    "Git工作流在多人协作项目中的规范设计？",
    "API接口设计的安全性和易用性最佳实践？",
    "代码审查流程的建立和执行标准？",
    "测试驱动开发在实际项目中的应用方法？",
    "DevOps流水线的搭建和优化策略？"
  ],

  // 对比分析类 - 需要详细对比和选择建议
  comparison: [
    "PostgreSQL vs MySQL：在不同业务场景下的选择标准？",
    "Vue.js vs React：项目技术选型的决策因素？",
    "Kubernetes vs Docker Swarm：容器编排平台对比？",
    "GraphQL vs REST API：接口设计方式的优劣分析？",
    "TypeScript vs JavaScript：在大型项目中的适用性对比？"
  ]
}

// 获取随机的针对性问题
export function getTargetedQuestions(count: number = 3): string[] {
  const allCategories = Object.values(targetedQuestions)
  const allQuestions = allCategories.flat()
  
  // 确保每个类别至少有一个问题被选中
  const selectedQuestions: string[] = []
  const categories = Object.keys(targetedQuestions) as Array<keyof typeof targetedQuestions>
  
  // 从每个类别随机选一个
  categories.forEach(category => {
    const categoryQuestions = targetedQuestions[category]
    const randomIndex = Math.floor(Math.random() * categoryQuestions.length)
    selectedQuestions.push(categoryQuestions[randomIndex])
  })
  
  // 如果需要更多问题，从所有问题中随机选择
  while (selectedQuestions.length < count && selectedQuestions.length < allQuestions.length) {
    const randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)]
    if (!selectedQuestions.includes(randomQuestion)) {
      selectedQuestions.push(randomQuestion)
    }
  }
  
  // 随机打乱并返回指定数量
  return selectedQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

// 根据问题类型分析所需的回答特征
export function getAnswerRequirements(question: string): {
  shouldInclude: string[]
  shouldAvoid: string[]
  qualityChecks: string[]
} {
  const questionLower = question.toLowerCase()
  
  let shouldInclude: string[] = []
  let shouldAvoid: string[] = []
  let qualityChecks: string[] = []
  
  // 技术实现类问题
  if (questionLower.includes('如何实现') || questionLower.includes('怎么做')) {
    shouldInclude = [
      '具体的实现步骤',
      '代码示例或配置',
      '技术细节说明',
      '注意事项和最佳实践'
    ]
    shouldAvoid = [
      '过于抽象的概念解释',
      '无关的技术发散',
      '缺少具体操作指导'
    ]
    qualityChecks = [
      '是否提供了可执行的步骤？',
      '是否包含必要的代码示例？',
      '是否说明了关键配置参数？'
    ]
  }
  
  // 问题解决类
  else if (questionLower.includes('错误') || questionLower.includes('问题') || questionLower.includes('解决')) {
    shouldInclude = [
      '问题原因分析',
      '具体解决方案',
      '验证和测试方法',
      '预防措施'
    ]
    shouldAvoid = [
      '模糊的概括性建议',
      '未经验证的解决方案',
      '缺少根因分析'
    ]
    qualityChecks = [
      '是否准确诊断了问题原因？',
      '是否提供了可验证的解决方案？',
      '是否给出了预防建议？'
    ]
  }
  
  // 对比分析类
  else if (questionLower.includes('vs') || questionLower.includes('对比') || questionLower.includes('区别')) {
    shouldInclude = [
      '详细的对比维度',
      '各自的优缺点',
      '适用场景分析',
      '选择建议'
    ]
    shouldAvoid = [
      '片面的优劣判断',
      '缺少具体场景考虑',
      '过于简单的结论'
    ]
    qualityChecks = [
      '是否从多个维度进行了对比？',
      '是否考虑了不同的使用场景？',
      '是否给出了明确的选择建议？'
    ]
  }
  
  // 架构设计类
  else if (questionLower.includes('架构') || questionLower.includes('设计') || questionLower.includes('系统')) {
    shouldInclude = [
      '架构组件和模块划分',
      '技术选型理由',
      '扩展性和可维护性考虑',
      '实施路径和注意事项'
    ]
    shouldAvoid = [
      '过于理想化的设计',
      '忽略实际约束条件',
      '缺少可操作性'
    ]
    qualityChecks = [
      '是否提供了完整的架构方案？',
      '是否考虑了性能和扩展性？',
      '是否给出了实施建议？'
    ]
  }
  
  // 通用要求
  else {
    shouldInclude = [
      '直接回答问题核心',
      '提供具体可行的建议',
      '包含实际应用指导'
    ]
    shouldAvoid = [
      '泛泛而谈的理论',
      '偏离主题的内容',
      '缺乏实用性的信息'
    ]
    qualityChecks = [
      '是否直接回应了用户需求？',
      '是否提供了可操作的建议？',
      '是否具有实际应用价值？'
    ]
  }
  
  return { shouldInclude, shouldAvoid, qualityChecks }
}

// 生成问题质量评估标准
export function generateQualityStandards(question: string): string {
  const requirements = getAnswerRequirements(question)
  
  return `
## 针对此问题的回答质量标准

### ✅ 必须包含：
${requirements.shouldInclude.map(item => `- ${item}`).join('\n')}

### ❌ 必须避免：
${requirements.shouldAvoid.map(item => `- ${item}`).join('\n')}

### 🔍 质量检查点：
${requirements.qualityChecks.map(item => `- ${item}`).join('\n')}

### 📏 评分标准：
- **优秀 (90-100分)**: 完全满足上述要求，提供深入且实用的解答
- **良好 (70-89分)**: 基本满足要求，有少量可改进之处
- **及格 (60-69分)**: 部分满足要求，但缺少关键信息或实用性
- **不及格 (<60分)**: 未能满足基本要求，答案空泛或偏题
  `.trim()
}