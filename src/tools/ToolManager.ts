import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ConfigManager } from '../config/ConfigManager.js';
import { logger } from '../utils/logger.js';
import { SchemaConverter } from '../utils/SchemaConverter.js';
import {
  SuperAugmentError,
  ToolExecutionError,
  ErrorCode,
} from '../errors/ErrorTypes.js';
import { globalErrorHandler } from '../errors/ErrorHandler.js';

// Import tool implementations
import { AnalyzeCodeTool } from './analysis/AnalyzeCodeTool.js';
import { AnalyzeProjectTool } from './analysis/AnalyzeProjectTool.js';
import { ReviewCodeTool } from './analysis/ReviewCodeTool.js';
import { SecurityScanTool } from './analysis/SecurityScanTool.js';
import { AnalyzeCppTool } from './analysis/AnalyzeCppTool.js';
import { EnhancedCppAnalysisTool } from './analysis/EnhancedCppAnalysisTool.js';
import { CudaAnalysisTool } from './analysis/CudaAnalysisTool.js';
import { BuildProjectTool } from './build/BuildProjectTool.js';
import { TestProjectTool } from './build/TestProjectTool.js';
import { DeployApplicationTool } from './build/DeployApplicationTool.js';

/**
 * Base interface for all SuperAugment tools
 */
export interface SuperAugmentTool {
  name: string;
  description: string;
  inputSchema: any;
  execute(args: Record<string, any>): Promise<any>;
}

/**
 * Manages all development tools for SuperAugment
 */
export class ToolManager {
  private tools: Map<string, SuperAugmentTool> = new Map();
  private schemaConverter: SchemaConverter;

  constructor(private configManager: ConfigManager) {
    this.schemaConverter = new SchemaConverter();
  }

  /**
   * Initialize the tool manager
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing SuperAugment tools...');

      // Register all tools
      this.registerTool(new AnalyzeCodeTool(this.configManager));
      this.registerTool(new AnalyzeProjectTool(this.configManager));
      this.registerTool(new ReviewCodeTool(this.configManager));
      this.registerTool(new SecurityScanTool(this.configManager));
      this.registerTool(new AnalyzeCppTool(this.configManager));
      this.registerTool(new EnhancedCppAnalysisTool(this.configManager));
      this.registerTool(new CudaAnalysisTool(this.configManager));
      this.registerTool(new BuildProjectTool(this.configManager));
      this.registerTool(new TestProjectTool(this.configManager));
      this.registerTool(new DeployApplicationTool(this.configManager));

      logger.info(`Registered ${this.tools.size} tools`);
    } catch (error) {
      logger.error('Failed to initialize tools:', error);
      throw error;
    }
  }

  /**
   * Register a tool
   */
  private registerTool(tool: SuperAugmentTool): void {
    this.tools.set(tool.name, tool);
    logger.debug(`Registered tool: ${tool.name}`);
  }

  /**
   * List all available tools with enhanced schema conversion
   */
  async listTools(): Promise<Tool[]> {
    const tools: Tool[] = [];

    for (const [name, tool] of this.tools) {
      try {
        // Use the robust SchemaConverter for MCP-compatible schema
        const jsonSchema = this.schemaConverter.convertZodToJsonSchema(tool.inputSchema, {
          includeDescriptions: true,
          includeDefaults: true,
          strictMode: false,
        });

        tools.push({
          name,
          description: tool.description,
          inputSchema: jsonSchema as any,
        });

        logger.debug(`Successfully converted schema for tool: ${name}`, {
          toolName: name,
          conversionStats: this.schemaConverter.getStats(),
        });

      } catch (error) {
        logger.error(`Failed to convert schema for tool: ${name}`, {
          toolName: name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Fallback to basic schema
        tools.push({
          name,
          description: tool.description,
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true,
          },
        });
      }
    }

    logger.info(`Listed ${tools.length} tools with schema conversion`, {
      totalTools: tools.length,
      conversionStats: this.schemaConverter.getStats(),
    });

    return tools;
  }

  /**
   * Call a specific tool with enhanced error handling
   */
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      const error = new ToolExecutionError(
        `Tool '${name}' not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`,
        name,
        ErrorCode.TOOL_NOT_FOUND,
        { 
          additionalInfo: { 
            requestedTool: name,
            availableTools: Array.from(this.tools.keys()),
            providedArgs: args
          } 
        }
      );
      await globalErrorHandler.handleError(error, { toolName: name });
      throw error; // This line should never be reached
    }

    try {
      logger.info(`Executing tool: ${name}`, { 
        toolName: name,
        argsCount: Object.keys(args).length,
        // Don't log full args to avoid sensitive data in logs
      });
      
      const result = await tool.execute(args);
      
      logger.info(`Tool execution completed successfully: ${name}`, {
        toolName: name,
        hasResult: !!result,
        resultType: typeof result,
      });
      
      return result;
    } catch (error) {
      // Enhanced error context for tool execution failures
      const errorContext = {
        toolName: name,
        additionalInfo: {
          argsProvided: Object.keys(args),
          toolExists: true,
          executionStage: 'tool_execution',
        },
      };

      // Use global error handler for consistent error processing
      try {
        await globalErrorHandler.handleError(error, errorContext);
      } catch (handledError) {
        // Log the final error state
        logger.error(`Tool execution failed: ${name}`, {
          toolName: name,
          error: handledError instanceof SuperAugmentError ? handledError.toJSON() : handledError,
        });
        throw handledError;
      }
    }
  }

  /**
   * Get a specific tool
   */
  getTool(name: string): SuperAugmentTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get schema conversion statistics
   */
  getSchemaConversionStats() {
    return this.schemaConverter.getStats();
  }

  /**
   * Clear schema conversion cache
   */
  clearSchemaCache(): void {
    this.schemaConverter.clearCache();
    logger.info('Schema conversion cache cleared');
  }
}
