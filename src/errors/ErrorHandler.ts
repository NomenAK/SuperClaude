/**
 * SuperAugment Error Handler
 * 
 * Provides centralized error handling, logging, and recovery mechanisms
 * for the SuperAugment MCP server.
 */

import { logger } from '../utils/logger.js';
import {
  SuperAugmentError,
  ErrorCode,
  ErrorSeverity,
  type ErrorContext,
  isSuperAugmentError,
  wrapError,
} from './ErrorTypes.js';

/**
 * Error handling configuration
 */
export interface ErrorHandlerConfig {
  enableRetry: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  enableMetrics: boolean;
}

/**
 * Default error handler configuration
 */
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableRetry: true,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  enableCircuitBreaker: true,
  circuitBreakerThreshold: 5,
  enableMetrics: true,
};

/**
 * Error metrics for monitoring and analysis
 */
interface ErrorMetrics {
  totalErrors: number;
  errorsByCode: Map<ErrorCode, number>;
  errorsBySeverity: Map<ErrorSeverity, number>;
  errorsByTool: Map<string, number>;
  recentErrors: SuperAugmentError[];
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  consecutiveFailures: number;
  lastFailureTime?: Date;
}

/**
 * Retry strategy interface
 */
interface RetryStrategy {
  shouldRetry(error: SuperAugmentError, attempt: number): boolean;
  getDelay(attempt: number): number;
}

/**
 * Default retry strategy with exponential backoff
 */
class ExponentialBackoffRetryStrategy implements RetryStrategy {
  constructor(
    private maxAttempts: number = 3,
    private baseDelayMs: number = 1000,
    private maxDelayMs: number = 10000
  ) {}

  shouldRetry(error: SuperAugmentError, attempt: number): boolean {
    return error.isRetryable && attempt < this.maxAttempts;
  }

  getDelay(attempt: number): number {
    const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
    return Math.min(delay, this.maxDelayMs);
  }
}

/**
 * Centralized error handler for SuperAugment
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private metrics: ErrorMetrics;
  private retryStrategy: RetryStrategy;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      totalErrors: 0,
      errorsByCode: new Map(),
      errorsBySeverity: new Map(),
      errorsByTool: new Map(),
      recentErrors: [],
      circuitBreakerState: 'closed',
      consecutiveFailures: 0,
    };
    this.retryStrategy = new ExponentialBackoffRetryStrategy(
      this.config.maxRetryAttempts,
      this.config.retryDelayMs
    );
  }

  /**
   * Handle an error with full processing pipeline
   */
  async handleError(
    error: unknown,
    context: ErrorContext = {},
    operation?: () => Promise<any>
  ): Promise<any> {
    const superAugmentError = this.normalizeError(error, context);
    
    // Update metrics
    this.updateMetrics(superAugmentError);
    
    // Log the error
    this.logError(superAugmentError);
    
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      throw new SuperAugmentError(
        'Service temporarily unavailable due to repeated failures',
        ErrorCode.RESOURCE_EXHAUSTED,
        ErrorSeverity.HIGH,
        context
      );
    }
    
    // Attempt retry if applicable and operation is provided
    if (operation && this.shouldRetry(superAugmentError)) {
      return this.executeWithRetry(operation, superAugmentError, context);
    }
    
    // Update circuit breaker state
    this.updateCircuitBreaker(superAugmentError);
    
    throw superAugmentError;
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry(
    operation: () => Promise<any>,
    originalError: SuperAugmentError,
    context: ErrorContext
  ): Promise<any> {
    let lastError = originalError;
    
    for (let attempt = 1; attempt <= this.config.maxRetryAttempts; attempt++) {
      if (!this.retryStrategy.shouldRetry(lastError, attempt)) {
        break;
      }
      
      // Wait before retry
      const delay = this.retryStrategy.getDelay(attempt);
      await this.sleep(delay);
      
      try {
        logger.info(`Retrying operation, attempt ${attempt}/${this.config.maxRetryAttempts}`, {
          toolName: context.toolName,
          originalError: originalError.code,
          delay,
        });
        
        const result = await operation();
        
        // Success - reset circuit breaker
        this.resetCircuitBreaker();
        
        logger.info(`Operation succeeded on retry attempt ${attempt}`, {
          toolName: context.toolName,
        });
        
        return result;
      } catch (error) {
        lastError = this.normalizeError(error, context);
        this.updateMetrics(lastError);
        this.logError(lastError, `Retry attempt ${attempt} failed`);
      }
    }
    
    // All retries failed
    this.updateCircuitBreaker(lastError);
    throw lastError;
  }

  /**
   * Normalize any error to SuperAugmentError
   */
  private normalizeError(error: unknown, context: ErrorContext): SuperAugmentError {
    if (isSuperAugmentError(error)) {
      // Merge additional context
      return new SuperAugmentError(
        error.message,
        error.code,
        error.severity,
        { ...error.context, ...context },
        error.isRetryable,
        error.originalError
      );
    }
    
    return wrapError(error, undefined, ErrorCode.UNKNOWN_ERROR, context);
  }

  /**
   * Log error with appropriate level based on severity
   */
  private logError(error: SuperAugmentError, additionalMessage?: string): void {
    const logData = {
      ...error.toJSON(),
      additionalMessage,
    };
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('Critical error occurred', logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('High severity error occurred', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('Medium severity error occurred', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('Low severity error occurred', logData);
        break;
      default:
        logger.warn('Unknown severity error occurred', logData);
    }
  }

  /**
   * Update error metrics
   */
  private updateMetrics(error: SuperAugmentError): void {
    if (!this.config.enableMetrics) {
      return;
    }
    
    this.metrics.totalErrors++;
    
    // Update error count by code
    const codeCount = this.metrics.errorsByCode.get(error.code) || 0;
    this.metrics.errorsByCode.set(error.code, codeCount + 1);
    
    // Update error count by severity
    const severityCount = this.metrics.errorsBySeverity.get(error.severity) || 0;
    this.metrics.errorsBySeverity.set(error.severity, severityCount + 1);
    
    // Update error count by tool
    if (error.context.toolName) {
      const toolCount = this.metrics.errorsByTool.get(error.context.toolName) || 0;
      this.metrics.errorsByTool.set(error.context.toolName, toolCount + 1);
    }
    
    // Keep recent errors (last 100)
    this.metrics.recentErrors.push(error);
    if (this.metrics.recentErrors.length > 100) {
      this.metrics.recentErrors.shift();
    }
  }

  /**
   * Check if circuit breaker should be open
   */
  private isCircuitBreakerOpen(): boolean {
    if (!this.config.enableCircuitBreaker) {
      return false;
    }
    
    return this.metrics.circuitBreakerState === 'open';
  }

  /**
   * Update circuit breaker state based on error
   */
  private updateCircuitBreaker(error: SuperAugmentError): void {
    if (!this.config.enableCircuitBreaker) {
      return;
    }
    
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      this.metrics.consecutiveFailures++;
      this.metrics.lastFailureTime = new Date();
      
      if (this.metrics.consecutiveFailures >= this.config.circuitBreakerThreshold) {
        this.metrics.circuitBreakerState = 'open';
        logger.warn('Circuit breaker opened due to consecutive failures', {
          consecutiveFailures: this.metrics.consecutiveFailures,
          threshold: this.config.circuitBreakerThreshold,
        });
      }
    }
  }

  /**
   * Reset circuit breaker after successful operation
   */
  private resetCircuitBreaker(): void {
    if (this.metrics.circuitBreakerState !== 'closed') {
      this.metrics.circuitBreakerState = 'closed';
      this.metrics.consecutiveFailures = 0;
      logger.info('Circuit breaker reset after successful operation');
    }
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(error: SuperAugmentError): boolean {
    return this.config.enableRetry && error.isRetryable;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset error metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByCode: new Map(),
      errorsBySeverity: new Map(),
      errorsByTool: new Map(),
      recentErrors: [],
      circuitBreakerState: 'closed',
      consecutiveFailures: 0,
    };
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics(): Record<string, any> {
    return {
      totalErrors: this.metrics.totalErrors,
      errorsByCode: Object.fromEntries(this.metrics.errorsByCode),
      errorsBySeverity: Object.fromEntries(this.metrics.errorsBySeverity),
      errorsByTool: Object.fromEntries(this.metrics.errorsByTool),
      circuitBreakerState: this.metrics.circuitBreakerState,
      consecutiveFailures: this.metrics.consecutiveFailures,
      recentErrorsCount: this.metrics.recentErrors.length,
      lastFailureTime: this.metrics.lastFailureTime,
    };
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ErrorHandler();

/**
 * Utility function to handle errors in async operations
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    await globalErrorHandler.handleError(error, context, operation);
    throw error; // This line should never be reached due to handleError throwing
  }
}

/**
 * Decorator for automatic error handling in class methods
 */
export function HandleErrors(context: ErrorContext = {}) {
  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        const errorContext = {
          ...context,
          toolName: context.toolName || (this as any).name || this.constructor.name,
        };
        await globalErrorHandler.handleError(error, errorContext);
      }
    };
  };
}
