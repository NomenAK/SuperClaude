import { z } from 'zod';
import type { SuperAugmentTool } from '../ToolManager.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { FileSystemManager, type ProjectStructure } from '../../utils/FileSystemManager.js';
import { logger } from '../../utils/logger.js';

const AnalyzeProjectInputSchema = z.object({
  projectPath: z.string().optional().describe('Project root path (defaults to current directory)'),
  persona: z.string().optional().describe('Cognitive persona to use for analysis'),
  includeFileTree: z.boolean().default(false).describe('Include detailed file tree in output'),
  analyzeDependencies: z.boolean().default(true).describe('Analyze package dependencies'),
  detectIssues: z.boolean().default(true).describe('Detect potential project issues'),
});

type AnalyzeProjectInput = z.infer<typeof AnalyzeProjectInputSchema>;

/**
 * Project structure analysis tool
 */
export class AnalyzeProjectTool implements SuperAugmentTool {
  name = 'analyze_project';
  description = 'Analyze project structure, dependencies, and overall architecture';
  inputSchema = AnalyzeProjectInputSchema;

  private fileSystemManager: FileSystemManager;

  constructor(private configManager: ConfigManager) {
    this.fileSystemManager = new FileSystemManager();
  }

  async execute(args: AnalyzeProjectInput): Promise<any> {
    try {
      logger.info('Starting project analysis', { args });

      const validatedArgs = AnalyzeProjectInputSchema.parse(args);
      const persona = validatedArgs.persona 
        ? this.configManager.getPersona(validatedArgs.persona)
        : null;

      const projectPath = validatedArgs.projectPath || process.cwd();
      const projectStructure = await this.fileSystemManager.analyzeProjectStructure(projectPath);
      
      const analysis = await this.performProjectAnalysis(validatedArgs, projectStructure, persona);

      return {
        content: [
          {
            type: 'text',
            text: this.formatProjectAnalysis(analysis, persona),
          },
        ],
      };
    } catch (error) {
      logger.error('Project analysis failed:', error);
      throw error;
    }
  }

  private async performProjectAnalysis(
    args: AnalyzeProjectInput, 
    structure: ProjectStructure, 
    persona: any
  ): Promise<any> {
    const analysis = {
      project_path: structure.rootPath,
      framework: structure.framework,
      language: structure.language,
      file_stats: this.calculateFileStats(structure),
      dependencies: args.analyzeDependencies ? this.analyzeDependencies(structure.packageJson) : null,
      architecture: this.analyzeArchitecture(structure),
      issues: args.detectIssues ? this.detectProjectIssues(structure) : [],
      recommendations: this.generateRecommendations(structure, persona),
      file_tree: args.includeFileTree ? this.generateFileTree(structure) : null,
      persona_insights: persona ? this.applyPersonaInsights(structure, persona) : null,
    };

    return analysis;
  }

  private calculateFileStats(structure: ProjectStructure): any {
    const filesByExtension: Record<string, number> = {};
    const filesByDirectory: Record<string, number> = {};
    let totalSize = 0;

    structure.files.forEach(file => {
      // Count by extension
      const ext = file.extension || 'no-extension';
      filesByExtension[ext] = (filesByExtension[ext] || 0) + 1;

      // Count by directory
      const dir = file.relativePath.split('/')[0] || 'root';
      filesByDirectory[dir] = (filesByDirectory[dir] || 0) + 1;

      totalSize += file.size;
    });

    return {
      total_files: structure.files.length,
      total_directories: structure.directories.length,
      total_size: totalSize,
      average_file_size: Math.round(totalSize / structure.files.length),
      files_by_extension: filesByExtension,
      files_by_directory: filesByDirectory,
    };
  }

  private analyzeDependencies(packageJson: any): any {
    if (!packageJson) {
      return { has_package_json: false };
    }

    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    const allDeps = { ...deps, ...devDeps };

    const categories = {
      frameworks: [] as string[],
      testing: [] as string[],
      build_tools: [] as string[],
      ui_libraries: [] as string[],
      utilities: [] as string[],
    };

    // Categorize dependencies
    Object.keys(allDeps).forEach(dep => {
      if (['react', 'vue', 'angular', 'next', 'nuxt', 'express', 'fastify'].some(fw => dep.includes(fw))) {
        categories.frameworks.push(dep);
      } else if (['jest', 'mocha', 'chai', 'cypress', 'playwright', 'vitest'].some(test => dep.includes(test))) {
        categories.testing.push(dep);
      } else if (['webpack', 'vite', 'rollup', 'babel', 'typescript', 'eslint'].some(build => dep.includes(build))) {
        categories.build_tools.push(dep);
      } else if (['styled-components', 'emotion', 'tailwind', 'material-ui', 'antd'].some(ui => dep.includes(ui))) {
        categories.ui_libraries.push(dep);
      } else {
        categories.utilities.push(dep);
      }
    });

    return {
      has_package_json: true,
      total_dependencies: Object.keys(deps).length,
      total_dev_dependencies: Object.keys(devDeps).length,
      categories,
      scripts: Object.keys(packageJson.scripts || {}),
    };
  }

  private analyzeArchitecture(structure: ProjectStructure): any {
    const hasTests = structure.files.some(f => 
      f.relativePath.includes('test') || 
      f.relativePath.includes('spec') ||
      f.relativePath.includes('__tests__')
    );

    const hasConfig = structure.files.some(f => 
      ['config', 'configuration'].some(term => f.relativePath.toLowerCase().includes(term))
    );

    const hasDocumentation = structure.files.some(f => 
      f.extension === '.md' || f.relativePath.toLowerCase().includes('doc')
    );

    const hasTypeScript = structure.files.some(f => 
      ['.ts', '.tsx'].includes(f.extension)
    );

    const hasDocker = structure.files.some(f => 
      f.relativePath.toLowerCase().includes('dockerfile') ||
      f.relativePath.toLowerCase().includes('docker-compose')
    );

    const hasCI = structure.files.some(f => 
      f.relativePath.includes('.github') ||
      f.relativePath.includes('.gitlab') ||
      f.relativePath.includes('.circleci')
    );

    return {
      has_tests: hasTests,
      has_config: hasConfig,
      has_documentation: hasDocumentation,
      has_typescript: hasTypeScript,
      has_docker: hasDocker,
      has_ci: hasCI,
      estimated_complexity: this.estimateProjectComplexity(structure),
    };
  }

  private estimateProjectComplexity(structure: ProjectStructure): string {
    const fileCount = structure.files.length;
    const dirCount = structure.directories.length;
    const hasFramework = !!structure.framework;
    
    let score = 0;
    if (fileCount > 100) score += 2;
    else if (fileCount > 50) score += 1;
    
    if (dirCount > 20) score += 2;
    else if (dirCount > 10) score += 1;
    
    if (hasFramework) score += 1;
    
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  private detectProjectIssues(structure: ProjectStructure): any[] {
    const issues = [];

    // Check for missing important files
    const hasReadme = structure.files.some(f => f.relativePath.toLowerCase().includes('readme'));
    if (!hasReadme) {
      issues.push({
        type: 'documentation',
        severity: 'medium',
        message: 'Missing README.md file',
        recommendation: 'Add a README.md file to document your project',
      });
    }

    const hasGitignore = structure.files.some(f => f.relativePath.includes('.gitignore'));
    if (!hasGitignore) {
      issues.push({
        type: 'configuration',
        severity: 'medium',
        message: 'Missing .gitignore file',
        recommendation: 'Add a .gitignore file to exclude unnecessary files from version control',
      });
    }

    // Check for large files
    const largeFiles = structure.files.filter(f => f.size > 1024 * 1024); // > 1MB
    if (largeFiles.length > 0) {
      issues.push({
        type: 'performance',
        severity: 'low',
        message: `Found ${largeFiles.length} large files (>1MB)`,
        recommendation: 'Consider optimizing or moving large files to appropriate storage',
      });
    }

    // Check for too many files in root
    const rootFiles = structure.files.filter(f => !f.relativePath.includes('/'));
    if (rootFiles.length > 10) {
      issues.push({
        type: 'organization',
        severity: 'low',
        message: `Too many files in root directory (${rootFiles.length})`,
        recommendation: 'Consider organizing files into subdirectories',
      });
    }

    return issues;
  }

  private generateRecommendations(structure: ProjectStructure, _persona: any): string[] {
    const recommendations = [];

    if (!structure.framework) {
      recommendations.push('Consider using a framework to structure your project better');
    }

    const hasTests = structure.files.some(f => f.relativePath.includes('test'));
    if (!hasTests) {
      recommendations.push('Add unit tests to improve code quality and reliability');
    }

    const hasTypeScript = structure.files.some(f => ['.ts', '.tsx'].includes(f.extension));
    if (!hasTypeScript && structure.language === 'JavaScript') {
      recommendations.push('Consider migrating to TypeScript for better type safety');
    }

    return recommendations;
  }

  private generateFileTree(structure: ProjectStructure): string {
    const tree = ['Project Structure:', ''];
    
    // Group files by directory
    const filesByDir: Record<string, string[]> = { root: [] };

    structure.files.forEach(file => {
      const parts = file.relativePath.split('/');
      if (parts.length === 1) {
        filesByDir['root']?.push(file.relativePath);
      } else {
        const dir = parts[0];
        if (dir && !filesByDir[dir]) {
          filesByDir[dir] = [];
        }
        if (dir) {
          filesByDir[dir]?.push(parts.slice(1).join('/'));
        }
      }
    });

    // Generate tree representation
    Object.entries(filesByDir).forEach(([dir, files]) => {
      if (dir === 'root') {
        files.forEach(file => tree.push(`├── ${file}`));
      } else {
        tree.push(`├── ${dir}/`);
        files.slice(0, 5).forEach((file, index) => {
          const isLast = index === Math.min(files.length, 5) - 1;
          tree.push(`│   ${isLast ? '└──' : '├──'} ${file}`);
        });
        if (files.length > 5) {
          tree.push(`│   └── ... and ${files.length - 5} more files`);
        }
      }
    });

    return tree.join('\n');
  }

  private applyPersonaInsights(_structure: ProjectStructure, persona: any): any {
    const insights = {
      persona_name: persona.name,
      specialized_analysis: [] as string[],
      recommendations: [] as string[],
    };

    switch (persona.name) {
      case 'architect':
        insights.specialized_analysis.push('Analyzing system architecture and scalability patterns');
        insights.recommendations.push('Consider implementing clean architecture principles');
        insights.recommendations.push('Evaluate service boundaries and dependencies');
        break;
      case 'security':
        insights.specialized_analysis.push('Reviewing security configuration and dependencies');
        insights.recommendations.push('Audit dependencies for known vulnerabilities');
        insights.recommendations.push('Implement security headers and HTTPS');
        break;
      case 'performance':
        insights.specialized_analysis.push('Analyzing performance bottlenecks and optimization opportunities');
        insights.recommendations.push('Optimize bundle size and loading performance');
        insights.recommendations.push('Implement caching strategies');
        break;
      default:
        insights.specialized_analysis.push(`Applying ${persona.name} expertise to project analysis`);
    }

    return insights;
  }

  private formatProjectAnalysis(analysis: any, persona: any): string {
    let result = '# Project Analysis Report\n\n';

    if (persona) {
      result += `**Analysis Persona**: ${persona.name} (${persona.description})\n\n`;
    }

    result += `## Project Overview\n`;
    result += `- **Path**: ${analysis.project_path}\n`;
    if (analysis.framework) {
      result += `- **Framework**: ${analysis.framework}\n`;
    }
    if (analysis.language) {
      result += `- **Primary Language**: ${analysis.language}\n`;
    }
    result += `- **Complexity**: ${analysis.architecture.estimated_complexity}\n\n`;

    // File statistics
    result += `## File Statistics\n`;
    result += `- **Total Files**: ${analysis.file_stats.total_files}\n`;
    result += `- **Total Directories**: ${analysis.file_stats.total_directories}\n`;
    result += `- **Total Size**: ${Math.round(analysis.file_stats.total_size / 1024)} KB\n`;
    result += `- **Average File Size**: ${Math.round(analysis.file_stats.average_file_size / 1024)} KB\n\n`;

    // Dependencies
    if (analysis.dependencies?.has_package_json) {
      result += `## Dependencies\n`;
      result += `- **Dependencies**: ${analysis.dependencies.total_dependencies}\n`;
      result += `- **Dev Dependencies**: ${analysis.dependencies.total_dev_dependencies}\n`;
      result += `- **Scripts**: ${analysis.dependencies.scripts.length}\n\n`;
    }

    // Architecture
    result += `## Architecture Features\n`;
    result += `- **Tests**: ${analysis.architecture.has_tests ? '✅' : '❌'}\n`;
    result += `- **TypeScript**: ${analysis.architecture.has_typescript ? '✅' : '❌'}\n`;
    result += `- **Documentation**: ${analysis.architecture.has_documentation ? '✅' : '❌'}\n`;
    result += `- **Docker**: ${analysis.architecture.has_docker ? '✅' : '❌'}\n`;
    result += `- **CI/CD**: ${analysis.architecture.has_ci ? '✅' : '❌'}\n\n`;

    // Issues
    if (analysis.issues.length > 0) {
      result += `## Issues Found\n`;
      analysis.issues.forEach((issue: any, index: number) => {
        result += `${index + 1}. **${issue.type}** (${issue.severity}): ${issue.message}\n`;
        result += `   Recommendation: ${issue.recommendation}\n\n`;
      });
    }

    // Recommendations
    if (analysis.recommendations.length > 0) {
      result += `## Recommendations\n`;
      analysis.recommendations.forEach((rec: string, index: number) => {
        result += `${index + 1}. ${rec}\n`;
      });
      result += '\n';
    }

    // File tree
    if (analysis.file_tree) {
      result += `## File Structure\n\`\`\`\n${analysis.file_tree}\n\`\`\`\n\n`;
    }

    // Persona insights
    if (analysis.persona_insights) {
      result += `## ${analysis.persona_insights.persona_name} Insights\n`;
      analysis.persona_insights.specialized_analysis.forEach((insight: string) => {
        result += `- ${insight}\n`;
      });
      result += '\n**Recommendations:**\n';
      analysis.persona_insights.recommendations.forEach((rec: string, index: number) => {
        result += `${index + 1}. ${rec}\n`;
      });
    }

    return result;
  }
}
