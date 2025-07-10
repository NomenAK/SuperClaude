import type { Prompt } from '@modelcontextprotocol/sdk/types.js';
import { ConfigManager } from '../config/ConfigManager.js';
import { logger } from '../utils/logger.js';

/**
 * Manages prompts for SuperAugment MCP server
 */
export class PromptManager {
  private prompts: Map<string, any> = new Map();

  constructor(private configManager: ConfigManager) {}

  /**
   * Initialize the prompt manager
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing SuperAugment prompts...');

      // Register development prompts
      this.registerDevelopmentPrompts();
      
      // Register analysis prompts
      this.registerAnalysisPrompts();
      
      // Register persona prompts
      this.registerPersonaPrompts();

      logger.info(`Registered ${this.prompts.size} prompts`);
    } catch (error) {
      logger.error('Failed to initialize prompts:', error);
      throw error;
    }
  }

  /**
   * List all available prompts
   */
  async listPrompts(): Promise<Prompt[]> {
    const prompts: Prompt[] = [];

    for (const [name, prompt] of this.prompts) {
      prompts.push({
        name,
        description: prompt.description,
        arguments: prompt.arguments,
      });
    }

    return prompts;
  }

  /**
   * Get a specific prompt
   */
  async getPrompt(name: string, args: Record<string, any>): Promise<any> {
    const prompt = this.prompts.get(name);
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`);
    }

    try {
      logger.info(`Generating prompt: ${name}`, { args });
      
      const messages = await prompt.generator(args);
      
      return {
        description: prompt.description,
        messages,
      };
    } catch (error) {
      logger.error(`Failed to generate prompt: ${name}`, error);
      throw error;
    }
  }

  /**
   * Register development-related prompts
   */
  private registerDevelopmentPrompts(): void {
    this.prompts.set('code-review', {
      description: 'Generate a comprehensive code review prompt',
      arguments: [
        {
          name: 'code',
          description: 'Code to review',
          required: true,
        },
        {
          name: 'persona',
          description: 'Reviewer persona',
          required: false,
        },
        {
          name: 'focus',
          description: 'Areas to focus on',
          required: false,
        },
      ],
      generator: async (args: any) => {
        const persona = args.persona ? this.configManager.getPersona(args.persona) : null;
        const focus = args.focus || 'general code quality';
        
        let systemPrompt = 'You are an expert code reviewer. ';
        if (persona) {
          systemPrompt += `You have the expertise of a ${persona.name}: ${persona.description}. `;
          systemPrompt += `Your approach is: ${persona.approach}. `;
        }
        systemPrompt += `Focus on ${focus}.`;

        return [
          {
            role: 'system',
            content: {
              type: 'text',
              text: systemPrompt,
            },
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please review the following code:\n\n\`\`\`\n${args.code}\n\`\`\``,
            },
          },
        ];
      },
    });

    this.prompts.set('architecture-design', {
      description: 'Generate an architecture design prompt',
      arguments: [
        {
          name: 'requirements',
          description: 'System requirements',
          required: true,
        },
        {
          name: 'constraints',
          description: 'Technical constraints',
          required: false,
        },
        {
          name: 'scale',
          description: 'Expected scale',
          required: false,
        },
      ],
      generator: async (args: any) => {
        const architect = this.configManager.getPersona('architect');
        
        let systemPrompt = 'You are a senior software architect. ';
        if (architect) {
          systemPrompt += `${architect.description} Your approach is: ${architect.approach}.`;
        }

        let userPrompt = `Design a system architecture for the following requirements:\n\n${args.requirements}`;
        
        if (args.constraints) {
          userPrompt += `\n\nConstraints:\n${args.constraints}`;
        }
        
        if (args.scale) {
          userPrompt += `\n\nExpected scale: ${args.scale}`;
        }

        return [
          {
            role: 'system',
            content: {
              type: 'text',
              text: systemPrompt,
            },
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: userPrompt,
            },
          },
        ];
      },
    });
  }

  /**
   * Register analysis-related prompts
   */
  private registerAnalysisPrompts(): void {
    this.prompts.set('security-analysis', {
      description: 'Generate a security analysis prompt',
      arguments: [
        {
          name: 'code',
          description: 'Code to analyze for security',
          required: true,
        },
        {
          name: 'framework',
          description: 'Framework being used',
          required: false,
        },
      ],
      generator: async (args: any) => {
        const security = this.configManager.getPersona('security');
        
        let systemPrompt = 'You are a cybersecurity expert specializing in code security analysis. ';
        if (security) {
          systemPrompt += `${security.description} Your approach is: ${security.approach}.`;
        }

        let userPrompt = `Analyze the following code for security vulnerabilities:\n\n\`\`\`\n${args.code}\n\`\`\``;
        
        if (args.framework) {
          userPrompt += `\n\nFramework: ${args.framework}`;
        }

        return [
          {
            role: 'system',
            content: {
              type: 'text',
              text: systemPrompt,
            },
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: userPrompt,
            },
          },
        ];
      },
    });

    this.prompts.set('performance-analysis', {
      description: 'Generate a performance analysis prompt',
      arguments: [
        {
          name: 'code',
          description: 'Code to analyze for performance',
          required: true,
        },
        {
          name: 'metrics',
          description: 'Performance metrics to focus on',
          required: false,
        },
      ],
      generator: async (args: any) => {
        const performance = this.configManager.getPersona('performance');
        
        let systemPrompt = 'You are a performance optimization expert. ';
        if (performance) {
          systemPrompt += `${performance.description} Your approach is: ${performance.approach}.`;
        }

        let userPrompt = `Analyze the following code for performance optimization opportunities:\n\n\`\`\`\n${args.code}\n\`\`\``;
        
        if (args.metrics) {
          userPrompt += `\n\nFocus on these metrics: ${args.metrics}`;
        }

        return [
          {
            role: 'system',
            content: {
              type: 'text',
              text: systemPrompt,
            },
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: userPrompt,
            },
          },
        ];
      },
    });
  }

  /**
   * Register persona-specific prompts
   */
  private registerPersonaPrompts(): void {
    const personas = this.configManager.getPersonas();
    
    personas.forEach(persona => {
      this.prompts.set(`persona-${persona.name}`, {
        description: `Generate a prompt using the ${persona.name} persona`,
        arguments: [
          {
            name: 'task',
            description: 'Task to perform',
            required: true,
          },
          {
            name: 'context',
            description: 'Additional context',
            required: false,
          },
        ],
        generator: async (args: any) => {
          let systemPrompt = `You are a ${persona.name}. ${persona.description} `;
          systemPrompt += `Your expertise includes: ${persona.expertise.join(', ')}. `;
          systemPrompt += `Your approach is: ${persona.approach}.`;

          let userPrompt = args.task;
          if (args.context) {
            userPrompt += `\n\nContext: ${args.context}`;
          }

          return [
            {
              role: 'system',
              content: {
                type: 'text',
                text: systemPrompt,
              },
            },
            {
              role: 'user',
              content: {
                type: 'text',
                text: userPrompt,
              },
            },
          ];
        },
      });
    });
  }
}
