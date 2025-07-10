import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ToolManager } from './tools/ToolManager.js';
import { ResourceManager } from './resources/ResourceManager.js';
import { PromptManager } from './prompts/PromptManager.js';
import { ConfigManager } from './config/ConfigManager.js';
import { logger } from './utils/logger.js';

/**
 * SuperAugment MCP Server implementation
 * 
 * Provides development tools, cognitive personas, and intelligent workflows
 * for VS Code Augment through the Model Context Protocol.
 */
export class SuperAugmentServer {
  private toolManager: ToolManager;
  private resourceManager: ResourceManager;
  private promptManager: PromptManager;
  private configManager: ConfigManager;

  constructor(private server: Server) {
    this.configManager = new ConfigManager();
    this.toolManager = new ToolManager(this.configManager);
    this.resourceManager = new ResourceManager(this.configManager);
    this.promptManager = new PromptManager(this.configManager);
  }

  /**
   * Initialize the SuperAugment server
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing SuperAugment MCP Server...');

      // Load configuration
      await this.configManager.initialize();
      logger.info('Configuration loaded successfully');

      // Initialize managers
      await this.toolManager.initialize();
      await this.resourceManager.initialize();
      await this.promptManager.initialize();

      // Register MCP handlers
      this.registerToolHandlers();
      this.registerResourceHandlers();
      this.registerPromptHandlers();

      logger.info('SuperAugment MCP Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SuperAugment server:', error);
      throw error;
    }
  }

  /**
   * Register tool-related MCP handlers
   */
  private registerToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = await this.toolManager.listTools();
      return { tools };
    });

    // Call a specific tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const result = await this.toolManager.callTool(name, args || {});
      return result;
    });
  }

  /**
   * Register resource-related MCP handlers
   */
  private registerResourceHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = await this.resourceManager.listResources();
      return { resources };
    });

    // Read a specific resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const contents = await this.resourceManager.readResource(uri);
      return { contents };
    });
  }

  /**
   * Register prompt-related MCP handlers
   */
  private registerPromptHandlers(): void {
    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = await this.promptManager.listPrompts();
      return { prompts };
    });

    // Get a specific prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const result = await this.promptManager.getPrompt(name, args || {});
      return result;
    });
  }
}
