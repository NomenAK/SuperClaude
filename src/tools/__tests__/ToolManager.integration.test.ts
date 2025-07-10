/**
 * ToolManager Integration Tests
 * 
 * Comprehensive integration tests for the ToolManager class to ensure
 * proper tool registration, schema conversion, and MCP compatibility.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ToolManager } from '../ToolManager.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { ToolExecutionError } from '../../errors/ErrorTypes.js';
import { 
  TestEnvironment, 
  MockFactory,
  TestAssertions,
  IntegrationTestHelpers,
  PerformanceTestUtils 
} from '../../test-utils/TestHelpers.js';

describe('ToolManager Integration Tests', () => {
  let toolManager: ToolManager;
  let mockConfigManager: jest.Mocked<ConfigManager>;

  beforeEach(async () => {
    TestEnvironment.setup();
    mockConfigManager = MockFactory.createMockConfigManager({
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
    });
    
    toolManager = new ToolManager(mockConfigManager);
    await toolManager.initialize();
  });

  afterEach(() => {
    TestEnvironment.teardown();
  });

  describe('Tool Registration', () => {
    it('should register all expected tools', async () => {
      const toolNames = toolManager.getToolNames();

      expect(toolNames).toContain('analyze-code');
      expect(toolNames).toContain('analyze-project');
      expect(toolNames).toContain('review-code');
      expect(toolNames).toContain('security-scan');
      expect(toolNames).toContain('analyze-cpp');
      expect(toolNames).toContain('build-project');
      expect(toolNames).toContain('test-project');
      expect(toolNames).toContain('deploy-application');

      expect(toolNames.length).toBeGreaterThanOrEqual(8);
    });

    it('should retrieve individual tools correctly', () => {
      const analyzeTool = toolManager.getTool('analyze-code');
      expect(analyzeTool).toBeDefined();
      expect(analyzeTool?.name).toBe('analyze-code');
      expect(analyzeTool?.description).toBeDefined();
      expect(analyzeTool?.inputSchema).toBeDefined();
    });

    it('should return undefined for non-existent tools', () => {
      const nonExistentTool = toolManager.getTool('non-existent-tool');
      expect(nonExistentTool).toBeUndefined();
    });
  });

  describe('MCP Protocol Compatibility', () => {
    it('should list tools with valid MCP schemas', async () => {
      await IntegrationTestHelpers.testMcpCompatibility(toolManager);
    });

    it('should generate valid JSON schemas for all tools', async () => {
      const tools = await toolManager.listTools();

      for (const tool of tools) {
        TestAssertions.assertValidJsonSchema(tool.inputSchema);
        
        // Verify required MCP properties
        expect(tool.name).toBeDefined();
        expect(typeof tool.name).toBe('string');
        expect(tool.name.length).toBeGreaterThan(0);
        
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');
        expect(tool.description.length).toBeGreaterThan(0);
      }
    });

    it('should handle schema conversion errors gracefully', async () => {
      // Mock a tool with problematic schema
      const problematicTool = {
        name: 'problematic-tool',
        description: 'A tool with problematic schema',
        inputSchema: null, // This will cause conversion issues
        execute: jest.fn(),
      };

      // Register the problematic tool
      (toolManager as any).tools.set('problematic-tool', problematicTool);

      const tools = await toolManager.listTools();
      const problematicToolResult = tools.find(t => t.name === 'problematic-tool');

      expect(problematicToolResult).toBeDefined();
      expect(problematicToolResult?.inputSchema).toEqual({
        type: 'object',
        properties: {},
        additionalProperties: true,
      });
    });
  });

  describe('Schema Conversion', () => {
    it('should convert complex schemas correctly', async () => {
      const tools = await toolManager.listTools();
      const cppTool = tools.find(t => t.name === 'analyze-cpp');

      expect(cppTool).toBeDefined();
      expect(cppTool?.inputSchema.properties).toBeDefined();
      
      // Verify specific properties exist
      const properties = cppTool?.inputSchema.properties;
      expect(properties).toHaveProperty('filePath');
      expect(properties).toHaveProperty('cppStandard');
      expect(properties).toHaveProperty('analysisType');
    });

    it('should include descriptions in schemas', async () => {
      const tools = await toolManager.listTools();
      
      for (const tool of tools) {
        const properties = tool.inputSchema.properties;
        
        // At least some properties should have descriptions
        const propertiesWithDescriptions = Object.values(properties).filter(
          (prop: any) => prop.description
        );
        expect(propertiesWithDescriptions.length).toBeGreaterThan(0);
      }
    });

    it('should handle default values in schemas', async () => {
      const tools = await toolManager.listTools();
      
      // Find a tool that likely has default values
      const toolWithDefaults = tools.find(tool => {
        const properties = tool.inputSchema.properties;
        return Object.values(properties).some((prop: any) => prop.default !== undefined);
      });

      if (toolWithDefaults) {
        const propertiesWithDefaults = Object.values(toolWithDefaults.inputSchema.properties).filter(
          (prop: any) => prop.default !== undefined
        );
        expect(propertiesWithDefaults.length).toBeGreaterThan(0);
      }
    });

    it('should track schema conversion statistics', async () => {
      await toolManager.listTools();
      
      const stats = toolManager.getSchemaConversionStats();
      expect(stats).toBeDefined();
      expect(stats.totalProperties).toBeGreaterThan(0);
      expect(stats.successfulConversions).toBeGreaterThan(0);
      expect(stats.conversionTime).toBeGreaterThan(0);
    });

    it('should clear schema cache when requested', () => {
      toolManager.clearSchemaCache();
      
      // Should not throw and should work normally after cache clear
      expect(() => toolManager.clearSchemaCache()).not.toThrow();
    });
  });

  describe('Tool Execution', () => {
    it('should execute tools with valid arguments', async () => {
      // Mock the tool execution to avoid actual file operations
      const analyzeTool = toolManager.getTool('analyze-code');
      if (analyzeTool) {
        analyzeTool.execute = jest.fn().mockResolvedValue({
          analysis: 'mock analysis result',
          metrics: { lines: 100, complexity: 5 },
        });

        const result = await toolManager.callTool('analyze-code', {
          filePath: '/test/file.ts',
          analysisType: 'syntax',
        });

        expect(result).toBeDefined();
        expect(result.analysis).toBe('mock analysis result');
        expect(analyzeTool.execute).toHaveBeenCalledWith({
          filePath: '/test/file.ts',
          analysisType: 'syntax',
        });
      }
    });

    it('should handle tool execution errors', async () => {
      // Mock a tool that throws an error
      const analyzeTool = toolManager.getTool('analyze-code');
      if (analyzeTool) {
        analyzeTool.execute = jest.fn().mockRejectedValue(new Error('Execution failed'));

        await TestAssertions.assertRejects(
          toolManager.callTool('analyze-code', { filePath: '/test/file.ts' }),
          Error
        );
      }
    });

    it('should handle non-existent tool calls', async () => {
      await TestAssertions.assertRejects(
        toolManager.callTool('non-existent-tool', {}),
        ToolExecutionError
      );
    });

    it('should provide helpful error messages for missing tools', async () => {
      try {
        await toolManager.callTool('missing-tool', {});
      } catch (error) {
        expect(error).toBeInstanceOf(ToolExecutionError);
        const toolError = error as ToolExecutionError;
        expect(toolError.message).toContain('missing-tool');
        expect(toolError.message).toContain('Available tools:');
      }
    });
  });

  describe('Performance Tests', () => {
    it('should initialize tools within reasonable time', async () => {
      const newToolManager = new ToolManager(mockConfigManager);
      
      await PerformanceTestUtils.assertExecutionTime(
        () => newToolManager.initialize(),
        2000 // 2 seconds max
      );
    });

    it('should list tools efficiently', async () => {
      await PerformanceTestUtils.assertExecutionTime(
        () => toolManager.listTools(),
        1000 // 1 second max
      );
    });

    it('should handle concurrent tool listings', async () => {
      const promises = Array(10).fill(null).map(() => toolManager.listTools());
      
      const results = await Promise.all(promises);
      
      // All results should be identical
      const firstResult = results[0];
      for (const result of results) {
        expect(result).toEqual(firstResult);
      }
    });

    it('should benchmark schema conversion performance', async () => {
      const benchmark = await PerformanceTestUtils.benchmarkFunction(
        () => toolManager.listTools(),
        5
      );

      expect(benchmark.averageDuration).toBeLessThan(1000); // Average under 1 second
      expect(benchmark.maxDuration).toBeLessThan(2000); // Max under 2 seconds
    });
  });

  describe('Configuration Integration', () => {
    it('should respect configuration settings', () => {
      // Verify that the tool manager uses the provided config
      expect(mockConfigManager.getConfig).toHaveBeenCalled();
    });

    it('should handle configuration changes', async () => {
      // Update configuration
      mockConfigManager.get.mockReturnValue(false);
      
      // Tool manager should still function with updated config
      const tools = await toolManager.listTools();
      expect(tools).toBeDefined();
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should validate tool configuration', () => {
      // Verify that tools are properly configured
      const toolNames = toolManager.getToolNames();
      
      for (const toolName of toolNames) {
        const tool = toolManager.getTool(toolName);
        expect(tool).toBeDefined();
        expect(tool?.name).toBe(toolName);
        expect(tool?.description).toBeDefined();
        expect(tool?.inputSchema).toBeDefined();
        expect(typeof tool?.execute).toBe('function');
      }
    });
  });

  describe('Error Recovery', () => {
    it('should recover from individual tool failures during initialization', async () => {
      // Create a new tool manager with a mock that fails for one tool
      const failingConfigManager = MockFactory.createMockConfigManager();
      failingConfigManager.get.mockImplementation((key: string) => {
        if (key.includes('analyze-code')) {
          throw new Error('Configuration error');
        }
        return mockConfigManager.get(key);
      });

      const newToolManager = new ToolManager(failingConfigManager);
      
      // Should still initialize successfully
      await expect(newToolManager.initialize()).resolves.not.toThrow();
      
      // Should have some tools registered (excluding the failed one)
      const toolNames = newToolManager.getToolNames();
      expect(toolNames.length).toBeGreaterThan(0);
    });

    it('should handle schema conversion failures gracefully', async () => {
      // Force a schema conversion failure
      const originalConverter = (toolManager as any).schemaConverter;
      (toolManager as any).schemaConverter = {
        convertZodToJsonSchema: jest.fn().mockImplementation(() => {
          throw new Error('Schema conversion failed');
        }),
        getStats: jest.fn().mockReturnValue({
          totalProperties: 0,
          successfulConversions: 0,
          failedConversions: 1,
          unsupportedTypes: [],
          conversionTime: 0,
        }),
        clearCache: jest.fn(),
      };

      const tools = await toolManager.listTools();
      
      // Should still return tools with fallback schemas
      expect(tools).toBeDefined();
      expect(tools.length).toBeGreaterThan(0);
      
      for (const tool of tools) {
        expect(tool.inputSchema).toEqual({
          type: 'object',
          properties: {},
          additionalProperties: true,
        });
      }

      // Restore original converter
      (toolManager as any).schemaConverter = originalConverter;
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle a complete development workflow', async () => {
      // Simulate a typical development workflow
      const tools = await toolManager.listTools();
      
      // 1. Analyze code
      const analyzeCodeTool = tools.find(t => t.name === 'analyze-code');
      expect(analyzeCodeTool).toBeDefined();
      
      // 2. Review code
      const reviewCodeTool = tools.find(t => t.name === 'review-code');
      expect(reviewCodeTool).toBeDefined();
      
      // 3. Security scan
      const securityScanTool = tools.find(t => t.name === 'security-scan');
      expect(securityScanTool).toBeDefined();
      
      // 4. Build project
      const buildProjectTool = tools.find(t => t.name === 'build-project');
      expect(buildProjectTool).toBeDefined();
      
      // 5. Test project
      const testProjectTool = tools.find(t => t.name === 'test-project');
      expect(testProjectTool).toBeDefined();
      
      // All workflow tools should be available
      expect(analyzeCodeTool).toBeDefined();
      expect(reviewCodeTool).toBeDefined();
      expect(securityScanTool).toBeDefined();
      expect(buildProjectTool).toBeDefined();
      expect(testProjectTool).toBeDefined();
    });

    it('should support C++ development workflow', async () => {
      const tools = await toolManager.listTools();
      
      // C++ specific tool should be available
      const cppTool = tools.find(t => t.name === 'analyze-cpp');
      expect(cppTool).toBeDefined();
      
      // Should have proper schema for C++ analysis
      const schema = cppTool?.inputSchema;
      expect(schema?.properties).toHaveProperty('filePath');
      expect(schema?.properties).toHaveProperty('cppStandard');
      expect(schema?.properties).toHaveProperty('analysisType');
    });

    it('should handle multiple concurrent tool operations', async () => {
      // Mock multiple tools
      const tools = ['analyze-code', 'review-code', 'security-scan'];
      
      for (const toolName of tools) {
        const tool = toolManager.getTool(toolName);
        if (tool) {
          tool.execute = jest.fn().mockResolvedValue({ result: `${toolName} completed` });
        }
      }

      // Execute multiple tools concurrently
      const promises = tools.map(toolName => 
        toolManager.callTool(toolName, { filePath: '/test/file.ts' })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      for (let i = 0; i < results.length; i++) {
        expect(results[i].result).toBe(`${tools[i]} completed`);
      }
    });
  });
});
