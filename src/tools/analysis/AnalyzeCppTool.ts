/**
 * SuperAugment C++ Analysis Tool
 * 
 * Provides comprehensive C++ code analysis including syntax analysis,
 * semantic analysis, dependency tracking, performance analysis, and
 * modern C++ best practices validation.
 */

import { z } from 'zod';
import { basename } from 'path';
import { BaseTool, type ToolExecutionContext, type ToolExecutionResult } from '../BaseTool.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { FileSystemManager } from '../../utils/FileSystemManager.js';
import { CppAnalyzer } from '../../analyzers/CppAnalyzer.js';
import { CppRuleEngine, type RuleViolation } from '../../analyzers/CppRuleEngine.js';
import {
  AnalysisError,
  ErrorCode,
} from '../../errors/ErrorTypes.js';

/**
 * C++ analysis options schema
 */
const CppAnalysisOptionsSchema = z.object({
  path: z.string().describe('Path to C++ file or directory to analyze'),
  includeHeaders: z.boolean().default(true).describe('Include header file analysis'),
  analyzeIncludes: z.boolean().default(true).describe('Analyze include dependencies'),
  checkModernCpp: z.boolean().default(true).describe('Check for modern C++ practices'),
  performanceAnalysis: z.boolean().default(true).describe('Perform performance analysis'),
  memoryAnalysis: z.boolean().default(true).describe('Analyze memory management'),
  securityAnalysis: z.boolean().default(true).describe('Perform security analysis'),
  cppStandard: z.enum(['cpp11', 'cpp14', 'cpp17', 'cpp20', 'cpp23']).default('cpp17').describe('C++ standard to target'),
  maxDepth: z.number().int().min(1).max(10).default(5).describe('Maximum analysis depth for dependencies'),
  excludePatterns: z.array(z.string()).default([]).describe('Patterns to exclude from analysis'),
  customRules: z.array(z.string()).default([]).describe('Custom rule names to apply'),
}).strict();

type CppAnalysisOptions = z.infer<typeof CppAnalysisOptionsSchema>;

/**
 * C++ analysis result interface
 */
interface CppAnalysisReport {
  summary: {
    filesAnalyzed: number;
    totalLines: number;
    codeLines: number;
    commentLines: number;
    blankLines: number;
    functions: number;
    classes: number;
    namespaces: number;
    includes: number;
  };
  codeQuality: {
    score: number;
    grade: string;
    issues: RuleViolation[];
    suggestions: string[];
  };
  modernCpp: {
    score: number;
    features: {
      name: string;
      used: boolean;
      recommendation: string;
    }[];
    improvements: string[];
  };
  performance: {
    score: number;
    hotspots: {
      file: string;
      line: number;
      issue: string;
      severity: string;
      suggestion: string;
    }[];
    optimizations: string[];
  };
  memory: {
    score: number;
    issues: {
      file: string;
      line: number;
      type: string;
      description: string;
      fix: string;
    }[];
    recommendations: string[];
  };
  security: {
    score: number;
    vulnerabilities: {
      file: string;
      line: number;
      type: string;
      severity: string;
      description: string;
      mitigation: string;
    }[];
    recommendations: string[];
  };
  dependencies: {
    includes: {
      file: string;
      type: 'system' | 'local';
      found: boolean;
      path?: string;
    }[];
    graph: {
      nodes: { id: string; label: string; type: string }[];
      edges: { from: string; to: string; type: string }[];
    };
  };
  metrics: {
    complexity: {
      cyclomatic: number;
      cognitive: number;
      halstead: {
        volume: number;
        difficulty: number;
        effort: number;
      };
    };
    maintainability: {
      index: number;
      rating: string;
    };
    testability: {
      score: number;
      issues: string[];
    };
  };
}

/**
 * Comprehensive C++ Analysis Tool
 */
export class AnalyzeCppTool extends BaseTool {
  public readonly name = 'analyze_cpp';
  public readonly description = 'Comprehensive C++ code analysis including syntax, semantics, performance, memory, and security analysis';
  public readonly inputSchema = CppAnalysisOptionsSchema;

  private fileSystemManager: FileSystemManager;
  private cppAnalyzer: CppAnalyzer;
  private ruleEngine: CppRuleEngine;

  constructor(configManager: ConfigManager) {
    super(configManager, {
      maxExecutionTime: 600000, // 10 minutes for large codebases
      maxMemoryUsage: 1024 * 1024 * 1024, // 1GB for complex analysis
    });

    this.fileSystemManager = new FileSystemManager({
      enableCache: true,
      enableSecurity: true,
      enablePerformanceMonitoring: true,
    });

    this.cppAnalyzer = new CppAnalyzer(this.fileSystemManager);
    this.ruleEngine = new CppRuleEngine();
  }

  protected async executeInternal(
    args: CppAnalysisOptions,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    try {
      // Validate input path
      const targetPath = args.path;
      if (!await this.fileSystemManager.fileExists(targetPath)) {
        throw new AnalysisError(
          `Target path does not exist: ${targetPath}`,
          ErrorCode.FILE_NOT_FOUND,
          { additionalInfo: { path: targetPath } }
        );
      }

      // Discover C++ files
      const cppFiles = await this.discoverCppFiles(targetPath, args);
      
      if (cppFiles.length === 0) {
        return this.createResponse(
          '❌ No C++ files found in the specified path.',
          [],
          { filesFound: 0 }
        );
      }

      // Initialize analysis report
      const report: CppAnalysisReport = await this.initializeReport();

      // Perform comprehensive analysis
      await this.performSyntaxAnalysis(cppFiles, args, report);
      await this.performSemanticAnalysis(cppFiles, args, report);
      await this.performDependencyAnalysis(cppFiles, args, report);
      await this.performCodeQualityAnalysis(cppFiles, args, report);
      await this.performModernCppAnalysis(cppFiles, args, report);
      await this.performPerformanceAnalysis(cppFiles, args, report);
      await this.performMemoryAnalysis(cppFiles, args, report);
      await this.performSecurityAnalysis(cppFiles, args, report);
      await this.calculateMetrics(cppFiles, args, report);

      // Generate final scores and recommendations
      this.generateFinalScores(report);
      const recommendations = this.generateRecommendations(report);

      // Create comprehensive response
      return this.createCppAnalysisResponse(report, recommendations, cppFiles.length);

    } catch (error) {
      if (error instanceof AnalysisError) {
        return this.createErrorResponse(error, true);
      }
      
      throw new AnalysisError(
        `C++ analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.ANALYSIS_FAILED,
        { additionalInfo: { args, context: context.requestId } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Discover C++ files in the target path
   */
  private async discoverCppFiles(targetPath: string, options: CppAnalysisOptions): Promise<string[]> {
    const cppExtensions = ['.cpp', '.cxx', '.cc', '.c++', '.C'];
    const headerExtensions = ['.h', '.hpp', '.hxx', '.h++', '.H'];
    
    let patterns: string[] = [];
    
    // Build file patterns based on options
    if (options.includeHeaders) {
      patterns = [...cppExtensions, ...headerExtensions].map(ext => `**/*${ext}`);
    } else {
      patterns = cppExtensions.map(ext => `**/*${ext}`);
    }

    const allFiles: string[] = [];
    
    for (const pattern of patterns) {
      const files = await this.fileSystemManager.findFiles(pattern, targetPath);
      allFiles.push(...files);
    }

    // Apply exclusion patterns
    const excludeRegexes = options.excludePatterns.map(pattern => new RegExp(pattern));
    const filteredFiles = allFiles.filter(file => {
      return !excludeRegexes.some(regex => regex.test(file));
    });

    return [...new Set(filteredFiles)]; // Remove duplicates
  }

  /**
   * Initialize analysis report structure
   */
  private async initializeReport(): Promise<CppAnalysisReport> {
    return {
      summary: {
        filesAnalyzed: 0,
        totalLines: 0,
        codeLines: 0,
        commentLines: 0,
        blankLines: 0,
        functions: 0,
        classes: 0,
        namespaces: 0,
        includes: 0,
      },
      codeQuality: {
        score: 0,
        grade: 'F',
        issues: [],
        suggestions: [],
      },
      modernCpp: {
        score: 0,
        features: [],
        improvements: [],
      },
      performance: {
        score: 0,
        hotspots: [],
        optimizations: [],
      },
      memory: {
        score: 0,
        issues: [],
        recommendations: [],
      },
      security: {
        score: 0,
        vulnerabilities: [],
        recommendations: [],
      },
      dependencies: {
        includes: [],
        graph: {
          nodes: [],
          edges: [],
        },
      },
      metrics: {
        complexity: {
          cyclomatic: 0,
          cognitive: 0,
          halstead: {
            volume: 0,
            difficulty: 0,
            effort: 0,
          },
        },
        maintainability: {
          index: 0,
          rating: 'Poor',
        },
        testability: {
          score: 0,
          issues: [],
        },
      },
    };
  }

  /**
   * Perform syntax analysis
   */
  private async performSyntaxAnalysis(
    files: string[],
    options: CppAnalysisOptions,
    report: CppAnalysisReport
  ): Promise<void> {
    for (const file of files) {
      try {
        const analysis = await this.cppAnalyzer.analyzeSyntax(file, options.cppStandard);
        
        // Update summary statistics
        report.summary.filesAnalyzed++;
        report.summary.totalLines += analysis.lineCount.total;
        report.summary.codeLines += analysis.lineCount.code;
        report.summary.commentLines += analysis.lineCount.comments;
        report.summary.blankLines += analysis.lineCount.blank;
        report.summary.functions += analysis.functions.length;
        report.summary.classes += analysis.classes.length;
        report.summary.namespaces += analysis.namespaces.length;
        report.summary.includes += analysis.includes.length;

      } catch (error) {
        // Log syntax errors but continue analysis
        report.codeQuality.issues.push({
          rule: 'syntax_error',
          file,
          line: 0,
          column: 0,
          severity: 'error',
          message: `Syntax error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Fix syntax errors before proceeding with analysis',
        });
      }
    }
  }

  /**
   * Perform semantic analysis
   */
  private async performSemanticAnalysis(
    files: string[],
    options: CppAnalysisOptions,
    report: CppAnalysisReport
  ): Promise<void> {
    for (const file of files) {
      try {
        await this.cppAnalyzer.analyzeSemantics(file, options.cppStandard);
        
        // Process semantic analysis results
        // This would include type checking, scope analysis, etc.
        // For now, we'll add placeholder logic
        
      } catch (error) {
        report.codeQuality.issues.push({
          rule: 'semantic_error',
          file,
          line: 0,
          column: 0,
          severity: 'warning',
          message: `Semantic analysis warning: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Review code for semantic issues',
        });
      }
    }
  }

  /**
   * Perform dependency analysis
   */
  private async performDependencyAnalysis(
    files: string[],
    options: CppAnalysisOptions,
    report: CppAnalysisReport
  ): Promise<void> {
    if (!options.analyzeIncludes) return;

    for (const file of files) {
      try {
        const dependencies = await this.cppAnalyzer.analyzeDependencies(file, options.maxDepth);
        
        // Add to dependency graph
        report.dependencies.includes.push(...dependencies.includes);
        
        // Build dependency graph nodes and edges
        const fileNode = { id: file, label: basename(file), type: 'source' };
        report.dependencies.graph.nodes.push(fileNode);
        
        for (const include of dependencies.includes) {
          const includeNode = { id: include.file, label: basename(include.file), type: include.type };
          report.dependencies.graph.nodes.push(includeNode);
          report.dependencies.graph.edges.push({
            from: file,
            to: include.file,
            type: 'includes',
          });
        }

      } catch (error) {
        // Log dependency analysis errors
        report.codeQuality.issues.push({
          rule: 'dependency_error',
          file,
          line: 0,
          column: 0,
          severity: 'info',
          message: `Dependency analysis issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Check include paths and dependencies',
        });
      }
    }

    // Remove duplicate nodes
    const uniqueNodes = report.dependencies.graph.nodes.filter((node, index, self) =>
      index === self.findIndex(n => n.id === node.id)
    );
    report.dependencies.graph.nodes = uniqueNodes;
  }

  /**
   * Perform code quality analysis using rule engine
   */
  private async performCodeQualityAnalysis(
    files: string[],
    options: CppAnalysisOptions,
    report: CppAnalysisReport
  ): Promise<void> {
    // Load rules based on C++ standard and custom rules
    const rules = await this.ruleEngine.loadRules(options.cppStandard, options.customRules);
    
    for (const file of files) {
      try {
        const content = await this.fileSystemManager.readFileContent(file);
        const violations = await this.ruleEngine.analyzeFile(file, content, rules);
        
        report.codeQuality.issues.push(...violations);

      } catch (error) {
        report.codeQuality.issues.push({
          rule: 'analysis_error',
          file,
          line: 0,
          column: 0,
          severity: 'error',
          message: `Code quality analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Check file accessibility and format',
        });
      }
    }

    // Calculate code quality score
    const errorCount = report.codeQuality.issues.filter(i => i.severity === 'error').length;
    const warningCount = report.codeQuality.issues.filter(i => i.severity === 'warning').length;
    
    // Score calculation (0-100)
    const baseScore = 100;
    const errorPenalty = errorCount * 10;
    const warningPenalty = warningCount * 3;
    
    report.codeQuality.score = Math.max(0, baseScore - errorPenalty - warningPenalty);
    report.codeQuality.grade = this.calculateGrade(report.codeQuality.score);
  }

  /**
   * Perform modern C++ analysis
   */
  private async performModernCppAnalysis(
    files: string[],
    options: CppAnalysisOptions,
    report: CppAnalysisReport
  ): Promise<void> {
    if (!options.checkModernCpp) return;

    const modernFeatures = await this.cppAnalyzer.analyzeModernCppFeatures(files, options.cppStandard);
    
    report.modernCpp.features = modernFeatures.features;
    report.modernCpp.improvements = modernFeatures.improvements;
    
    // Calculate modern C++ score
    const totalFeatures = modernFeatures.features.length;
    const usedFeatures = modernFeatures.features.filter(f => f.used).length;
    
    report.modernCpp.score = totalFeatures > 0 ? Math.round((usedFeatures / totalFeatures) * 100) : 0;
  }

  /**
   * Perform performance analysis
   */
  private async performPerformanceAnalysis(
    files: string[],
    options: CppAnalysisOptions,
    report: CppAnalysisReport
  ): Promise<void> {
    if (!options.performanceAnalysis) return;

    for (const file of files) {
      try {
        const analysis = await this.cppAnalyzer.analyzePerformance(file);
        
        report.performance.hotspots.push(...analysis.hotspots);
        report.performance.optimizations.push(...analysis.optimizations);

      } catch (error) {
        // Log performance analysis errors
      }
    }

    // Calculate performance score
    const hotspotCount = report.performance.hotspots.length;
    const criticalHotspots = report.performance.hotspots.filter(h => h.severity === 'critical').length;
    
    report.performance.score = Math.max(0, 100 - (criticalHotspots * 20) - (hotspotCount * 5));
  }

  /**
   * Perform memory analysis
   */
  private async performMemoryAnalysis(
    files: string[],
    options: CppAnalysisOptions,
    report: CppAnalysisReport
  ): Promise<void> {
    if (!options.memoryAnalysis) return;

    for (const file of files) {
      try {
        const analysis = await this.cppAnalyzer.analyzeMemory(file);
        
        report.memory.issues.push(...analysis.issues);
        report.memory.recommendations.push(...analysis.recommendations);

      } catch (error) {
        // Log memory analysis errors
      }
    }

    // Calculate memory score
    const issueCount = report.memory.issues.length;
    const criticalIssues = report.memory.issues.filter(i => i.type === 'memory_leak').length;
    
    report.memory.score = Math.max(0, 100 - (criticalIssues * 25) - (issueCount * 5));
  }

  /**
   * Perform security analysis
   */
  private async performSecurityAnalysis(
    files: string[],
    options: CppAnalysisOptions,
    report: CppAnalysisReport
  ): Promise<void> {
    if (!options.securityAnalysis) return;

    for (const file of files) {
      try {
        const analysis = await this.cppAnalyzer.analyzeSecurity(file);
        
        report.security.vulnerabilities.push(...analysis.vulnerabilities);
        report.security.recommendations.push(...analysis.recommendations);

      } catch (error) {
        // Log security analysis errors
      }
    }

    // Calculate security score
    const vulnCount = report.security.vulnerabilities.length;
    const criticalVulns = report.security.vulnerabilities.filter(v => v.severity === 'critical').length;
    
    report.security.score = Math.max(0, 100 - (criticalVulns * 30) - (vulnCount * 10));
  }

  /**
   * Calculate complexity and maintainability metrics
   */
  private async calculateMetrics(
    files: string[],
    _options: CppAnalysisOptions,
    report: CppAnalysisReport
  ): Promise<void> {
    let totalComplexity = 0;
    let totalCognitive = 0;
    let totalVolume = 0;
    let totalDifficulty = 0;
    let totalEffort = 0;

    for (const file of files) {
      try {
        const metrics = await this.cppAnalyzer.calculateMetrics(file);
        
        totalComplexity += metrics.cyclomatic;
        totalCognitive += metrics.cognitive;
        totalVolume += metrics.halstead.volume;
        totalDifficulty += metrics.halstead.difficulty;
        totalEffort += metrics.halstead.effort;

      } catch (error) {
        // Log metrics calculation errors
      }
    }

    const fileCount = files.length;
    if (fileCount > 0) {
      report.metrics.complexity.cyclomatic = Math.round(totalComplexity / fileCount);
      report.metrics.complexity.cognitive = Math.round(totalCognitive / fileCount);
      report.metrics.complexity.halstead.volume = Math.round(totalVolume / fileCount);
      report.metrics.complexity.halstead.difficulty = Math.round(totalDifficulty / fileCount);
      report.metrics.complexity.halstead.effort = Math.round(totalEffort / fileCount);
    }

    // Calculate maintainability index
    const avgComplexity = report.metrics.complexity.cyclomatic;
    const avgVolume = report.metrics.complexity.halstead.volume;
    const avgLines = report.summary.codeLines / fileCount;
    
    // Simplified maintainability index calculation
    report.metrics.maintainability.index = Math.max(0, Math.min(100, 
      171 - 5.2 * Math.log(avgVolume) - 0.23 * avgComplexity - 16.2 * Math.log(avgLines)
    ));
    
    report.metrics.maintainability.rating = this.getMaintainabilityRating(report.metrics.maintainability.index);

    // Calculate testability score
    report.metrics.testability.score = this.calculateTestabilityScore(report);
  }

  /**
   * Generate final scores and overall assessment
   */
  private generateFinalScores(_report: CppAnalysisReport): void {
    // Overall scores are already calculated in individual analysis methods
    // This method can be used for any final adjustments or overall scoring
  }

  /**
   * Generate comprehensive recommendations
   */
  private generateRecommendations(report: CppAnalysisReport): string[] {
    const recommendations: string[] = [];

    // Code quality recommendations
    if (report.codeQuality.score < 70) {
      recommendations.push('🔧 **Code Quality**: Focus on fixing critical errors and warnings to improve code quality score');
    }

    // Modern C++ recommendations
    if (report.modernCpp.score < 50) {
      recommendations.push('⚡ **Modern C++**: Consider adopting more modern C++ features for better performance and maintainability');
    }

    // Performance recommendations
    if (report.performance.score < 80) {
      recommendations.push('🚀 **Performance**: Address performance hotspots to improve application speed');
    }

    // Memory recommendations
    if (report.memory.score < 85) {
      recommendations.push('🧠 **Memory**: Review memory management practices to prevent leaks and improve efficiency');
    }

    // Security recommendations
    if (report.security.score < 90) {
      recommendations.push('🔒 **Security**: Address security vulnerabilities to improve application safety');
    }

    // Complexity recommendations
    if (report.metrics.complexity.cyclomatic > 10) {
      recommendations.push('📊 **Complexity**: Consider refactoring complex functions to improve maintainability');
    }

    return recommendations;
  }

  /**
   * Create comprehensive C++ analysis response
   */
  private createCppAnalysisResponse(
    report: CppAnalysisReport,
    recommendations: string[],
    fileCount: number
  ): ToolExecutionResult {
    const content = [
      {
        type: 'text',
        text: `# 🔍 C++ Code Analysis Report

## 📊 Summary
- **Files Analyzed**: ${report.summary.filesAnalyzed}
- **Total Lines**: ${report.summary.totalLines.toLocaleString()}
- **Code Lines**: ${report.summary.codeLines.toLocaleString()}
- **Functions**: ${report.summary.functions}
- **Classes**: ${report.summary.classes}
- **Namespaces**: ${report.summary.namespaces}

## 🎯 Quality Scores
- **Code Quality**: ${report.codeQuality.score}/100 (${report.codeQuality.grade})
- **Modern C++**: ${report.modernCpp.score}/100
- **Performance**: ${report.performance.score}/100
- **Memory Safety**: ${report.memory.score}/100
- **Security**: ${report.security.score}/100
- **Maintainability**: ${Math.round(report.metrics.maintainability.index)}/100 (${report.metrics.maintainability.rating})

## 🔧 Key Issues
${report.codeQuality.issues.slice(0, 5).map(issue => 
  `- **${issue.file}:${issue.line}** - ${issue.message}`
).join('\n')}

## 💡 Recommendations
${recommendations.join('\n')}

## 📈 Metrics
- **Cyclomatic Complexity**: ${report.metrics.complexity.cyclomatic}
- **Cognitive Complexity**: ${report.metrics.complexity.cognitive}
- **Halstead Volume**: ${report.metrics.complexity.halstead.volume}
- **Testability Score**: ${report.metrics.testability.score}/100`,
      },
      {
        type: 'text',
        data: report,
      },
    ];

    return {
      content,
      metadata: {
        executionTime: 0, // Will be set by BaseTool
        performance: {
          analysisType: 'cpp_comprehensive',
          filesAnalyzed: fileCount,
          codeQualityScore: report.codeQuality.score,
          overallScore: Math.round((
            report.codeQuality.score +
            report.modernCpp.score +
            report.performance.score +
            report.memory.score +
            report.security.score
          ) / 5),
        },
      },
    };
  }

  /**
   * Calculate grade from score
   */
  private calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get maintainability rating
   */
  private getMaintainabilityRating(index: number): string {
    if (index >= 85) return 'Excellent';
    if (index >= 70) return 'Good';
    if (index >= 50) return 'Fair';
    if (index >= 25) return 'Poor';
    return 'Critical';
  }

  /**
   * Calculate testability score
   */
  private calculateTestabilityScore(report: CppAnalysisReport): number {
    // Simplified testability calculation based on complexity and coupling
    const complexityPenalty = Math.min(50, report.metrics.complexity.cyclomatic * 2);
    const couplingPenalty = Math.min(30, report.dependencies.includes.length);
    
    return Math.max(0, 100 - complexityPenalty - couplingPenalty);
  }
}
