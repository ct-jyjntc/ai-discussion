// 增强的AI提示词系统 - 专注于指向性解答
import { AIConfig } from './ai-config'

interface QuestionAnalysis {
  questionType: 'technical' | 'conceptual' | 'practical' | 'comparative' | 'troubleshooting'
  specificityLevel: 'high' | 'medium' | 'low'
  expectedOutputType: 'step-by-step' | 'explanation' | 'comparison' | 'solution' | 'recommendation'
  keyElements: string[]
  contextRequirements: string[]
}

// 分析问题类型和所需的回答方式
export function analyzeQuestion(question: string): QuestionAnalysis {
  const questionLower = question.toLowerCase()
  
  // 判断问题类型
  let questionType: QuestionAnalysis['questionType'] = 'conceptual'
  if (questionLower.includes('如何') || questionLower.includes('怎么') || questionLower.includes('实现')) {
    questionType = 'practical'
  } else if (questionLower.includes('什么是') || questionLower.includes('为什么') || questionLower.includes('原理')) {
    questionType = 'conceptual'
  } else if (questionLower.includes('vs') || questionLower.includes('对比') || questionLower.includes('区别')) {
    questionType = 'comparative'
  } else if (questionLower.includes('错误') || questionLower.includes('问题') || questionLower.includes('不工作')) {
    questionType = 'troubleshooting'
  } else if (questionLower.includes('代码') || questionLower.includes('算法') || questionLower.includes('api')) {
    questionType = 'technical'
  }

  // 判断具体性级别
  let specificityLevel: QuestionAnalysis['specificityLevel'] = 'medium'
  const specificKeywords = ['具体', '详细', '步骤', '示例', '代码', '配置', '参数']
  const generalKeywords = ['一般', '大概', '简单', '概念', '原理']
  
  if (specificKeywords.some(keyword => questionLower.includes(keyword))) {
    specificityLevel = 'high'
  } else if (generalKeywords.some(keyword => questionLower.includes(keyword))) {
    specificityLevel = 'low'
  }

  // 判断期望的输出类型
  let expectedOutputType: QuestionAnalysis['expectedOutputType'] = 'explanation'
  if (questionLower.includes('步骤') || questionLower.includes('如何') || questionType === 'practical') {
    expectedOutputType = 'step-by-step'
  } else if (questionType === 'comparative') {
    expectedOutputType = 'comparison'
  } else if (questionType === 'troubleshooting') {
    expectedOutputType = 'solution'
  } else if (questionLower.includes('建议') || questionLower.includes('推荐')) {
    expectedOutputType = 'recommendation'
  }

  return {
    questionType,
    specificityLevel,
    expectedOutputType,
    keyElements: extractKeyElements(question),
    contextRequirements: determineContextRequirements(questionType, question)
  }
}

function extractKeyElements(question: string): string[] {
  // 提取问题中的关键要素
  const elements: string[] = []
  
  // 技术关键词
  const techPatterns = [
    /React|Vue|Angular|Next\.js|Nuxt/gi,
    /Python|JavaScript|TypeScript|Java|C\+\+/gi,
    /API|REST|GraphQL|WebSocket/gi,
    /数据库|MySQL|PostgreSQL|MongoDB/gi,
    /Docker|Kubernetes|CI\/CD/gi,
    /性能|优化|缓存|响应时间/gi
  ]
  
  techPatterns.forEach(pattern => {
    const matches = question.match(pattern)
    if (matches) {
      elements.push(...matches)
    }
  })
  
  return [...new Set(elements)] // 去重
}

function determineContextRequirements(questionType: QuestionAnalysis['questionType'], question: string): string[] {
  const requirements: string[] = []
  
  switch (questionType) {
    case 'technical':
      requirements.push('提供具体代码示例', '说明技术原理', '给出最佳实践')
      break
    case 'practical':
      requirements.push('提供详细步骤', '包含实际操作指导', '预防常见错误')
      break
    case 'conceptual':
      requirements.push('清晰解释概念', '提供类比或例子', '说明应用场景')
      break
    case 'comparative':
      requirements.push('详细对比分析', '列出优缺点', '提供选择建议')
      break
    case 'troubleshooting':
      requirements.push('诊断问题原因', '提供解决方案', '预防措施')
      break
  }
  
  return requirements
}

// 生成针对性系统提示词
export function generateTargetedSystemPrompt(
  config: AIConfig, 
  role: 'ai_a' | 'ai_b' | 'consensus', 
  round: number,
  questionAnalysis: QuestionAnalysis
): string {
  const personalities = config.personality.split(',')
  const basePersonality = personalities.join('、')
  
  // 基础角色设定
  const roleDefinition = getRoleDefinition(role, config.name, basePersonality)
  
  // 针对性回答指导
  const targetedGuidance = getTargetedGuidance(questionAnalysis)
  
  // 质量控制要求
  const qualityRequirements = getQualityRequirements(questionAnalysis, round)
  
  return `${roleDefinition}

## 问题分析结果
- 问题类型: ${questionAnalysis.questionType}
- 具体性要求: ${questionAnalysis.specificityLevel}
- 期望输出: ${questionAnalysis.expectedOutputType}
- 关键要素: ${questionAnalysis.keyElements.join(', ') || '无'}
- 上下文需求: ${questionAnalysis.contextRequirements.join(', ')}

${targetedGuidance}

${qualityRequirements}

## 回答质量标准
1. **直接回答问题**: 必须直接针对用户的具体问题，不能泛泛而谈
2. **具体且可操作**: 提供具体的方法、步骤或解决方案
3. **有深度但简洁**: 深入分析但避免冗长的理论阐述
4. **实用性优先**: 优先考虑实际应用价值和可操作性
5. **避免空泛讨论**: 禁止无关的发散性讨论

这是第${round}轮讨论。请根据以上指导提供精准、有针对性的回答。`
}

function getRoleDefinition(role: 'ai_a' | 'ai_b' | 'consensus', name: string, personality: string): string {
  if (role === 'ai_a') {
    return `你是${name}，特点是${personality}。你的核心任务是提供精确、有针对性的解答。

## 你的专长定位
- 深入分析问题的技术细节和实现方法
- 提供系统性、结构化的解决方案
- 注重逻辑性和实用性
- 给出可验证和可操作的具体建议

## 讨论策略
- 先理解问题的核心需求，然后针对性回答
- 提供具体的实现方法和技术细节
- 用事实和逻辑支撑你的观点
- 明确表达对讨论伙伴观点的态度`
  }
  
  if (role === 'ai_b') {
    return `你是${name}，特点是${personality}。你的核心任务是从不同角度完善解答。

## 你的专长定位  
- 从用户体验和实际应用角度思考问题
- 补充遗漏的要点和注意事项
- 提出优化建议和替代方案
- 关注解决方案的完整性和实用性

## 讨论策略
- 仔细分析前面的回答是否完整解决了问题
- 补充遗漏的重要信息或步骤
- 提出可能的改进或优化建议
- 明确表达你是否认为问题已经得到充分解答`
  }
  
  return `你是总结AI，负责生成最终的精准答案。

## 你的任务
- 整合双方的观点，形成完整、准确的解答
- 确保答案直接回应用户的具体问题
- 突出最重要和最实用的信息
- 提供清晰的结论和行动建议`
}

function getTargetedGuidance(analysis: QuestionAnalysis): string {
  let guidance = '## 回答指导原则\n'
  
  switch (analysis.expectedOutputType) {
    case 'step-by-step':
      guidance += `
- 必须提供清晰的步骤说明
- 每个步骤要具体、可执行
- 说明每个步骤的目的和预期结果
- 提醒可能遇到的问题和解决方法`
      break
      
    case 'explanation':
      guidance += `
- 清晰解释核心概念和原理
- 使用具体例子帮助理解
- 说明概念的实际应用场景
- 避免过于抽象的理论阐述`
      break
      
    case 'comparison':
      guidance += `
- 建立清晰的对比框架
- 从多个维度进行比较
- 明确指出各自的优缺点
- 给出选择建议和使用场景`
      break
      
    case 'solution':
      guidance += `
- 诊断问题的根本原因
- 提供具体的解决方案
- 给出实施步骤和注意事项
- 提供预防措施避免问题再次发生`
      break
      
    case 'recommendation':
      guidance += `
- 基于具体场景给出建议
- 解释推荐理由和依据
- 考虑不同情况下的不同选择
- 提供实施建议和注意事项`
      break
  }
  
  // 根据具体性级别添加指导
  if (analysis.specificityLevel === 'high') {
    guidance += `
    
## 高具体性要求
- 必须提供详细的技术细节
- 包含具体的代码示例或配置
- 给出精确的参数和设置
- 避免模糊或概括性的表述`
  }
  
  return guidance
}

function getQualityRequirements(analysis: QuestionAnalysis, round: number): string {
  let requirements = '## 质量控制要求\n'
  
  if (round === 1) {
    requirements += `
**首轮回答重点**:
- 直接回应问题的核心需求
- 提供主要的解决思路或方法
- 给出关键的技术要点或步骤
- 为后续深入讨论奠定基础`
  } else {
    requirements += `
**后续轮次重点**:
- 补充和完善之前的回答
- 解决遗留的问题和疑点
- 提供更具体的实施细节
- 确保解决方案的完整性`
  }
  
  requirements += `

**禁止的回答方式**:
- ❌ 泛泛而谈的理论讨论
- ❌ 偏离主题的发散性内容  
- ❌ 过于抽象缺乏具体性
- ❌ 回避问题的核心要求
- ❌ 提供无法验证的建议

**必须的回答方式**:
- ✅ 直接针对问题的核心
- ✅ 提供具体可行的方法
- ✅ 包含实际的操作指导
- ✅ 给出可验证的结果
- ✅ 考虑实际应用场景`
  
  return requirements
}

// 生成问题分析提示词
export function generateQuestionAnalysisPrompt(question: string): string {
  return `请分析这个用户问题，确定最佳的回答策略：

用户问题："${question}"

请分析：
1. 用户真正想要了解什么？
2. 这个问题需要什么类型的回答？(概念解释/操作步骤/对比分析/问题解决/建议推荐)
3. 用户期望的具体程度如何？(高度具体/适中/概括性)
4. 回答时需要重点关注哪些方面？
5. 什么样的回答能真正解决用户的需求？

基于分析结果，为AI助手提供针对性的回答指导。`
}

// 共识质量评估增强
export function generateEnhancedConsensusPrompt(question: string, discussion: string): string {
  const analysis = analyzeQuestion(question)
  
  return `请评估这次AI讨论是否真正解决了用户的问题：

## 原始问题分析
- 问题类型: ${analysis.questionType}
- 期望输出: ${analysis.expectedOutputType}  
- 具体性要求: ${analysis.specificityLevel}
- 关键要素: ${analysis.keyElements.join(', ') || '无'}

## 用户问题
"${question}"

## 完整讨论内容
${discussion}

## 评估标准
1. **问题解决度** (0-100分):
   - 是否直接回答了用户的具体问题？
   - 提供的解决方案是否可操作？
   - 是否包含了必要的技术细节？

2. **内容针对性** (0-100分):
   - 回答是否紧扣问题要点？
   - 是否避免了无关的发散讨论？
   - 信息是否具有实用价值？

3. **完整性评估** (complete/incomplete/unclear):
   - 是否覆盖了问题的所有重要方面？
   - 是否提供了足够的实施指导？
   - 用户是否能据此解决实际问题？

## 特别关注
- 如果讨论过于理论化或空泛，即使AI达成一致也不算有效共识
- 如果缺少具体的实施方法或技术细节，需要继续深入讨论
- 如果偏离了用户的核心需求，必须重新聚焦

请基于以上标准进行严格评估，确保只有真正解决了用户问题的讨论才被认定为达成有效共识。`
}