import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { ConfigManager } from '../config/ConfigManager.js';
import { logger } from '../utils/logger.js';
import YAML from 'yaml';

/**
 * Manages resources for SuperAugment MCP server
 */
export class ResourceManager {
  private resources: Map<string, any> = new Map();

  constructor(private configManager: ConfigManager) {}

  /**
   * Initialize the resource manager
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing SuperAugment resources...');

      // Load configuration resources
      await this.loadConfigurationResources();
      
      // Load pattern resources
      await this.loadPatternResources();
      
      // Load documentation resources
      await this.loadDocumentationResources();

      logger.info(`Loaded ${this.resources.size} resources`);
    } catch (error) {
      logger.error('Failed to initialize resources:', error);
      throw error;
    }
  }

  /**
   * List all available resources
   */
  async listResources(): Promise<Resource[]> {
    const resources: Resource[] = [];

    for (const [uri, resource] of this.resources) {
      resources.push({
        uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType || 'text/plain',
      });
    }

    return resources;
  }

  /**
   * Read a specific resource
   */
  async readResource(uri: string): Promise<any[]> {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    try {
      logger.info(`Reading resource: ${uri}`);
      
      return [
        {
          uri,
          mimeType: resource.mimeType || 'text/plain',
          text: resource.content,
        },
      ];
    } catch (error) {
      logger.error(`Failed to read resource: ${uri}`, error);
      throw error;
    }
  }

  /**
   * Load configuration resources
   */
  private async loadConfigurationResources(): Promise<void> {
    // Personas resource
    const personas = this.configManager.getPersonas();
    this.resources.set('superaugment://config/personas', {
      name: 'Cognitive Personas',
      description: 'Available cognitive personas for specialized development approaches',
      mimeType: 'application/json',
      content: JSON.stringify(personas, null, 2),
    });

    // Tools configuration resource
    const toolConfigs = this.configManager.getToolConfigs();
    this.resources.set('superaugment://config/tools', {
      name: 'Tool Configurations',
      description: 'Configuration for all available development tools',
      mimeType: 'application/json',
      content: JSON.stringify(toolConfigs, null, 2),
    });

    // Settings resource
    const config = this.configManager.getConfig();
    this.resources.set('superaugment://config/settings', {
      name: 'SuperAugment Settings',
      description: 'Global settings and configuration options',
      mimeType: 'application/json',
      content: JSON.stringify(config.settings || {}, null, 2),
    });
  }

  /**
   * Load pattern resources
   */
  private async loadPatternResources(): Promise<void> {
    const patterns = this.configManager.getConfig().patterns || {};

    // Development patterns
    this.resources.set('superaugment://patterns/development', {
      name: 'Development Patterns',
      description: 'Common development patterns and best practices',
      mimeType: 'application/yaml',
      content: YAML.stringify(patterns['development'] || {}),
    });

    // Architecture patterns
    this.resources.set('superaugment://patterns/architecture', {
      name: 'Architecture Patterns',
      description: 'System architecture patterns and design principles',
      mimeType: 'application/yaml',
      content: YAML.stringify(patterns['architecture'] || {}),
    });

    // Security patterns
    this.resources.set('superaugment://patterns/security', {
      name: 'Security Patterns',
      description: 'Security best practices and vulnerability patterns',
      mimeType: 'application/yaml',
      content: YAML.stringify(patterns['security'] || {}),
    });

    // Testing patterns
    this.resources.set('superaugment://patterns/testing', {
      name: 'Testing Patterns',
      description: 'Testing strategies and quality assurance patterns',
      mimeType: 'application/yaml',
      content: YAML.stringify(patterns['testing'] || {}),
    });
  }

  /**
   * Load documentation resources
   */
  private async loadDocumentationResources(): Promise<void> {
    // Tool usage examples
    this.resources.set('superaugment://docs/tool-examples', {
      name: 'Tool Usage Examples',
      description: 'Examples of how to use SuperAugment tools effectively',
      mimeType: 'text/markdown',
      content: this.generateToolExamples(),
    });

    // Persona guide
    this.resources.set('superaugment://docs/persona-guide', {
      name: 'Persona Guide',
      description: 'Guide to using cognitive personas for specialized development',
      mimeType: 'text/markdown',
      content: this.generatePersonaGuide(),
    });

    // Best practices
    this.resources.set('superaugment://docs/best-practices', {
      name: 'Best Practices',
      description: 'Best practices for using SuperAugment in development workflows',
      mimeType: 'text/markdown',
      content: this.generateBestPractices(),
    });
  }

  /**
   * Generate tool usage examples
   */
  private generateToolExamples(): string {
    return `# SuperAugment Tool Examples

## Code Analysis
\`\`\`typescript
// Analyze code with architect persona
await mcpClient.callTool("analyze_code", {
  code: "function example() { return 'hello'; }",
  persona: "architect",
  depth: "comprehensive"
});
\`\`\`

## Security Scanning
\`\`\`typescript
// Perform security scan with security persona
await mcpClient.callTool("security_scan", {
  target: "src/",
  scanType: "comprehensive",
  persona: "security"
});
\`\`\`

## Project Building
\`\`\`typescript
// Build React project with frontend persona
await mcpClient.callTool("build_project", {
  type: "react",
  features: ["typescript", "testing"],
  persona: "frontend"
});
\`\`\`
`;
  }

  /**
   * Generate persona guide
   */
  private generatePersonaGuide(): string {
    const personas = this.configManager.getPersonas();
    let guide = '# Cognitive Personas Guide\n\n';
    
    guide += 'SuperAugment provides specialized cognitive personas for different development approaches:\n\n';
    
    personas.forEach(persona => {
      guide += `## ${persona.name}\n`;
      guide += `${persona.description}\n\n`;
      guide += `**Expertise**: ${persona.expertise.join(', ')}\n`;
      guide += `**Approach**: ${persona.approach}\n\n`;
    });

    return guide;
  }

  /**
   * Generate best practices
   */
  private generateBestPractices(): string {
    return `# SuperAugment Best Practices

## Tool Usage
1. Always specify a persona when you need specialized expertise
2. Use appropriate depth levels for analysis tools
3. Combine multiple tools for comprehensive workflows

## Persona Selection
- Use **architect** for system design and architecture decisions
- Use **security** for security-focused analysis and reviews
- Use **frontend** for UI/UX and client-side development
- Use **backend** for server-side and API development
- Use **qa** for testing and quality assurance

## Workflow Integration
1. Start with analysis tools to understand the codebase
2. Use build tools for project setup and compilation
3. Apply security scanning for vulnerability assessment
4. Deploy with appropriate strategies for your environment
`;
  }
}
