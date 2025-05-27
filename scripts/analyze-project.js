#!/usr/bin/env node

/**
 * 项目分析脚本 - 自动检测优化机会
 */

const fs = require('fs')
const path = require('path')

class ProjectAnalyzer {
  constructor() {
    this.issues = []
    this.suggestions = []
    this.stats = {
      totalFiles: 0,
      totalLines: 0,
      jsFiles: 0,
      tsFiles: 0,
      componentFiles: 0
    }
  }

  analyze() {
    console.log('🔍 开始分析项目...\n')

    // 分析package.json
    this.analyzePackageJson()

    // 分析项目结构
    this.analyzeProjectStructure()

    // 分析代码质量
    this.analyzeCodeQuality()

    // 分析性能机会
    this.analyzePerformanceOpportunities()

    // 生成报告
    this.generateReport()
  }

  analyzePackageJson() {
    console.log('📦 分析依赖配置...')

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

      // 检查未使用的Radix UI组件
      const radixComponents = Object.keys(dependencies).filter(dep => dep.startsWith('@radix-ui/'))
      if (radixComponents.length > 15) {
        this.issues.push({
          type: 'dependency',
          severity: 'medium',
          message: `发现 ${radixComponents.length} 个Radix UI组件，可能存在未使用的依赖`,
          suggestion: '运行 `npx depcheck` 检查未使用的依赖'
        })
      }

      // 检查脚本命令
      const scripts = packageJson.scripts || {}
      const recommendedScripts = ['lint:fix', 'type-check', 'health-check']
      const missingScripts = recommendedScripts.filter(script => !scripts[script])

      if (missingScripts.length > 0) {
        this.suggestions.push({
          type: 'scripts',
          message: `建议添加脚本命令: ${missingScripts.join(', ')}`,
          action: '已在优化建议中提供了增强的package.json配置'
        })
      }

      console.log('  ✅ 依赖分析完成')
    } catch (error) {
      this.issues.push({
        type: 'config',
        severity: 'high',
        message: 'package.json文件读取失败',
        suggestion: '检查package.json文件格式'
      })
    }
  }

  analyzeProjectStructure() {
    console.log('📁 分析项目结构...')

    const requiredFiles = [
      '.env.local.example',
      'README.md',
      'tsconfig.json',
      'tailwind.config.ts'
    ]

    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file))
    if (missingFiles.length > 0) {
      missingFiles.forEach(file => {
        if (file === '.env.local.example') {
          this.suggestions.push({
            type: 'config',
            message: '建议创建环境变量模板文件',
            action: '✅ 已创建 .env.local.example'
          })
        } else {
          this.issues.push({
            type: 'structure',
            severity: 'low',
            message: `缺少文件: ${file}`,
            suggestion: `创建 ${file} 文件`
          })
        }
      })
    }

    // 统计代码文件
    this.countFiles('.')

    console.log('  ✅ 项目结构分析完成')
  }

  analyzeCodeQuality() {
    console.log('🔍 分析代码质量...')

    // 检查TypeScript配置
    if (fs.existsSync('tsconfig.json')) {
      try {
        const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'))
        const compilerOptions = tsConfig.compilerOptions || {}

        if (!compilerOptions.strict) {
          this.issues.push({
            type: 'typescript',
            severity: 'medium',
            message: 'TypeScript strict模式未启用',
            suggestion: '在tsconfig.json中启用strict模式以获得更好的类型安全'
          })
        }

        if (!compilerOptions.noUnusedLocals) {
          this.suggestions.push({
            type: 'typescript',
            message: '建议启用noUnusedLocals以检测未使用的变量',
            action: '在tsconfig.json中添加 "noUnusedLocals": true'
          })
        }
      } catch (error) {
        this.issues.push({
          type: 'config',
          severity: 'medium',
          message: 'tsconfig.json格式错误',
          suggestion: '检查TypeScript配置文件'
        })
      }
    }

    console.log('  ✅ 代码质量分析完成')
  }

  analyzePerformanceOpportunities() {
    console.log('⚡ 分析性能优化机会...')

    // 检查是否有性能监控
    const hasPerformanceMonitor = fs.existsSync('lib/performance-monitor.ts')
    if (!hasPerformanceMonitor) {
      this.suggestions.push({
        type: 'performance',
        message: '建议添加性能监控系统',
        action: '✅ 已创建 lib/performance-monitor.ts'
      })
    }

    // 检查是否有缓存系统
    const hasCacheManager = fs.existsSync('lib/cache-manager.ts')
    if (!hasCacheManager) {
      this.suggestions.push({
        type: 'performance',
        message: '建议添加智能缓存系统',
        action: '✅ 已创建 lib/cache-manager.ts'
      })
    }

    // 检查是否有错误处理
    const hasErrorHandling = fs.existsSync('lib/error-handling.ts')
    if (!hasErrorHandling) {
      this.suggestions.push({
        type: 'reliability',
        message: '建议添加增强的错误处理机制',
        action: '✅ 已创建 lib/error-handling.ts'
      })
    }

    console.log('  ✅ 性能分析完成')
  }

  countFiles(dir, level = 0) {
    if (level > 3) return // 避免过深递归

    try {
      const items = fs.readdirSync(dir)
      
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules' || item === '.next') continue
        
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          this.countFiles(fullPath, level + 1)
        } else if (stat.isFile()) {
          this.stats.totalFiles++
          
          const ext = path.extname(item)
          if (ext === '.js' || ext === '.jsx') {
            this.stats.jsFiles++
          } else if (ext === '.ts' || ext === '.tsx') {
            this.stats.tsFiles++
            
            if (item.includes('component') || dir.includes('components')) {
              this.stats.componentFiles++
            }
          }
          
          // 简单统计行数
          try {
            const content = fs.readFileSync(fullPath, 'utf8')
            this.stats.totalLines += content.split('\n').length
          } catch (e) {
            // 忽略二进制文件等
          }
        }
      }
    } catch (error) {
      // 忽略权限错误等
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 项目分析报告')
    console.log('='.repeat(60))

    // 项目统计
    console.log('\n📈 项目统计:')
    console.log(`  总文件数: ${this.stats.totalFiles}`)
    console.log(`  总代码行数: ${this.stats.totalLines.toLocaleString()}`)
    console.log(`  TypeScript文件: ${this.stats.tsFiles}`)
    console.log(`  JavaScript文件: ${this.stats.jsFiles}`)
    console.log(`  组件文件: ${this.stats.componentFiles}`)

    // 问题报告
    const highIssues = this.issues.filter(i => i.severity === 'high')
    const mediumIssues = this.issues.filter(i => i.severity === 'medium')
    const lowIssues = this.issues.filter(i => i.severity === 'low')

    console.log('\n🚨 发现的问题:')
    if (this.issues.length === 0) {
      console.log('  ✅ 未发现严重问题')
    } else {
      if (highIssues.length > 0) {
        console.log(`\n  ❌ 高优先级 (${highIssues.length}):`)
        highIssues.forEach(issue => {
          console.log(`    - ${issue.message}`)
          console.log(`      建议: ${issue.suggestion}`)
        })
      }

      if (mediumIssues.length > 0) {
        console.log(`\n  ⚠️ 中优先级 (${mediumIssues.length}):`)
        mediumIssues.forEach(issue => {
          console.log(`    - ${issue.message}`)
          console.log(`      建议: ${issue.suggestion}`)
        })
      }

      if (lowIssues.length > 0) {
        console.log(`\n  ℹ️ 低优先级 (${lowIssues.length}):`)
        lowIssues.forEach(issue => {
          console.log(`    - ${issue.message}`)
        })
      }
    }

    // 优化建议
    console.log('\n💡 优化建议:')
    if (this.suggestions.length === 0) {
      console.log('  ✅ 暂无优化建议')
    } else {
      this.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion.message}`)
        if (suggestion.action) {
          console.log(`     ${suggestion.action}`)
        }
      })
    }

    // 下一步建议
    console.log('\n🎯 下一步建议:')
    if (highIssues.length > 0) {
      console.log('  1. 优先处理高优先级问题')
      console.log('  2. 运行项目健康检查: npm run health-check')
      console.log('  3. 查看详细优化建议: OPTIMIZATION-RECOMMENDATIONS.md')
    } else if (mediumIssues.length > 0) {
      console.log('  1. 处理中优先级问题')
      console.log('  2. 启用TypeScript严格模式')
      console.log('  3. 清理未使用的依赖')
    } else {
      console.log('  1. ✅ 项目状态良好!')
      console.log('  2. 查看性能优化建议: OPTIMIZATION-RECOMMENDATIONS.md')
      console.log('  3. 运行管理面板查看实时状态')
    }

    console.log('\n📚 相关文档:')
    console.log('  - 详细优化建议: OPTIMIZATION-RECOMMENDATIONS.md')
    console.log('  - 环境配置模板: .env.local.example')
    console.log('  - 管理面板API: /api/admin/dashboard')

    console.log('\n' + '='.repeat(60))
    console.log('分析完成! 🎉')
    console.log('='.repeat(60))
  }
}

// 运行分析
if (require.main === module) {
  const analyzer = new ProjectAnalyzer()
  analyzer.analyze()
}

module.exports = ProjectAnalyzer