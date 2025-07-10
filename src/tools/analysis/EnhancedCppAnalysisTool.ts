/**
 * Enhanced C++ Analysis Tool with Professional AST Support
 * 
 * Provides enterprise-grade C++ code analysis using Tree-sitter AST parsing,
 * comprehensive semantic analysis, CUDA support, and professional-grade
 * performance, memory, and security analysis.
 */

import { z } from 'zod';
import { extname } from 'path';
import { BaseTool, type ToolExecutionContext, type ToolExecutionResult } from '../BaseTool.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { FileSystemManager } from '../../utils/FileSystemManager.js';
import { EnhancedCppAnalyzer, type EnhancedCppAnalysisResult } from '../../analyzers/EnhancedCppAnalyzer.js';
import {
  AnalysisError,
  ErrorCode,
} from '../../errors/ErrorTypes.js';
import { logger } from '../../utils/logger.js';

/**
 * Enhanced C++ analysis options schema
 */
const EnhancedCppAnalysisSchema = z.object({
  path: z.string().describe('Path to C++ file or directory to analyze'),
  cppStandard: z.enum(['cpp11', 'cpp14', 'cpp17', 'cpp20', 'cpp23']).default('cpp17').describe('C++ standard to use for analysis'),
  
  // Analysis scope options
  includeHeaders: z.boolean().default(true).describe('Include header file analysis'),
  analyzeDependencies: z.boolean().default(true).describe('Analyze include dependencies and build dependency graph'),
  detectCircularDeps: z.boolean().default(true).describe('Detect circular dependencies'),
  
  // Feature analysis options
  modernCppAnalysis: z.boolean().default(true).describe('Analyze modern C++ features usage'),
  performanceAnalysis: z.boolean().default(true).describe('Perform comprehensive performance analysis'),
  memoryAnalysis: z.boolean().default(true).describe('Analyze memory management patterns'),
  securityAnalysis: z.boolean().default(true).describe('Perform security vulnerability analysis'),
  
  // Specialized analysis
  cudaAnalysis: z.boolean().default(false).describe('Enable CUDA/GPU code analysis'),
  templateAnalysis: z.boolean().default(true).describe('Analyze template usage and instantiation'),
  
  // Output options
  includeMetrics: z.boolean().default(true).describe('Include detailed code metrics'),
  includeRecommendations: z.boolean().default(true).describe('Include improvement recommendations'),
  verboseOutput: z.boolean().default(false).describe('Include verbose analysis details'),
  
  // Quality thresholds
  complexityThreshold: z.number().min(1).max(50).default(10).describe('Cyclomatic complexity threshold for warnings'),
  maintainabilityThreshold: z.number().min(0).max(100).default(70).describe('Maintainability index threshold'),
  
  // Custom rules
  customRules: z.array(z.string()).default([]).describe('Custom analysis rules to apply'),
  excludePatterns: z.array(z.string()).default([]).describe('File patterns to exclude from analysis'),
});

type EnhancedCppAnalysisOptions = z.infer<typeof EnhancedCppAnalysisSchema>;

/**
 * Enhanced analysis report interface
 */
interface EnhancedAnalysisReport {
  summary: {
    filesAnalyzed: number;
    totalLines: number;
    codeLines: number;
    commentLines: number;
    blankLines: number;
    overallScore: number;
    grade: string;
  };
  
  structure: {
    namespaces: number;
    classes: number;
    functions: number;
    templates: number;
    complexity: {
      average: number;
      maximum: number;
      distribution: { [key: string]: number };
    };
  };
  
  quality: {
    maintainabilityIndex: number;
    codeSmells: number;
    technicalDebt: string;
    recommendations: string[];
  };
  
  modernCpp: {
    score: number;
    featuresUsed: number;
    featuresAvailable: number;
    recommendations: string[];
  };
  
  performance: {
    score: number;
    hotspots: number;
    optimizations: string[];
  };
  
  memory: {
    score: number;
    issues: number;
    smartPointerUsage: number;
    raii: number;
  };
  
  security: {
    score: number;
    vulnerabilities: number;
    criticalIssues: number;
  };
  
  cuda?: {
    score: number;
    kernels: number;
    optimizations: string[];
  };
  
  dependencies: {
    totalIncludes: number;
    circularDependencies: number;
    dependencyDepth: number;
  };
}

/**
 * Enhanced C++ Analysis Tool
 */
export class EnhancedCppAnalysisTool extends BaseTool {
  public readonly name = 'analyze_cpp_enhanced';
  public readonly description = 'Professional-grade C++ code analysis with AST parsing, CUDA support, and comprehensive quality metrics';
  public readonly inputSchema = EnhancedCppAnalysisSchema;

  private fileSystemManager: FileSystemManager;
  private enhancedAnalyzer: EnhancedCppAnalyzer;

  constructor(configManager: ConfigManager) {
    super(configManager);
    this.fileSystemManager = new FileSystemManager();
    this.enhancedAnalyzer = new EnhancedCppAnalyzer();
  }

  /**
   * Execute enhanced C++ analysis
   */
  protected async executeInternal(
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    try {
      logger.info('Starting enhanced C++ analysis', { args, context: context.requestId });

      // Validate and parse arguments
      const validatedArgs = EnhancedCppAnalysisSchema.parse(args) as EnhancedCppAnalysisOptions;
      
      // Find C++ files to analyze
      const cppFiles = await this.findCppFiles(validatedArgs.path, validatedArgs.excludePatterns);
      
      if (cppFiles.length === 0) {
        return this.createResponse(
          '⚠️ No C++ files found to analyze.\n\nPlease check the path and ensure it contains .cpp, .cxx, .cc, .h, .hpp, or .hxx files.',
          [],
          { filesFound: 0, analysisSkipped: true }
        );
      }

      // Perform analysis on each file
      const analysisResults: EnhancedCppAnalysisResult[] = [];
      const analysisOptions = {
        cppStandard: validatedArgs.cppStandard,
        includeCuda: validatedArgs.cudaAnalysis,
        includePerformance: validatedArgs.performanceAnalysis,
        includeMemory: validatedArgs.memoryAnalysis,
        includeSecurity: validatedArgs.securityAnalysis,
      };

      for (const file of cppFiles) {
        try {
          logger.debug(`Analyzing file: ${file}`);
          const result = await this.enhancedAnalyzer.analyzeFile(file, analysisOptions);
          analysisResults.push(result);
        } catch (error) {
          logger.warn(`Failed to analyze file ${file}`, { error });
          // Continue with other files
        }
      }

      // Generate comprehensive report
      const report = this.generateComprehensiveReport(analysisResults, validatedArgs);
      
      // Format response based on verbosity
      const responseText = validatedArgs.verboseOutput 
        ? this.formatVerboseResponse(report, analysisResults, validatedArgs)
        : this.formatStandardResponse(report, validatedArgs);

      return this.createResponse(
        responseText,
        [],
        {
          filesAnalyzed: analysisResults.length,
          overallScore: report.summary.overallScore,
          grade: report.summary.grade,
          analysisTime: Date.now() - context.startTime.getTime(),
        }
      );

    } catch (error) {
      if (error instanceof AnalysisError) {
        return this.createErrorResponse(error, true);
      }
      
      throw new AnalysisError(
        `Enhanced C++ analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.ANALYSIS_FAILED,
        { additionalInfo: { args, context: context.requestId } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Find C++ files to analyze
   */
  private async findCppFiles(path: string, excludePatterns: string[]): Promise<string[]> {
    const cppExtensions = ['.cpp', '.cxx', '.cc', '.c', '.h', '.hpp', '.hxx', '.cu', '.cuh'];
    
    try {
      const exists = await this.fileSystemManager.fileExists(path);

      if (!exists) {
        return [];
      }

      // Check if it's a file
      try {
        const stats = await this.fileSystemManager.getFileStats(path);
        if (stats && cppExtensions.includes(extname(path).toLowerCase())) {
          return [path];
        }
      } catch {
        // Might be a directory, continue to directory handling
      }

      // Try to handle as directory
      try {
        const patterns = cppExtensions.map(ext => `**/*${ext}`);
        const files = await this.fileSystemManager.readFiles(patterns, path);

        return files
          .filter(file => !this.shouldExcludeFile(file.path, excludePatterns))
          .map(file => file.path);
      } catch (error) {
        logger.error(`Failed to read directory ${path}`, { error });
        return [];
      }
    } catch (error) {
      logger.error(`Failed to find C++ files in ${path}`, { error });
      return [];
    }
  }

  /**
   * Check if file should be excluded based on patterns
   */
  private shouldExcludeFile(filePath: string, excludePatterns: string[]): boolean {
    return excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    });
  }

  /**
   * Generate comprehensive analysis report
   */
  private generateComprehensiveReport(
    results: EnhancedCppAnalysisResult[],
    options: EnhancedCppAnalysisOptions
  ): EnhancedAnalysisReport {
    if (results.length === 0) {
      return this.createEmptyReport();
    }

    // Aggregate metrics from all files
    const totalLines = results.reduce((sum, r) => sum + r.metrics.totalLines, 0);
    const totalCodeLines = results.reduce((sum, r) => sum + r.metrics.codeLines, 0);
    const totalCommentLines = results.reduce((sum, r) => sum + r.metrics.commentLines, 0);
    const totalBlankLines = results.reduce((sum, r) => sum + r.metrics.blankLines, 0);
    
    // Calculate average scores
    const avgMaintainability = results.reduce((sum, r) => sum + r.metrics.complexity.maintainabilityIndex, 0) / results.length;
    const avgModernCppScore = results.reduce((sum, r) => sum + r.modernCpp.score, 0) / results.length;
    const avgPerformanceScore = results.reduce((sum, r) => sum + r.performance.score, 0) / results.length;
    const avgMemoryScore = results.reduce((sum, r) => sum + r.memory.score, 0) / results.length;
    const avgSecurityScore = results.reduce((sum, r) => sum + r.security.score, 0) / results.length;
    
    // Calculate overall score
    const overallScore = Math.round((avgMaintainability + avgModernCppScore + avgPerformanceScore + avgMemoryScore + avgSecurityScore) / 5);
    const grade = this.calculateGrade(overallScore);

    // Aggregate structural information
    const totalNamespaces = results.reduce((sum, r) => sum + r.structure.namespaces.length, 0);
    const totalClasses = results.reduce((sum, r) => sum + r.structure.classes.length, 0);
    const totalFunctions = results.reduce((sum, r) => sum + r.structure.functions.length, 0);
    const totalTemplates = results.reduce((sum, r) => sum + r.structure.templates.length, 0);

    // Calculate complexity metrics
    const complexities = results.flatMap(r => r.structure.functions.map(f => f.complexity));
    const avgComplexity = complexities.length > 0 ? complexities.reduce((sum, c) => sum + c, 0) / complexities.length : 0;
    const maxComplexity = complexities.length > 0 ? Math.max(...complexities) : 0;

    return {
      summary: {
        filesAnalyzed: results.length,
        totalLines,
        codeLines: totalCodeLines,
        commentLines: totalCommentLines,
        blankLines: totalBlankLines,
        overallScore,
        grade,
      },
      structure: {
        namespaces: totalNamespaces,
        classes: totalClasses,
        functions: totalFunctions,
        templates: totalTemplates,
        complexity: {
          average: Math.round(avgComplexity * 100) / 100,
          maximum: maxComplexity,
          distribution: this.calculateComplexityDistribution(complexities),
        },
      },
      quality: {
        maintainabilityIndex: Math.round(avgMaintainability),
        codeSmells: this.countCodeSmells(results),
        technicalDebt: this.estimateTechnicalDebt(results),
        recommendations: this.generateQualityRecommendations(results, options),
      },
      modernCpp: {
        score: Math.round(avgModernCppScore),
        featuresUsed: results.reduce((sum, r) => sum + r.modernCpp.featuresUsed.filter(f => f.used).length, 0),
        featuresAvailable: results.reduce((sum, r) => sum + r.modernCpp.featuresUsed.length, 0),
        recommendations: this.aggregateRecommendations(results.map(r => r.modernCpp.recommendations)),
      },
      performance: {
        score: Math.round(avgPerformanceScore),
        hotspots: results.reduce((sum, r) => sum + r.performance.hotspots.length, 0),
        optimizations: this.aggregateRecommendations(results.map(r => r.performance.optimizations.map(o => o.description))),
      },
      memory: {
        score: Math.round(avgMemoryScore),
        issues: results.reduce((sum, r) => sum + r.memory.issues.length, 0),
        smartPointerUsage: results.reduce((sum, r) => sum + r.memory.smartPointerUsage.uniquePtr + r.memory.smartPointerUsage.sharedPtr, 0),
        raii: Math.round(results.reduce((sum, r) => sum + r.memory.raii.score, 0) / results.length),
      },
      security: {
        score: Math.round(avgSecurityScore),
        vulnerabilities: results.reduce((sum, r) => sum + r.security.vulnerabilities.length, 0),
        criticalIssues: results.reduce((sum, r) => sum + r.security.vulnerabilities.filter(v => v.severity === 'critical').length, 0),
      },
      dependencies: {
        totalIncludes: results.reduce((sum, r) => sum + r.dependencies.systemIncludes.length + r.dependencies.userIncludes.length, 0),
        circularDependencies: results.reduce((sum, r) => sum + r.dependencies.circularDependencies.length, 0),
        dependencyDepth: Math.max(...results.map(r => Math.max(...r.dependencies.dependencyGraph.map(d => d.depth), 0))),
      },
    };
  }

  /**
   * Calculate grade based on overall score
   */
  private calculateGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Create empty report for no results
   */
  private createEmptyReport(): EnhancedAnalysisReport {
    return {
      summary: { filesAnalyzed: 0, totalLines: 0, codeLines: 0, commentLines: 0, blankLines: 0, overallScore: 0, grade: 'N/A' },
      structure: { namespaces: 0, classes: 0, functions: 0, templates: 0, complexity: { average: 0, maximum: 0, distribution: {} } },
      quality: { maintainabilityIndex: 0, codeSmells: 0, technicalDebt: 'Unknown', recommendations: [] },
      modernCpp: { score: 0, featuresUsed: 0, featuresAvailable: 0, recommendations: [] },
      performance: { score: 0, hotspots: 0, optimizations: [] },
      memory: { score: 0, issues: 0, smartPointerUsage: 0, raii: 0 },
      security: { score: 0, vulnerabilities: 0, criticalIssues: 0 },
      dependencies: { totalIncludes: 0, circularDependencies: 0, dependencyDepth: 0 },
    };
  }

  // Helper methods for report generation
  private calculateComplexityDistribution(complexities: number[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {
      'Low (1-5)': 0,
      'Medium (6-10)': 0,
      'High (11-20)': 0,
      'Very High (21+)': 0,
    };

    complexities.forEach(complexity => {
      if (complexity <= 5) distribution['Low (1-5)'] = (distribution['Low (1-5)'] || 0) + 1;
      else if (complexity <= 10) distribution['Medium (6-10)'] = (distribution['Medium (6-10)'] || 0) + 1;
      else if (complexity <= 20) distribution['High (11-20)'] = (distribution['High (11-20)'] || 0) + 1;
      else distribution['Very High (21+)'] = (distribution['Very High (21+)'] || 0) + 1;
    });

    return distribution;
  }

  private countCodeSmells(results: EnhancedCppAnalysisResult[]): number {
    // Count various code smells across all results
    return results.reduce((sum, r) => {
      return sum +
        (r.memory?.issues?.length || 0) +
        (r.security?.vulnerabilities?.length || 0) +
        (r.performance?.hotspots?.length || 0);
    }, 0);
  }

  private estimateTechnicalDebt(results: EnhancedCppAnalysisResult[]): string {
    const totalIssues = this.countCodeSmells(results);
    const totalLines = results.reduce((sum, r) => sum + r.metrics.codeLines, 0);
    
    if (totalLines === 0) return 'Unknown';
    
    const debtRatio = totalIssues / totalLines * 1000; // Issues per 1000 lines
    
    if (debtRatio < 5) return 'Low';
    if (debtRatio < 15) return 'Medium';
    if (debtRatio < 30) return 'High';
    return 'Very High';
  }

  private generateQualityRecommendations(results: EnhancedCppAnalysisResult[], options: EnhancedCppAnalysisOptions): string[] {
    const recommendations: string[] = [];
    
    // Add recommendations based on analysis results
    const avgComplexity = results.reduce((sum, r) => {
      const complexities = r.structure.functions.map(f => f.complexity);
      return sum + (complexities.length > 0 ? complexities.reduce((s, c) => s + c, 0) / complexities.length : 0);
    }, 0) / results.length;

    if (avgComplexity > options.complexityThreshold) {
      recommendations.push(`Consider refactoring functions with high cyclomatic complexity (average: ${avgComplexity.toFixed(1)})`);
    }

    const avgMaintainability = results.reduce((sum, r) => sum + r.metrics.complexity.maintainabilityIndex, 0) / results.length;
    if (avgMaintainability < options.maintainabilityThreshold) {
      recommendations.push(`Improve maintainability index (current: ${avgMaintainability.toFixed(1)}, target: ${options.maintainabilityThreshold})`);
    }

    return recommendations;
  }

  private aggregateRecommendations(recommendationArrays: string[][]): string[] {
    const uniqueRecommendations = new Set<string>();
    recommendationArrays.forEach(recommendations => {
      recommendations.forEach(rec => uniqueRecommendations.add(rec));
    });
    return Array.from(uniqueRecommendations);
  }

  /**
   * Format standard response
   */
  private formatStandardResponse(report: EnhancedAnalysisReport, options: EnhancedCppAnalysisOptions): string {
    return `# 🔍 Enhanced C++ Analysis Report

## 📊 Summary
- **Files Analyzed**: ${report.summary.filesAnalyzed}
- **Total Lines**: ${report.summary.totalLines.toLocaleString()} (${report.summary.codeLines.toLocaleString()} code, ${report.summary.commentLines.toLocaleString()} comments)
- **Overall Score**: ${report.summary.overallScore}/100 (Grade: ${report.summary.grade})
- **C++ Standard**: ${options.cppStandard}

## 🏗️ Code Structure
- **Namespaces**: ${report.structure.namespaces}
- **Classes**: ${report.structure.classes}
- **Functions**: ${report.structure.functions}
- **Templates**: ${report.structure.templates}
- **Average Complexity**: ${report.structure.complexity.average}
- **Maximum Complexity**: ${report.structure.complexity.maximum}

## 📈 Quality Metrics
- **Maintainability Index**: ${report.quality.maintainabilityIndex}/100
- **Code Smells**: ${report.quality.codeSmells}
- **Technical Debt**: ${report.quality.technicalDebt}

## 🚀 Modern C++ (${options.cppStandard})
- **Score**: ${report.modernCpp.score}/100
- **Features Used**: ${report.modernCpp.featuresUsed}/${report.modernCpp.featuresAvailable}

## ⚡ Performance Analysis
- **Score**: ${report.performance.score}/100
- **Hotspots Found**: ${report.performance.hotspots}

## 🧠 Memory Management
- **Score**: ${report.memory.score}/100
- **Memory Issues**: ${report.memory.issues}
- **Smart Pointer Usage**: ${report.memory.smartPointerUsage}
- **RAII Score**: ${report.memory.raii}/100

## 🛡️ Security Analysis
- **Score**: ${report.security.score}/100
- **Vulnerabilities**: ${report.security.vulnerabilities}
- **Critical Issues**: ${report.security.criticalIssues}

## 📦 Dependencies
- **Total Includes**: ${report.dependencies.totalIncludes}
- **Circular Dependencies**: ${report.dependencies.circularDependencies}
- **Max Dependency Depth**: ${report.dependencies.dependencyDepth}

${report.quality.recommendations.length > 0 ? `
## 💡 Recommendations
${report.quality.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}

${report.modernCpp.recommendations.length > 0 ? `
## 🔧 Modern C++ Improvements
${report.modernCpp.recommendations.slice(0, 5).map(rec => `- ${rec}`).join('\n')}
` : ''}

${report.performance.optimizations.length > 0 ? `
## ⚡ Performance Optimizations
${report.performance.optimizations.slice(0, 5).map(opt => `- ${opt}`).join('\n')}
` : ''}

---
*Analysis completed using Enhanced C++ Analyzer with Tree-sitter AST parsing*`;
  }

  /**
   * Format verbose response (placeholder)
   */
  private formatVerboseResponse(
    report: EnhancedAnalysisReport,
    _results: EnhancedCppAnalysisResult[],
    options: EnhancedCppAnalysisOptions
  ): string {
    // This would include detailed per-file analysis, full recommendation lists, etc.
    return this.formatStandardResponse(report, options) + '\n\n*Verbose output not yet implemented*';
  }
}
