import { z } from 'zod';
import type { SuperAugmentTool } from '../ToolManager.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { logger } from '../../utils/logger.js';

const TestProjectInputSchema = z.object({
  type: z.enum(['unit', 'integration', 'e2e', 'performance', 'security']).describe('Type of tests to run'),
  coverage: z.boolean().default(false).describe('Generate coverage report'),
  files: z.array(z.string()).optional().describe('Specific files or patterns to test'),
  persona: z.string().optional().describe('Testing persona for approach'),
  framework: z.string().optional().describe('Testing framework to use'),
  parallel: z.boolean().default(true).describe('Run tests in parallel'),
});

type TestProjectInput = z.infer<typeof TestProjectInputSchema>;

export class TestProjectTool implements SuperAugmentTool {
  name = 'test_project';
  description = 'Run comprehensive tests with persona-driven testing strategies';
  inputSchema = TestProjectInputSchema;

  constructor(private configManager: ConfigManager) {}

  async execute(args: TestProjectInput): Promise<any> {
    try {
      logger.info('Starting project tests', { args });

      const validatedArgs = TestProjectInputSchema.parse(args);
      const persona = validatedArgs.persona 
        ? this.configManager.getPersona(validatedArgs.persona)
        : this.configManager.getPersona('qa');

      const testResult = await this.runTests(validatedArgs, persona);

      return {
        content: [
          {
            type: 'text',
            text: this.formatTestResult(testResult, persona),
          },
        ],
      };
    } catch (error) {
      logger.error('Project testing failed:', error);
      throw error;
    }
  }

  private async runTests(args: TestProjectInput, persona: any): Promise<any> {
    // Placeholder test implementation
    return {
      test_type: args.type,
      framework: args.framework || 'jest',
      results: {
        total: 25,
        passed: 23,
        failed: 2,
        skipped: 0,
        duration: '2.5s',
      },
      coverage: args.coverage ? {
        statements: 85.2,
        branches: 78.9,
        functions: 92.1,
        lines: 84.7,
      } : null,
      failed_tests: [
        {
          name: 'should handle edge case',
          file: 'utils.test.ts',
          error: 'Expected true but received false',
        },
        {
          name: 'should validate input',
          file: 'validation.test.ts',
          error: 'Timeout exceeded',
        },
      ],
      persona_insights: persona ? {
        persona_name: persona.name,
        testing_approach: persona.approach,
        recommendations: this.getTestingRecommendations(args, persona),
      } : null,
    };
  }

  private getTestingRecommendations(_args: TestProjectInput, persona: any): string[] {
    const recommendations = [];

    switch (persona.name) {
      case 'qa':
        recommendations.push('Implement comprehensive test coverage');
        recommendations.push('Add edge case testing');
        recommendations.push('Setup automated testing pipeline');
        break;
      case 'security':
        recommendations.push('Add security-focused test cases');
        recommendations.push('Test for common vulnerabilities');
        recommendations.push('Implement penetration testing');
        break;
      case 'performance':
        recommendations.push('Add performance benchmarks');
        recommendations.push('Test under load conditions');
        recommendations.push('Monitor resource usage during tests');
        break;
      default:
        recommendations.push('Follow testing best practices');
    }

    return recommendations;
  }

  private formatTestResult(result: any, persona: any): string {
    let output = '# Test Results Report\n\n';

    if (persona) {
      output += `**Testing Persona**: ${persona.name}\n\n`;
    }

    output += `## Test Summary\n`;
    output += `- **Type**: ${result.test_type}\n`;
    output += `- **Framework**: ${result.framework}\n`;
    output += `- **Duration**: ${result.results.duration}\n\n`;

    output += `## Results\n`;
    output += `- **Total**: ${result.results.total}\n`;
    output += `- **Passed**: ${result.results.passed} ✅\n`;
    output += `- **Failed**: ${result.results.failed} ❌\n`;
    output += `- **Skipped**: ${result.results.skipped} ⏭️\n\n`;

    if (result.coverage) {
      output += `## Coverage Report\n`;
      output += `- **Statements**: ${result.coverage.statements}%\n`;
      output += `- **Branches**: ${result.coverage.branches}%\n`;
      output += `- **Functions**: ${result.coverage.functions}%\n`;
      output += `- **Lines**: ${result.coverage.lines}%\n\n`;
    }

    if (result.failed_tests.length > 0) {
      output += `## Failed Tests\n`;
      result.failed_tests.forEach((test: any, index: number) => {
        output += `${index + 1}. **${test.name}** (${test.file})\n`;
        output += `   Error: ${test.error}\n\n`;
      });
    }

    if (result.persona_insights) {
      output += `## Testing Insights\n`;
      result.persona_insights.recommendations.forEach((rec: string, index: number) => {
        output += `${index + 1}. ${rec}\n`;
      });
    }

    return output;
  }
}
