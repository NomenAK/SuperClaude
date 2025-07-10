import { z } from 'zod';
import type { SuperAugmentTool } from '../ToolManager.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { FileSystemManager, type FileInfo } from '../../utils/FileSystemManager.js';
import { logger } from '../../utils/logger.js';

const AnalyzeCodeInputSchema = z.object({
  files: z.array(z.string()).optional().describe('Array of file paths or glob patterns to analyze'),
  code: z.string().optional().describe('Code content to analyze directly'),
  projectPath: z.string().optional().describe('Project root path (defaults to current directory)'),
  persona: z.string().optional().describe('Cognitive persona to use for analysis'),
  depth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed').describe('Analysis depth'),
  focus: z.array(z.string()).optional().describe('Specific areas to focus on (e.g., performance, security, maintainability)'),
  language: z.string().optional().describe('Programming language (auto-detected if not specified)'),
  includeMetrics: z.boolean().default(true).describe('Include code metrics in analysis'),
});

type AnalyzeCodeInput = z.infer<typeof AnalyzeCodeInputSchema>;

/**
 * Code analysis tool with cognitive persona support
 */
export class AnalyzeCodeTool implements SuperAugmentTool {
  name = 'analyze_code';
  description = 'Analyze code files or direct code content for quality, patterns, issues, and improvements with cognitive persona support';
  inputSchema = AnalyzeCodeInputSchema;

  private fileSystemManager: FileSystemManager;

  constructor(private configManager: ConfigManager) {
    this.fileSystemManager = new FileSystemManager();
  }

  async execute(args: AnalyzeCodeInput): Promise<any> {
    try {
      logger.info('Starting code analysis', { args });

      // Validate input
      const validatedArgs = AnalyzeCodeInputSchema.parse(args);

      // Get persona if specified
      const persona = validatedArgs.persona
        ? this.configManager.getPersona(validatedArgs.persona)
        : null;

      // Get code to analyze
      const codeData = await this.getCodeToAnalyze(validatedArgs);

      // Perform analysis based on persona and parameters
      const analysis = await this.performAnalysis(validatedArgs, codeData, persona);

      return {
        content: [
          {
            type: 'text',
            text: this.formatAnalysisResult(analysis, persona),
          },
        ],
      };
    } catch (error) {
      logger.error('Code analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get code to analyze from files or direct input
   */
  private async getCodeToAnalyze(args: AnalyzeCodeInput): Promise<{
    files: FileInfo[];
    directCode?: string;
    projectStructure?: any;
  }> {
    const result: { files: FileInfo[]; directCode?: string; projectStructure?: any } = {
      files: [],
    };

    // If direct code is provided, use it
    if (args.code) {
      result.directCode = args.code;
      return result;
    }

    // If files are specified, read them
    if (args.files && args.files.length > 0) {
      const rootPath = args.projectPath || process.cwd();
      result.files = await this.fileSystemManager.readFiles(args.files, rootPath);

      // Also get project structure for context
      if (args.depth === 'comprehensive') {
        try {
          result.projectStructure = await this.fileSystemManager.analyzeProjectStructure(rootPath);
        } catch (error) {
          logger.warn('Failed to analyze project structure:', error);
        }
      }
    } else {
      // No files specified, analyze current project
      const rootPath = args.projectPath || process.cwd();
      const defaultPatterns = ['**/*.{js,ts,jsx,tsx,vue,py,java,go,rs}'];
      result.files = await this.fileSystemManager.readFiles(defaultPatterns, rootPath);

      if (args.depth === 'comprehensive') {
        try {
          result.projectStructure = await this.fileSystemManager.analyzeProjectStructure(rootPath);
        } catch (error) {
          logger.warn('Failed to analyze project structure:', error);
        }
      }
    }

    return result;
  }

  private async performAnalysis(args: AnalyzeCodeInput, codeData: any, persona: any): Promise<any> {
    const analysis = {
      summary: '',
      issues: [] as any[],
      suggestions: [] as any[],
      metrics: {} as Record<string, any>,
      files_analyzed: [] as any[],
      project_info: null as any,
      persona_insights: null as any,
    };

    // Analyze direct code
    if (codeData.directCode) {
      analysis.summary = `Analyzing ${codeData.directCode.length} characters of direct code input`;
      analysis.issues = this.detectIssues(codeData.directCode, args.focus);
      analysis.suggestions = this.generateSuggestions(codeData.directCode, args.depth);
      if (args.includeMetrics) {
        analysis.metrics = this.calculateMetrics(codeData.directCode);
      }
    }

    // Analyze files
    if (codeData.files && codeData.files.length > 0) {
      analysis.summary = `Analyzing ${codeData.files.length} files`;

      for (const file of codeData.files) {
        if (file.content) {
          const fileAnalysis = {
            file: file.relativePath,
            size: file.size,
            language: this.detectLanguage(file.extension, file.content),
            issues: this.detectIssues(file.content, args.focus),
            metrics: args.includeMetrics ? this.calculateMetrics(file.content) : null,
          };

          analysis.files_analyzed.push(fileAnalysis);
          analysis.issues.push(...fileAnalysis.issues.map((issue: any) => ({
            ...issue,
            file: file.relativePath,
          })));
        }
      }

      // Generate overall suggestions
      const allCode = codeData.files.map((f: FileInfo) => f.content || '').join('\n');
      analysis.suggestions = this.generateSuggestions(allCode, args.depth);

      if (args.includeMetrics) {
        analysis.metrics = this.calculateOverallMetrics(codeData.files);
      }
    }

    // Add project structure info
    if (codeData.projectStructure) {
      analysis.project_info = {
        framework: codeData.projectStructure.framework,
        language: codeData.projectStructure.language,
        total_files: codeData.projectStructure.files.length,
        directories: codeData.projectStructure.directories.length,
        has_package_json: !!codeData.projectStructure.packageJson,
      };
    }

    // Apply persona-specific insights
    if (persona) {
      analysis.persona_insights = this.applyPersonaInsights(analysis, persona);
    }

    return analysis;
  }

  private detectIssues(code: string, focus?: string[]): any[] {
    const issues = [];

    // Basic issue detection
    if (code.includes('console.log')) {
      issues.push({
        type: 'code_quality',
        severity: 'warning',
        message: 'Console.log statements found - consider using proper logging',
        line: 1,
      });
    }

    if (code.includes('var ')) {
      issues.push({
        type: 'modernization',
        severity: 'info',
        message: 'Consider using let/const instead of var',
        line: 1,
      });
    }

    // Focus-specific analysis
    if (focus?.includes('security')) {
      if (code.includes('eval(')) {
        issues.push({
          type: 'security',
          severity: 'error',
          message: 'Use of eval() is dangerous and should be avoided',
          line: 1,
        });
      }
    }

    return issues;
  }

  private generateSuggestions(_code: string, depth: string): any[] {
    const suggestions = [];

    if (depth === 'comprehensive') {
      suggestions.push({
        category: 'performance',
        suggestion: 'Consider implementing code splitting for better performance',
        impact: 'medium',
      });

      suggestions.push({
        category: 'maintainability',
        suggestion: 'Add TypeScript for better type safety',
        impact: 'high',
      });
    }

    return suggestions;
  }

  private calculateMetrics(code: string): Record<string, any> {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#');
    });

    // Simple complexity estimation
    const complexityIndicators = [
      'if', 'else', 'for', 'while', 'switch', 'case', 'try', 'catch', 'finally'
    ];
    let complexityScore = 0;
    for (const indicator of complexityIndicators) {
      const regex = new RegExp(`\\b${indicator}\\b`, 'g');
      const matches = code.match(regex);
      complexityScore += matches ? matches.length : 0;
    }

    const complexity = complexityScore < 10 ? 'low' : complexityScore < 25 ? 'medium' : 'high';
    const commentRatio = commentLines.length / nonEmptyLines.length;
    const maintainabilityIndex = Math.max(0, Math.min(100, 100 - complexityScore + (commentRatio * 20)));

    return {
      total_lines: lines.length,
      lines_of_code: nonEmptyLines.length,
      comment_lines: commentLines.length,
      comment_ratio: Math.round(commentRatio * 100) / 100,
      complexity_score: complexityScore,
      complexity_level: complexity,
      maintainability_index: Math.round(maintainabilityIndex),
      estimated_functions: (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(|def\s+\w+/g) || []).length,
    };
  }

  private calculateOverallMetrics(files: FileInfo[]): Record<string, any> {
    let totalLines = 0;
    let totalLoc = 0;
    let totalComplexity = 0;
    let totalFunctions = 0;

    for (const file of files) {
      if (file.content) {
        const metrics = this.calculateMetrics(file.content);
        totalLines += metrics['total_lines'];
        totalLoc += metrics['lines_of_code'];
        totalComplexity += metrics['complexity_score'];
        totalFunctions += metrics['estimated_functions'];
      }
    }

    return {
      total_files: files.length,
      total_lines: totalLines,
      total_lines_of_code: totalLoc,
      average_file_size: Math.round(totalLoc / files.length),
      total_complexity_score: totalComplexity,
      average_complexity: Math.round(totalComplexity / files.length),
      total_functions: totalFunctions,
      functions_per_file: Math.round(totalFunctions / files.length),
    };
  }

  private detectLanguage(extension: string, _content: string): string {
    const langMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'JavaScript (React)',
      '.tsx': 'TypeScript (React)',
      '.vue': 'Vue.js',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.cpp': 'C++',
      '.c': 'C',
    };

    const detected = langMap[extension];
    if (detected) return detected;

    return 'Unknown';
  }

  private applyPersonaInsights(_analysis: any, persona: any): any {
    const insights = {
      persona_name: persona.name,
      specialized_focus: persona.expertise,
      recommendations: [] as string[],
    };

    // Apply persona-specific analysis
    switch (persona.name) {
      case 'architect':
        insights.recommendations.push('Consider the overall system architecture and scalability');
        insights.recommendations.push('Evaluate design patterns and architectural principles');
        break;
      case 'security':
        insights.recommendations.push('Perform thorough security vulnerability assessment');
        insights.recommendations.push('Review authentication and authorization mechanisms');
        break;
      case 'performance':
        insights.recommendations.push('Analyze performance bottlenecks and optimization opportunities');
        insights.recommendations.push('Consider caching strategies and resource utilization');
        break;
      default:
        insights.recommendations.push(`Apply ${persona.name} expertise to the analysis`);
    }

    return insights;
  }

  private formatAnalysisResult(analysis: any, persona: any): string {
    let result = '# Code Analysis Report\n\n';

    if (persona) {
      result += `**Persona**: ${persona.name} (${persona.description})\n\n`;
    }

    result += `## Summary\n${analysis.summary}\n\n`;

    // Project information
    if (analysis.project_info) {
      result += '## Project Information\n';
      if (analysis.project_info.framework) {
        result += `- **Framework**: ${analysis.project_info.framework}\n`;
      }
      if (analysis.project_info.language) {
        result += `- **Primary Language**: ${analysis.project_info.language}\n`;
      }
      result += `- **Total Files**: ${analysis.project_info.total_files}\n`;
      result += `- **Directories**: ${analysis.project_info.directories}\n`;
      result += `- **Has package.json**: ${analysis.project_info.has_package_json ? 'Yes' : 'No'}\n\n`;
    }

    // File analysis summary
    if (analysis.files_analyzed.length > 0) {
      result += '## Files Analyzed\n';
      analysis.files_analyzed.forEach((file: any) => {
        result += `- **${file.file}** (${file.language}, ${file.size} bytes)\n`;
        if (file.issues.length > 0) {
          result += `  - Issues: ${file.issues.length}\n`;
        }
      });
      result += '\n';
    }

    // Issues
    if (analysis.issues.length > 0) {
      result += '## Issues Found\n';
      const issuesByFile: Record<string, any[]> = {};

      analysis.issues.forEach((issue: any) => {
        const file = issue.file || 'Direct Code';
        if (!issuesByFile[file]) {
          issuesByFile[file] = [];
        }
        issuesByFile[file].push(issue);
      });

      Object.entries(issuesByFile).forEach(([file, issues]) => {
        result += `### ${file}\n`;
        issues.forEach((issue: any, index: number) => {
          result += `${index + 1}. **${issue.type}** (${issue.severity}): ${issue.message}\n`;
          if (issue.line) {
            result += `   Line: ${issue.line}\n`;
          }
        });
        result += '\n';
      });
    }

    // Suggestions
    if (analysis.suggestions.length > 0) {
      result += '## Suggestions\n';
      analysis.suggestions.forEach((suggestion: any, index: number) => {
        result += `${index + 1}. **${suggestion.category}**: ${suggestion.suggestion}`;
        if (suggestion.impact) {
          result += ` (Impact: ${suggestion.impact})`;
        }
        result += '\n';
      });
      result += '\n';
    }

    // Metrics
    if (Object.keys(analysis.metrics).length > 0) {
      result += '## Code Metrics\n';
      Object.entries(analysis.metrics).forEach(([key, value]) => {
        result += `- **${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}**: ${value}\n`;
      });
      result += '\n';
    }

    // Persona insights
    if (analysis.persona_insights) {
      result += '## Persona Insights\n';
      result += `**${analysis.persona_insights.persona_name} Perspective:**\n\n`;
      analysis.persona_insights.recommendations.forEach((rec: string, index: number) => {
        result += `${index + 1}. ${rec}\n`;
      });
    }

    return result;
  }
}
