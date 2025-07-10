/**
 * Base Tool Class for SuperAugment
 * 
 * Provides a standardized foundation for all SuperAugment tools with
 * unified error handling, logging, validation, and performance monitoring.
 */

import { z } from 'zod';
import type { SuperAugmentTool } from './ToolManager.js';
import type { ConfigManager } from '../config/ConfigManager.js';
import { logger } from '../utils/logger.js';
import {
  SuperAugmentError,
  ToolExecutionError,
  ErrorCode,
  type ErrorContext,
} from '../errors/ErrorTypes.js';
import { globalErrorHandler } from '../errors/ErrorHandler.js';

/**
 * Tool execution context for tracking and monitoring
 */
export interface ToolExecutionContext {
  startTime: Date;
  toolName: string;
  arguments: Record<string, any>;
  sessionId?: string;
  userId?: string;
  requestId?: string;
}

/**
 * Tool execution result with metadata
 */
export interface ToolExecutionResult {
  content: Array<{
    type: string;
    text?: string;
    data?: any;
  }>;
  metadata?: {
    executionTime: number;
    memoryUsage?: number;
    warnings?: string[];
    performance?: Record<string, any>;
  };
}

/**
 * Tool performance metrics
 */
interface ToolMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  lastExecutionTime?: Date;
  peakMemoryUsage: number;
}

/**
 * Abstract base class for all SuperAugment tools
 */
export abstract class BaseTool implements SuperAugmentTool {
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly inputSchema: z.ZodSchema<any>;

  protected readonly configManager: ConfigManager;
  private metrics: ToolMetrics;
  private readonly maxExecutionTime: number;
  private readonly maxMemoryUsage: number;

  constructor(
    configManager: ConfigManager,
    options: {
      maxExecutionTime?: number; // in milliseconds
      maxMemoryUsage?: number;   // in bytes
    } = {}
  ) {
    this.configManager = configManager;
    this.maxExecutionTime = options.maxExecutionTime || 300000; // 5 minutes default
    this.maxMemoryUsage = options.maxMemoryUsage || 512 * 1024 * 1024; // 512MB default
    
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      peakMemoryUsage: 0,
    };
  }

  /**
   * Main execution method with full error handling and monitoring
   */
  async execute(args: Record<string, any>): Promise<ToolExecutionResult> {
    const context: ToolExecutionContext = {
      startTime: new Date(),
      toolName: this.name,
      arguments: args,
      requestId: this.generateRequestId(),
    };

    try {
      // Pre-execution setup
      await this.preExecute(context);
      
      // Validate input
      const validatedArgs = await this.validateInput(args);
      
      // Execute with monitoring
      const result = await this.executeWithMonitoring(validatedArgs, context);
      
      // Post-execution cleanup
      await this.postExecute(context, result);
      
      return result;
    } catch (error) {
      await this.handleExecutionError(error, context);
      throw error; // Re-throw after handling
    }
  }

  /**
   * Abstract method that subclasses must implement
   */
  protected abstract executeInternal(
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult>;

  /**
   * Validate input arguments using the tool's schema
   */
  protected async validateInput(args: Record<string, any>): Promise<Record<string, any>> {
    try {
      return this.inputSchema.parse(args);
    } catch (error) {
      throw new ToolExecutionError(
        `Invalid input arguments for tool '${this.name}': ${error instanceof Error ? error.message : 'Unknown validation error'}`,
        this.name,
        ErrorCode.TOOL_INVALID_ARGUMENTS,
        { additionalInfo: { validationError: error, providedArgs: args } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Execute tool with performance monitoring and timeout
   */
  private async executeWithMonitoring(
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startMemory = process.memoryUsage();
    
    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new ToolExecutionError(
          `Tool '${this.name}' execution timed out after ${this.maxExecutionTime}ms`,
          this.name,
          ErrorCode.TOOL_TIMEOUT,
          { additionalInfo: { timeout: this.maxExecutionTime } }
        ));
      }, this.maxExecutionTime);
    });

    try {
      // Execute with timeout
      const result = await Promise.race([
        this.executeInternal(args, context),
        timeoutPromise
      ]);

      // Check memory usage
      const endMemory = process.memoryUsage();
      const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;
      
      if (memoryUsed > this.maxMemoryUsage) {
        logger.warn(`Tool '${this.name}' exceeded memory threshold`, {
          memoryUsed,
          maxMemoryUsage: this.maxMemoryUsage,
          toolName: this.name,
        });
      }

      // Update metrics
      this.updateMetrics(context, true, memoryUsed);

      // Add metadata to result
      const executionTime = Date.now() - context.startTime.getTime();
      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime,
          memoryUsage: memoryUsed,
        },
      };
    } catch (error) {
      this.updateMetrics(context, false);
      throw error;
    }
  }

  /**
   * Pre-execution hook for setup and validation
   */
  protected async preExecute(context: ToolExecutionContext): Promise<void> {
    logger.info(`Starting execution of tool '${this.name}'`, {
      toolName: this.name,
      requestId: context.requestId,
      arguments: this.sanitizeArgsForLogging(context.arguments),
    });

    // Check if tool is in a healthy state
    await this.healthCheck();
  }

  /**
   * Post-execution hook for cleanup and logging
   */
  protected async postExecute(
    context: ToolExecutionContext,
    _result: ToolExecutionResult
  ): Promise<void> {
    const executionTime = Date.now() - context.startTime.getTime();
    
    logger.info(`Completed execution of tool '${this.name}'`, {
      toolName: this.name,
      requestId: context.requestId,
      executionTime,
      success: true,
    });
  }

  /**
   * Handle execution errors with proper context and recovery
   */
  protected async handleExecutionError(
    error: unknown,
    context: ToolExecutionContext
  ): Promise<void> {
    const executionTime = Date.now() - context.startTime.getTime();
    
    const errorContext: ErrorContext = {
      toolName: this.name,
      additionalInfo: {
        requestId: context.requestId,
        executionTime,
        arguments: this.sanitizeArgsForLogging(context.arguments),
      },
    };

    // Use global error handler for consistent error processing
    try {
      await globalErrorHandler.handleError(error, errorContext);
    } catch (handledError) {
      // Log the final error state
      logger.error(`Tool '${this.name}' execution failed`, {
        toolName: this.name,
        requestId: context.requestId,
        executionTime,
        error: handledError instanceof SuperAugmentError ? handledError.toJSON() : handledError,
      });
      
      throw handledError;
    }
  }

  /**
   * Health check to ensure tool is ready for execution
   */
  protected async healthCheck(): Promise<void> {
    // Check if configuration is available
    if (!this.configManager) {
      throw new ToolExecutionError(
        `Tool '${this.name}' is not properly configured`,
        this.name,
        ErrorCode.INVALID_CONFIGURATION
      );
    }

    // Subclasses can override this for specific health checks
  }

  /**
   * Update tool execution metrics
   */
  private updateMetrics(
    context: ToolExecutionContext,
    success: boolean,
    memoryUsed: number = 0
  ): void {
    const executionTime = Date.now() - context.startTime.getTime();
    
    this.metrics.totalExecutions++;
    this.metrics.totalExecutionTime += executionTime;
    this.metrics.averageExecutionTime = this.metrics.totalExecutionTime / this.metrics.totalExecutions;
    this.metrics.lastExecutionTime = new Date();
    
    if (success) {
      this.metrics.successfulExecutions++;
    } else {
      this.metrics.failedExecutions++;
    }
    
    if (memoryUsed > this.metrics.peakMemoryUsage) {
      this.metrics.peakMemoryUsage = memoryUsed;
    }
  }

  /**
   * Sanitize arguments for logging (remove sensitive data)
   */
  protected sanitizeArgsForLogging(args: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    const sanitized = { ...args };
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get tool execution metrics
   */
  getMetrics(): ToolMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset tool metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      peakMemoryUsage: 0,
    };
  }

  /**
   * Get tool health status
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    metrics: ToolMetrics;
    lastError?: string;
  }> {
    try {
      await this.healthCheck();
      return {
        healthy: true,
        metrics: this.getMetrics(),
      };
    } catch (error) {
      return {
        healthy: false,
        metrics: this.getMetrics(),
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Utility method for creating standardized tool responses
   */
  protected createResponse(
    text: string,
    additionalContent: Array<{ type: string; text?: string; data?: any }> = [],
    metadata: Record<string, any> = {}
  ): ToolExecutionResult {
    return {
      content: [
        {
          type: 'text',
          text,
        },
        ...additionalContent,
      ],
      metadata: {
        executionTime: 0,
        ...metadata,
      },
    };
  }

  /**
   * Utility method for creating error responses
   */
  protected createErrorResponse(
    error: SuperAugmentError,
    includeDetails: boolean = false
  ): ToolExecutionResult {
    const userMessage = error.getUserMessage();
    const content: Array<{ type: string; text?: string; data?: any }> = [
      {
        type: 'text',
        text: `❌ ${userMessage}`,
      },
    ];

    if (includeDetails && error.context.additionalInfo) {
      content.push({
        type: 'text',
        text: `\n**Error Details:**\n${JSON.stringify(error.context.additionalInfo, null, 2)}`,
      });
    }

    return {
      content,
      metadata: {
        executionTime: 0,
        warnings: [`Error: ${error.code} - ${error.severity}`],
      },
    };
  }
}
