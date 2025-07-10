import { z } from 'zod';
import type { SuperAugmentTool } from '../ToolManager.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { FileSystemManager, type FileInfo } from '../../utils/FileSystemManager.js';
import { logger } from '../../utils/logger.js';

const ReviewCodeInputSchema = z.object({
  pullRequest: z.number().optional().describe('Pull request number to review'),
  files: z.array(z.string()).optional().describe('Specific files to review (supports glob patterns)'),
  diff: z.string().optional().describe('Code diff to review'),
  projectPath: z.string().optional().describe('Project root path (defaults to current directory)'),
  persona: z.string().optional().describe('Cognitive persona for review approach'),
  criteria: z.array(z.string()).optional().describe('Review criteria (e.g., security, performance, style)'),
  severity: z.enum(['low', 'medium', 'high', 'all']).default('all').describe('Minimum severity level to report'),
  includeMetrics: z.boolean().default(true).describe('Include code quality metrics'),
  maxFiles: z.number().default(50).describe('Maximum number of files to review'),
});

type ReviewCodeInput = z.infer<typeof ReviewCodeInputSchema>;

/**
 * Code review tool with cognitive persona support
 */
export class ReviewCodeTool implements SuperAugmentTool {
  name = 'review_code';
  description = 'Perform comprehensive code reviews with real file analysis and cognitive persona expertise';
  inputSchema = ReviewCodeInputSchema;

  private fileSystemManager: FileSystemManager;

  constructor(private configManager: ConfigManager) {
    this.fileSystemManager = new FileSystemManager();
  }

  async execute(args: ReviewCodeInput): Promise<any> {
    try {
      logger.info('Starting code review', { args });

      const validatedArgs = ReviewCodeInputSchema.parse(args);
      const persona = validatedArgs.persona
        ? this.configManager.getPersona(validatedArgs.persona)
        : null;

      // Get files to review
      const filesToReview = await this.getFilesToReview(validatedArgs);

      // Perform comprehensive review
      const review = await this.performReview(validatedArgs, filesToReview, persona);

      return {
        content: [
          {
            type: 'text',
            text: this.formatReviewResult(review, persona),
          },
        ],
      };
    } catch (error) {
      logger.error('Code review failed:', error);
      throw error;
    }
  }

  /**
   * Get files to review based on input parameters
   */
  private async getFilesToReview(args: ReviewCodeInput): Promise<FileInfo[]> {
    const projectPath = args.projectPath || process.cwd();

    if (args.files && args.files.length > 0) {
      // Review specific files
      const files = await this.fileSystemManager.readFiles(args.files, projectPath);
      return files.slice(0, args.maxFiles);
    } else {
      // Review common code files
      const defaultPatterns = [
        '**/*.{js,ts,jsx,tsx,vue,py,java,go,rs,cpp,c,h}',
        '!node_modules/**',
        '!dist/**',
        '!build/**',
        '!coverage/**'
      ];
      const files = await this.fileSystemManager.readFiles(defaultPatterns, projectPath);
      return files.slice(0, args.maxFiles);
    }
  }

  private async performReview(args: ReviewCodeInput, files: FileInfo[], persona: any): Promise<any> {
    const review = {
      summary: '',
      files_reviewed: files.length,
      total_lines: 0,
      findings: [] as any[],
      recommendations: [] as string[],
      quality_metrics: {} as any,
      persona_insights: null as any,
    };

    let totalLines = 0;
    const allFindings: any[] = [];

    // Review each file
    for (const file of files) {
      if (!file.content) continue;

      const lines = file.content.split('\n');
      totalLines += lines.length;

      // Perform various code quality checks
      const fileFindings = [
        ...this.checkCodeQuality(file, lines, args.criteria),
        ...this.checkBestPractices(file, lines),
        ...this.checkSecurity(file, lines),
        ...this.checkPerformance(file, lines),
        ...this.checkMaintainability(file, lines),
      ];

      // Filter by severity
      const filteredFindings = fileFindings.filter(finding =>
        args.severity === 'all' || this.getSeverityLevel(finding.severity) >= this.getSeverityLevel(args.severity)
      );

      allFindings.push(...filteredFindings);
    }

    review.total_lines = totalLines;
    review.findings = allFindings;
    review.summary = `Reviewed ${files.length} files (${totalLines} lines). Found ${allFindings.length} issues.`;

    // Generate recommendations
    review.recommendations = this.generateRecommendations(allFindings, files, persona);

    // Calculate quality metrics
    if (args.includeMetrics) {
      review.quality_metrics = this.calculateQualityMetrics(files, allFindings);
    }

    // Apply persona insights
    if (persona) {
      review.persona_insights = this.applyPersonaInsights(allFindings, persona);
    }

    return review;
  }

  private formatReviewResult(review: any, persona: any): string {
    let result = '# Code Review Report\n\n';
    
    if (persona) {
      result += `**Reviewer Persona**: ${persona.name}\n\n`;
    }

    result += `## Summary\n${review.summary}\n\n`;

    if (review.findings.length > 0) {
      result += '## Findings\n';
      review.findings.forEach((finding: any, index: number) => {
        result += `${index + 1}. **${finding.type}** (${finding.severity}): ${finding.message}\n`;
        if (finding.file) result += `   File: ${finding.file}:${finding.line}\n`;
      });
      result += '\n';
    }

    if (review.recommendations.length > 0) {
      result += '## Recommendations\n';
      review.recommendations.forEach((rec: string, index: number) => {
        result += `${index + 1}. ${rec}\n`;
      });
    }

    return result;
  }

  /**
   * Check code quality issues
   */
  private checkCodeQuality(file: FileInfo, lines: string[], criteria?: string[]): any[] {
    const findings: any[] = [];
    const focusOnQuality = !criteria || criteria.includes('quality') || criteria.includes('style');

    if (!focusOnQuality) return findings;

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Check for console.log statements
      if (trimmed.includes('console.log') || trimmed.includes('console.debug')) {
        findings.push({
          type: 'code_quality',
          severity: 'low',
          message: 'Remove console.log statements before production',
          file: file.relativePath,
          line: lineNum,
          suggestion: 'Use proper logging library or remove debug statements',
        });
      }

      // Check for TODO/FIXME comments
      if (trimmed.includes('TODO') || trimmed.includes('FIXME') || trimmed.includes('HACK')) {
        findings.push({
          type: 'code_quality',
          severity: 'low',
          message: 'Unresolved TODO/FIXME comment',
          file: file.relativePath,
          line: lineNum,
          suggestion: 'Address the TODO item or create a proper issue',
        });
      }

      // Check for long lines
      if (line.length > 120) {
        findings.push({
          type: 'code_quality',
          severity: 'low',
          message: 'Line too long (>120 characters)',
          file: file.relativePath,
          line: lineNum,
          suggestion: 'Break long lines for better readability',
        });
      }

      // Check for var usage in JavaScript/TypeScript
      if ((file.extension === '.js' || file.extension === '.ts') && trimmed.startsWith('var ')) {
        findings.push({
          type: 'code_quality',
          severity: 'medium',
          message: 'Use let or const instead of var',
          file: file.relativePath,
          line: lineNum,
          suggestion: 'Replace var with let or const for better scoping',
        });
      }
    });

    return findings;
  }

  /**
   * Check best practices
   */
  private checkBestPractices(file: FileInfo, lines: string[]): any[] {
    const findings: any[] = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Check for missing error handling
      if (trimmed.includes('JSON.parse(') && !this.hasErrorHandling(lines, index)) {
        findings.push({
          type: 'best_practice',
          severity: 'medium',
          message: 'JSON.parse should be wrapped in try-catch',
          file: file.relativePath,
          line: lineNum,
          suggestion: 'Add error handling for JSON parsing',
        });
      }

      // Check for hardcoded URLs
      if (trimmed.match(/https?:\/\/[^\s'"]+/)) {
        findings.push({
          type: 'best_practice',
          severity: 'low',
          message: 'Hardcoded URL found',
          file: file.relativePath,
          line: lineNum,
          suggestion: 'Move URLs to configuration',
        });
      }

      // Check for magic numbers
      const magicNumberMatch = trimmed.match(/\b(\d{2,})\b/);
      if (magicNumberMatch && magicNumberMatch[1] && !trimmed.includes('//') && !trimmed.includes('const')) {
        const number = parseInt(magicNumberMatch[1]);
        if (number > 10 && number !== 100 && number !== 1000) {
          findings.push({
            type: 'best_practice',
            severity: 'low',
            message: `Magic number ${number} should be a named constant`,
            file: file.relativePath,
            line: lineNum,
            suggestion: 'Replace magic numbers with named constants',
          });
        }
      }
    });

    return findings;
  }

  /**
   * Check security issues
   */
  private checkSecurity(file: FileInfo, lines: string[]): any[] {
    const findings: any[] = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Check for eval usage
      if (trimmed.includes('eval(')) {
        findings.push({
          type: 'security',
          severity: 'high',
          message: 'Use of eval() is dangerous',
          file: file.relativePath,
          line: lineNum,
          suggestion: 'Avoid eval() - use safer alternatives',
        });
      }

      // Check for innerHTML usage
      if (trimmed.includes('.innerHTML')) {
        findings.push({
          type: 'security',
          severity: 'medium',
          message: 'innerHTML usage may lead to XSS',
          file: file.relativePath,
          line: lineNum,
          suggestion: 'Use textContent or sanitize HTML content',
        });
      }

      // Check for hardcoded passwords/keys
      const sensitivePatterns = [
        /password\s*[:=]\s*['"][^'"]+['"]/i,
        /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
        /secret\s*[:=]\s*['"][^'"]+['"]/i,
        /token\s*[:=]\s*['"][^'"]+['"]/i,
      ];

      sensitivePatterns.forEach(pattern => {
        if (pattern.test(trimmed)) {
          findings.push({
            type: 'security',
            severity: 'high',
            message: 'Hardcoded sensitive information detected',
            file: file.relativePath,
            line: lineNum,
            suggestion: 'Move sensitive data to environment variables',
          });
        }
      });
    });

    return findings;
  }

  /**
   * Check performance issues
   */
  private checkPerformance(file: FileInfo, lines: string[]): any[] {
    const findings: any[] = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Check for inefficient loops
      if (trimmed.includes('for (') && trimmed.includes('.length')) {
        findings.push({
          type: 'performance',
          severity: 'low',
          message: 'Consider caching array length in loops',
          file: file.relativePath,
          line: lineNum,
          suggestion: 'Cache array.length to avoid repeated property access',
        });
      }

      // Check for synchronous file operations
      if (trimmed.includes('readFileSync') || trimmed.includes('writeFileSync')) {
        findings.push({
          type: 'performance',
          severity: 'medium',
          message: 'Synchronous file operation blocks event loop',
          file: file.relativePath,
          line: lineNum,
          suggestion: 'Use asynchronous file operations',
        });
      }
    });

    return findings;
  }

  /**
   * Check maintainability issues
   */
  private checkMaintainability(file: FileInfo, lines: string[]): any[] {
    const findings: any[] = [];

    // Check function length
    let currentFunction: string | null = null;
    let functionStartLine = 0;
    let braceCount = 0;

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Simple function detection
      if (trimmed.match(/function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/)) {
        currentFunction = trimmed;
        functionStartLine = lineNum;
        braceCount = 0;
      }

      if (currentFunction) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0 && lineNum > functionStartLine) {
          const functionLength = lineNum - functionStartLine;
          if (functionLength > 50) {
            findings.push({
              type: 'maintainability',
              severity: 'medium',
              message: `Function is too long (${functionLength} lines)`,
              file: file.relativePath,
              line: functionStartLine,
              suggestion: 'Break down large functions into smaller ones',
            });
          }
          currentFunction = null;
        }
      }
    });

    return findings;
  }

  /**
   * Check if error handling exists around a line
   */
  private hasErrorHandling(lines: string[], lineIndex: number): boolean {
    const start = Math.max(0, lineIndex - 5);
    const end = Math.min(lines.length, lineIndex + 5);

    for (let i = start; i < end; i++) {
      const line = lines[i];
      if (line && (line.includes('try') || line.includes('catch'))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get severity level as number for comparison
   */
  private getSeverityLevel(severity: string): number {
    switch (severity) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 0;
    }
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(findings: any[], _files: FileInfo[], persona: any): string[] {
    const recommendations: string[] = [];

    // Count findings by type
    const findingsByType = findings.reduce((acc, finding) => {
      acc[finding.type] = (acc[finding.type] || 0) + 1;
      return acc;
    }, {});

    // Generate general recommendations
    if (findingsByType['security'] > 0) {
      recommendations.push('Address security vulnerabilities immediately');
      recommendations.push('Consider implementing security linting rules');
    }

    if (findingsByType['performance'] > 0) {
      recommendations.push('Optimize performance bottlenecks');
      recommendations.push('Consider performance testing');
    }

    if (findingsByType['maintainability'] > 0) {
      recommendations.push('Refactor complex functions for better maintainability');
      recommendations.push('Consider adding code complexity limits');
    }

    if (findingsByType['code_quality'] > 0) {
      recommendations.push('Improve code quality and consistency');
      recommendations.push('Set up automated code formatting');
    }

    // Add persona-specific recommendations
    if (persona) {
      switch (persona.name) {
        case 'security':
          recommendations.push('Implement security-first development practices');
          recommendations.push('Add security testing to CI/CD pipeline');
          break;
        case 'performance':
          recommendations.push('Add performance monitoring and profiling');
          recommendations.push('Implement performance budgets');
          break;
        case 'architect':
          recommendations.push('Review overall system architecture');
          recommendations.push('Consider design patterns and SOLID principles');
          break;
      }
    }

    return recommendations;
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(files: FileInfo[], findings: any[]): any {
    const totalLines = files.reduce((sum, file) =>
      sum + (file.content ? file.content.split('\n').length : 0), 0);

    const issuesPerLine = findings.length / totalLines;
    const severityDistribution = findings.reduce((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      total_lines: totalLines,
      total_issues: findings.length,
      issues_per_line: Math.round(issuesPerLine * 1000) / 1000,
      severity_distribution: severityDistribution,
      quality_score: Math.max(0, 100 - (findings.length * 2)),
    };
  }

  /**
   * Apply persona-specific insights
   */
  private applyPersonaInsights(findings: any[], persona: any): any {
    const personaFindings = findings.filter(finding => {
      switch (persona.name) {
        case 'security':
          return finding.type === 'security';
        case 'performance':
          return finding.type === 'performance';
        case 'architect':
          return finding.type === 'maintainability' || finding.type === 'best_practice';
        default:
          return true;
      }
    });

    return {
      persona_name: persona.name,
      focus_area: persona.expertise.join(', '),
      relevant_findings: personaFindings.length,
      specialized_recommendations: this.getPersonaRecommendations(personaFindings, persona),
    };
  }

  /**
   * Get persona-specific recommendations
   */
  private getPersonaRecommendations(findings: any[], persona: any): string[] {
    const recommendations: string[] = [];

    switch (persona.name) {
      case 'security':
        recommendations.push('Implement security code review checklist');
        recommendations.push('Add static security analysis tools');
        if (findings.some(f => f.type === 'security')) {
          recommendations.push('Prioritize fixing security vulnerabilities');
        }
        break;
      case 'performance':
        recommendations.push('Add performance monitoring');
        recommendations.push('Implement performance testing');
        if (findings.some(f => f.type === 'performance')) {
          recommendations.push('Profile and optimize performance bottlenecks');
        }
        break;
      case 'qa':
        recommendations.push('Increase test coverage');
        recommendations.push('Implement automated quality gates');
        break;
      default:
        recommendations.push(`Apply ${persona.name} best practices`);
    }

    return recommendations;
  }
}
