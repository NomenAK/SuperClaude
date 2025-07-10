import { z } from 'zod';
import type { SuperAugmentTool } from '../ToolManager.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { logger } from '../../utils/logger.js';

const BuildProjectInputSchema = z.object({
  type: z.enum(['react', 'node', 'python', 'rust', 'go', 'java']).describe('Project type to build'),
  features: z.array(z.string()).optional().describe('Features to include (e.g., typescript, testing, docker)'),
  persona: z.string().optional().describe('Development persona for build approach'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  optimization: z.boolean().default(false).describe('Enable build optimizations'),
  target: z.string().optional().describe('Build target directory'),
});

type BuildProjectInput = z.infer<typeof BuildProjectInputSchema>;

export class BuildProjectTool implements SuperAugmentTool {
  name = 'build_project';
  description = 'Build projects with intelligent configuration and persona-driven approaches';
  inputSchema = BuildProjectInputSchema;

  constructor(private configManager: ConfigManager) {}

  async execute(args: BuildProjectInput): Promise<any> {
    try {
      logger.info('Starting project build', { args });

      const validatedArgs = BuildProjectInputSchema.parse(args);
      const persona = validatedArgs.persona 
        ? this.configManager.getPersona(validatedArgs.persona)
        : null;

      const buildResult = await this.performBuild(validatedArgs, persona);

      return {
        content: [
          {
            type: 'text',
            text: this.formatBuildResult(buildResult, persona),
          },
        ],
      };
    } catch (error) {
      logger.error('Project build failed:', error);
      throw error;
    }
  }

  private async performBuild(args: BuildProjectInput, persona: any): Promise<any> {
    const buildSteps = this.generateBuildSteps(args, persona);
    
    // Simulate build process
    const result = {
      project_type: args.type,
      environment: args.environment,
      features_included: args.features || [],
      build_steps: buildSteps,
      status: 'success',
      artifacts: this.generateArtifacts(args),
      recommendations: this.generateRecommendations(args, persona),
      persona_insights: persona ? {
        persona_name: persona.name,
        approach: persona.approach,
        specialized_suggestions: this.getPersonaSpecificSuggestions(args, persona),
      } : null,
    };

    return result;
  }

  private generateBuildSteps(args: BuildProjectInput, _persona: any): string[] {
    const steps = [];

    switch (args.type) {
      case 'react':
        steps.push('Initialize React project with Vite');
        if (args.features?.includes('typescript')) {
          steps.push('Configure TypeScript');
        }
        if (args.features?.includes('testing')) {
          steps.push('Setup Jest and React Testing Library');
        }
        steps.push('Install dependencies');
        steps.push('Build for production');
        break;

      case 'node':
        steps.push('Initialize Node.js project');
        if (args.features?.includes('typescript')) {
          steps.push('Configure TypeScript');
        }
        steps.push('Setup Express.js framework');
        if (args.features?.includes('docker')) {
          steps.push('Create Dockerfile');
        }
        steps.push('Build application');
        break;

      default:
        steps.push(`Initialize ${args.type} project`);
        steps.push('Configure build system');
        steps.push('Build application');
    }

    if (args.optimization) {
      steps.push('Apply build optimizations');
    }

    return steps;
  }

  private generateArtifacts(args: BuildProjectInput): string[] {
    const artifacts = [];

    switch (args.type) {
      case 'react':
        artifacts.push('dist/index.html');
        artifacts.push('dist/assets/index.js');
        artifacts.push('dist/assets/index.css');
        break;
      case 'node':
        artifacts.push('dist/index.js');
        artifacts.push('package.json');
        if (args.features?.includes('docker')) {
          artifacts.push('Dockerfile');
        }
        break;
      default:
        artifacts.push('build/main');
    }

    return artifacts;
  }

  private generateRecommendations(args: BuildProjectInput, _persona: any): string[] {
    const recommendations = [];

    if (args.environment === 'production') {
      recommendations.push('Enable build optimizations for production');
      recommendations.push('Configure proper error handling');
      recommendations.push('Setup monitoring and logging');
    }

    if (!args.features?.includes('testing')) {
      recommendations.push('Add comprehensive testing suite');
    }

    if (!args.features?.includes('docker')) {
      recommendations.push('Consider containerization with Docker');
    }

    return recommendations;
  }

  private getPersonaSpecificSuggestions(_args: BuildProjectInput, persona: any): string[] {
    const suggestions = [];

    switch (persona.name) {
      case 'frontend':
        suggestions.push('Focus on user experience and performance');
        suggestions.push('Implement responsive design patterns');
        suggestions.push('Optimize bundle size and loading times');
        break;
      case 'backend':
        suggestions.push('Implement robust API design');
        suggestions.push('Focus on scalability and performance');
        suggestions.push('Add comprehensive error handling');
        break;
      case 'security':
        suggestions.push('Implement security best practices');
        suggestions.push('Add input validation and sanitization');
        suggestions.push('Configure secure headers and HTTPS');
        break;
      case 'performance':
        suggestions.push('Optimize build performance');
        suggestions.push('Implement caching strategies');
        suggestions.push('Monitor and profile application performance');
        break;
      default:
        suggestions.push(`Apply ${persona.name} best practices`);
    }

    return suggestions;
  }

  private formatBuildResult(result: any, persona: any): string {
    let output = '# Project Build Report\n\n';

    if (persona) {
      output += `**Build Persona**: ${persona.name} (${persona.description})\n\n`;
    }

    output += `## Project Details\n`;
    output += `- **Type**: ${result.project_type}\n`;
    output += `- **Environment**: ${result.environment}\n`;
    output += `- **Status**: ${result.status}\n\n`;

    if (result.features_included.length > 0) {
      output += `## Features Included\n`;
      result.features_included.forEach((feature: string) => {
        output += `- ${feature}\n`;
      });
      output += '\n';
    }

    output += `## Build Steps\n`;
    result.build_steps.forEach((step: string, index: number) => {
      output += `${index + 1}. ${step}\n`;
    });
    output += '\n';

    output += `## Generated Artifacts\n`;
    result.artifacts.forEach((artifact: string) => {
      output += `- ${artifact}\n`;
    });
    output += '\n';

    if (result.recommendations.length > 0) {
      output += `## Recommendations\n`;
      result.recommendations.forEach((rec: string, index: number) => {
        output += `${index + 1}. ${rec}\n`;
      });
      output += '\n';
    }

    if (result.persona_insights) {
      output += `## ${result.persona_insights.persona_name} Insights\n`;
      result.persona_insights.specialized_suggestions.forEach((suggestion: string, index: number) => {
        output += `${index + 1}. ${suggestion}\n`;
      });
    }

    return output;
  }
}
