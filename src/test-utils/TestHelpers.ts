/**
 * SuperAugment Test Helpers
 * 
 * Provides comprehensive testing utilities for unit tests, integration tests,
 * and end-to-end testing scenarios. Designed to be reusable and maintainable.
 */

import { jest } from '@jest/globals';
import { ConfigManager } from '../config/ConfigManager.js';
import { FileSystemManager } from '../utils/FileSystemManager.js';
import { SchemaConverter } from '../utils/SchemaConverter.js';
import { ErrorHandler } from '../errors/ErrorHandler.js';
import { ToolManager } from '../tools/ToolManager.js';
import { z } from 'zod';

/**
 * Test configuration options
 */
export interface TestConfig {
  enableLogging: boolean;
  mockFileSystem: boolean;
  mockNetwork: boolean;
  tempDirectory: string;
}

/**
 * Mock file system structure
 */
export interface MockFileStructure {
  [path: string]: string | MockFileStructure;
}

/**
 * Test assertion helpers
 */
export class TestAssertions {
  /**
   * Assert that an error is of a specific type
   */
  static assertErrorType<T extends Error>(
    error: unknown,
    errorClass: new (...args: any[]) => T
  ): asserts error is T {
    expect(error).toBeInstanceOf(errorClass);
  }

  /**
   * Assert that a promise rejects with a specific error type
   */
  static async assertRejects<T extends Error>(
    promise: Promise<any>,
    errorClass: new (...args: any[]) => T
  ): Promise<T> {
    try {
      await promise;
      throw new Error('Expected promise to reject');
    } catch (error) {
      TestAssertions.assertErrorType(error, errorClass);
      return error;
    }
  }

  /**
   * Assert that an object has specific properties
   */
  static assertHasProperties<T extends object>(
    obj: T,
    properties: (keyof T)[]
  ): void {
    for (const prop of properties) {
      expect(obj).toHaveProperty(prop as string);
    }
  }

  /**
   * Assert that a schema conversion is valid
   */
  static assertValidJsonSchema(schema: any): void {
    expect(schema).toHaveProperty('type');
    expect(schema.type).toBe('object');
    expect(schema).toHaveProperty('properties');
    expect(typeof schema.properties).toBe('object');
  }
}

/**
 * Mock factory for creating test doubles
 */
export class MockFactory {
  /**
   * Create a mock ConfigManager
   */
  static createMockConfigManager(overrides: Partial<any> = {}): jest.Mocked<ConfigManager> {
    const mockConfig = {
      tools: {
        enabled: true,
        timeout: 30000,
        maxConcurrency: 5,
      },
      logging: {
        level: 'info',
        enableConsole: true,
        enableFile: false,
      },
      ...overrides,
    };

    const mock = {
      getConfig: jest.fn().mockReturnValue(mockConfig),
      get: jest.fn().mockImplementation((...args: any[]) => {
        const key = args[0] as string;
        const keys = key.split('.');
        let value: any = mockConfig;
        for (const k of keys) {
          value = value?.[k];
        }
        return value;
      }),
      set: jest.fn(),
      reload: jest.fn(),
      validate: jest.fn().mockReturnValue(true),
      getHealthStatus: jest.fn().mockReturnValue({
        isHealthy: true,
        lastValidation: new Date(),
        validationErrors: [],
      }),
    } as unknown as jest.Mocked<ConfigManager>;

    return mock;
  }

  /**
   * Create a mock FileSystemManager
   */
  static createMockFileSystemManager(
    mockFiles: MockFileStructure = {}
  ): any {
    const mock = {
      readFileContent: jest.fn().mockImplementation((...args: any[]) => {
        const path = args[0] as string;
        const content = this.getMockFileContent(mockFiles, path);
        if (content === undefined) {
          throw new Error(`File not found: ${path}`);
        }
        return Promise.resolve(content);
      }),
      writeFileContent: jest.fn(),
      fileExists: jest.fn().mockImplementation((...args: any[]) => {
        const path = args[0] as string;
        return Promise.resolve(this.getMockFileContent(mockFiles, path) !== undefined);
      }),
      findFiles: jest.fn(),
      readMultipleFiles: jest.fn(),
      getCacheStats: jest.fn().mockReturnValue({
        totalEntries: 0,
        totalSize: 0,
        hitCount: 0,
        missCount: 0,
        evictionCount: 0,
        hitRate: 0,
        memoryUsage: 0,
        maxMemoryUsage: 256 * 1024 * 1024,
      }),
      clearCache: jest.fn(),
      invalidateFile: jest.fn().mockReturnValue(true),
      getFileStats: jest.fn(),
      cleanup: jest.fn(),
    } as unknown as jest.Mocked<FileSystemManager>;

    return mock;
  }

  /**
   * Get mock file content from structure
   */
  private static getMockFileContent(
    structure: MockFileStructure,
    path: string
  ): string | undefined {
    const parts = path.split('/').filter(p => p);
    let current: MockFileStructure | string = structure;

    for (const part of parts) {
      if (typeof current === 'string') {
        return undefined;
      }
      const next: string | MockFileStructure | undefined = current[part];
      if (next === undefined) {
        return undefined;
      }
      current = next;
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Create a mock SchemaConverter
   */
  static createMockSchemaConverter(): jest.Mocked<SchemaConverter> {
    const mock = {
      convertZodToJsonSchema: jest.fn().mockReturnValue({
        type: 'object',
        properties: {},
        additionalProperties: false,
      }),
      convertZodTypeToProperty: jest.fn().mockReturnValue({
        type: 'string',
        description: 'Mock property',
      }),
      getStats: jest.fn().mockReturnValue({
        totalProperties: 0,
        successfulConversions: 0,
        failedConversions: 0,
        unsupportedTypes: [],
        conversionTime: 0,
      }),
      clearCache: jest.fn(),
    } as unknown as jest.Mocked<SchemaConverter>;

    return mock;
  }

  /**
   * Create a mock ErrorHandler
   */
  static createMockErrorHandler(): any {
    const mock = {
      handleError: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        totalErrors: 0,
        errorsByType: {},
        errorsBySeverity: {},
        retryAttempts: 0,
        circuitBreakerTrips: 0,
      }),
      resetStats: jest.fn(),
      isCircuitBreakerOpen: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<ErrorHandler>;

    return mock;
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  /**
   * Generate a sample Zod schema for testing
   */
  static createSampleZodSchema() {
    return z.object({
      name: z.string().describe('The name of the item'),
      age: z.number().int().min(0).max(150).describe('Age in years'),
      email: z.string().email().optional().describe('Email address'),
      tags: z.array(z.string()).default([]).describe('List of tags'),
      isActive: z.boolean().default(true).describe('Whether the item is active'),
      category: z.enum(['A', 'B', 'C']).describe('Category selection'),
    });
  }

  /**
   * Generate sample C++ code for testing
   */
  static createSampleCppCode(): string {
    return `
#include <iostream>
#include <vector>
#include <string>

class Calculator {
private:
    std::vector<double> history;

public:
    double add(double a, double b) {
        double result = a + b;
        history.push_back(result);
        return result;
    }

    double multiply(double a, double b) {
        double result = a * b;
        history.push_back(result);
        return result;
    }

    void printHistory() const {
        for (const auto& value : history) {
            std::cout << value << std::endl;
        }
    }
};

int main() {
    Calculator calc;
    double sum = calc.add(5.0, 3.0);
    double product = calc.multiply(sum, 2.0);
    calc.printHistory();
    return 0;
}
    `.trim();
  }

  /**
   * Generate sample TypeScript code for testing
   */
  static createSampleTypeScriptCode(): string {
    return `
interface User {
  id: number;
  name: string;
  email?: string;
}

class UserManager {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  findUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getAllUsers(): User[] {
    return [...this.users];
  }
}

export { User, UserManager };
    `.trim();
  }

  /**
   * Generate sample configuration for testing
   */
  static createSampleConfig() {
    return {
      tools: {
        enabled: true,
        timeout: 30000,
        maxConcurrency: 5,
        analysis: {
          enableCpp: true,
          enableTypeScript: true,
          enablePython: true,
        },
      },
      logging: {
        level: 'info',
        enableConsole: true,
        enableFile: false,
        maxFileSize: '10MB',
      },
      cache: {
        enabled: true,
        maxMemoryUsage: '256MB',
        maxEntries: 10000,
        ttl: '30m',
      },
    };
  }
}

/**
 * Test environment setup and teardown
 */
export class TestEnvironment {
  private static originalEnv: Record<string, string | undefined> = {};

  /**
   * Setup test environment
   */
  static setup(config: Partial<TestConfig> = {}): void {
    const defaultConfig: TestConfig = {
      enableLogging: false,
      mockFileSystem: true,
      mockNetwork: true,
      tempDirectory: '/tmp/superaugment-test',
    };

    const testConfig = { ...defaultConfig, ...config };

    // Store original environment
    this.originalEnv = { ...process.env };

    // Set test environment variables
    process.env['NODE_ENV'] = 'test';
    process.env['LOG_LEVEL'] = testConfig.enableLogging ? 'debug' : 'silent';
    process.env['TEMP_DIR'] = testConfig.tempDirectory;

    // Mock console if logging is disabled
    if (!testConfig.enableLogging) {
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'info').mockImplementation(() => {});
      jest.spyOn(console, 'debug').mockImplementation(() => {});
    }
  }

  /**
   * Teardown test environment
   */
  static teardown(): void {
    // Restore original environment
    process.env = { ...this.originalEnv };

    // Restore console
    jest.restoreAllMocks();
  }

  /**
   * Create a temporary test directory
   */
  static async createTempDir(): Promise<string> {
    const tempDir = `/tmp/superaugment-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // In a real implementation, you would create the directory
    // For testing, we'll just return the path
    return tempDir;
  }

  /**
   * Clean up temporary test directory
   */
  static async cleanupTempDir(_path: string): Promise<void> {
    // In a real implementation, you would remove the directory
    // For testing, this is a no-op
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T> | T
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }

  /**
   * Assert that a function executes within a time limit
   */
  static async assertExecutionTime<T>(
    fn: () => Promise<T> | T,
    maxDuration: number
  ): Promise<T> {
    const { result, duration } = await this.measureExecutionTime(fn);
    expect(duration).toBeLessThanOrEqual(maxDuration);
    return result;
  }

  /**
   * Run a function multiple times and get statistics
   */
  static async benchmarkFunction<T>(
    fn: () => Promise<T> | T,
    iterations: number = 10
  ): Promise<{
    results: T[];
    durations: number[];
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
  }> {
    const results: T[] = [];
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { result, duration } = await this.measureExecutionTime(fn);
      results.push(result);
      durations.push(duration);
    }

    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    return {
      results,
      durations,
      averageDuration,
      minDuration,
      maxDuration,
    };
  }
}

/**
 * Integration test helpers
 */
export class IntegrationTestHelpers {
  /**
   * Create a full ToolManager instance for integration testing
   */
  static async createTestToolManager(
    configOverrides: any = {}
  ): Promise<ToolManager> {
    const mockConfig = MockFactory.createMockConfigManager(configOverrides);
    const toolManager = new ToolManager(mockConfig);
    await toolManager.initialize();
    return toolManager;
  }

  /**
   * Test MCP protocol compatibility
   */
  static async testMcpCompatibility(toolManager: ToolManager): Promise<void> {
    const tools = await toolManager.listTools();
    
    // Verify all tools have required MCP properties
    for (const tool of tools) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      
      TestAssertions.assertValidJsonSchema(tool.inputSchema);
    }
  }

  /**
   * Test tool execution with sample data
   */
  static async testToolExecution(
    toolManager: ToolManager,
    toolName: string,
    args: any
  ): Promise<any> {
    const result = await toolManager.callTool(toolName, args);
    expect(result).toBeDefined();
    return result;
  }
}
