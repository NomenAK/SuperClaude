/**
 * SuperAugment Error Types
 * 
 * Defines standardized error types and error codes for consistent error handling
 * across all tools and components in the SuperAugment MCP server.
 */

/**
 * Standard error codes for SuperAugment
 */
export enum ErrorCode {
  // General errors (1000-1099)
  UNKNOWN_ERROR = 1000,
  INVALID_INPUT = 1001,
  INVALID_CONFIGURATION = 1002,
  INITIALIZATION_FAILED = 1003,

  // Tool execution errors (1100-1199)
  TOOL_NOT_FOUND = 1100,
  TOOL_EXECUTION_FAILED = 1101,
  TOOL_TIMEOUT = 1102,
  TOOL_INVALID_ARGUMENTS = 1103,

  // File system errors (1200-1299)
  FILE_NOT_FOUND = 1200,
  FILE_READ_ERROR = 1201,
  FILE_WRITE_ERROR = 1202,
  DIRECTORY_NOT_FOUND = 1203,
  PERMISSION_DENIED = 1204,
  FILE_TOO_LARGE = 1205,

  // Configuration errors (1300-1399)
  CONFIG_LOAD_FAILED = 1300,
  CONFIG_VALIDATION_FAILED = 1301,
  CONFIG_FILE_NOT_FOUND = 1302,
  CONFIG_PARSE_ERROR = 1303,
  VALIDATION_FAILED = 1304,

  // Analysis errors (1400-1499)
  ANALYSIS_FAILED = 1400,
  UNSUPPORTED_FILE_TYPE = 1401,
  PARSING_ERROR = 1402,
  ANALYSIS_TIMEOUT = 1403,

  // Resource errors (1500-1599)
  RESOURCE_NOT_FOUND = 1500,
  RESOURCE_ACCESS_DENIED = 1501,
  RESOURCE_CORRUPTED = 1502,

  // Network/External errors (1600-1699)
  NETWORK_ERROR = 1600,
  EXTERNAL_SERVICE_ERROR = 1601,
  TIMEOUT_ERROR = 1602,

  // Memory/Performance errors (1700-1799)
  OUT_OF_MEMORY = 1700,
  PERFORMANCE_THRESHOLD_EXCEEDED = 1701,
  RESOURCE_EXHAUSTED = 1702,
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error context interface for additional error information
 */
export interface ErrorContext {
  toolName?: string;
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  stackTrace?: string;
  additionalInfo?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

/**
 * Base SuperAugment error class
 */
export class SuperAugmentError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly isRetryable: boolean;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: ErrorCode,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {},
    isRetryable: boolean = false,
    originalError?: Error
  ) {
    super(message);
    this.name = 'SuperAugmentError';
    this.code = code;
    this.severity = severity;
    this.context = {
      ...context,
      timestamp: context.timestamp || new Date(),
    };
    this.isRetryable = isRetryable;
    if (originalError) {
      this.originalError = originalError;
    }

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SuperAugmentError);
    }
  }

  /**
   * Convert error to JSON for logging and serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      isRetryable: this.isRetryable,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : undefined,
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case ErrorCode.FILE_NOT_FOUND:
        return `File not found: ${this.context.filePath || 'unknown'}`;
      case ErrorCode.FILE_TOO_LARGE:
        return 'File is too large to process. Please try with a smaller file.';
      case ErrorCode.TOOL_NOT_FOUND:
        return `Tool '${this.context.toolName || 'unknown'}' is not available.`;
      case ErrorCode.INVALID_INPUT:
        return 'Invalid input provided. Please check your parameters.';
      case ErrorCode.OUT_OF_MEMORY:
        return 'Not enough memory to complete the operation. Please try with smaller files.';
      default:
        return this.message;
    }
  }
}

/**
 * Tool execution specific error
 */
export class ToolExecutionError extends SuperAugmentError {
  constructor(
    message: string,
    toolName: string,
    code: ErrorCode = ErrorCode.TOOL_EXECUTION_FAILED,
    context: ErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      code,
      ErrorSeverity.HIGH,
      { ...context, toolName },
      false,
      originalError
    );
    this.name = 'ToolExecutionError';
  }
}

/**
 * File system specific error
 */
export class FileSystemError extends SuperAugmentError {
  constructor(
    message: string,
    filePath: string,
    code: ErrorCode,
    context: ErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      code,
      ErrorSeverity.MEDIUM,
      { ...context, filePath },
      true, // File system errors are often retryable
      originalError
    );
    this.name = 'FileSystemError';
  }
}

/**
 * Configuration specific error
 */
export class ConfigurationError extends SuperAugmentError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.CONFIG_VALIDATION_FAILED,
    context: ErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      code,
      ErrorSeverity.HIGH,
      context,
      false, // Configuration errors are usually not retryable
      originalError
    );
    this.name = 'ConfigurationError';
  }
}

/**
 * Analysis specific error
 */
export class AnalysisError extends SuperAugmentError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.ANALYSIS_FAILED,
    context: ErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      code,
      ErrorSeverity.MEDIUM,
      context,
      true, // Analysis errors might be retryable
      originalError
    );
    this.name = 'AnalysisError';
  }
}

/**
 * Resource specific error
 */
export class ResourceError extends SuperAugmentError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND,
    context: ErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      code,
      ErrorSeverity.MEDIUM,
      context,
      true, // Resource errors might be retryable
      originalError
    );
    this.name = 'ResourceError';
  }
}

/**
 * Performance specific error
 */
export class PerformanceError extends SuperAugmentError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.PERFORMANCE_THRESHOLD_EXCEEDED,
    context: ErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      code,
      ErrorSeverity.HIGH,
      context,
      false, // Performance errors are usually not retryable
      originalError
    );
    this.name = 'PerformanceError';
  }
}

/**
 * Utility function to check if an error is a SuperAugment error
 */
export function isSuperAugmentError(error: any): error is SuperAugmentError {
  return error instanceof SuperAugmentError;
}

/**
 * Utility function to wrap unknown errors into SuperAugment errors
 */
export function wrapError(
  error: unknown,
  message?: string,
  code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  context: ErrorContext = {}
): SuperAugmentError {
  if (isSuperAugmentError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new SuperAugmentError(
      message || error.message,
      code,
      ErrorSeverity.MEDIUM,
      context,
      false,
      error
    );
  }

  return new SuperAugmentError(
    message || 'Unknown error occurred',
    code,
    ErrorSeverity.MEDIUM,
    context
  );
}
