import { AnalyzeCodeTool } from '../analysis/AnalyzeCodeTool.js';
import { ConfigManager } from '../../config/ConfigManager.js';

// Mock the ConfigManager
jest.mock('../../config/ConfigManager.js');
jest.mock('../../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AnalyzeCodeTool', () => {
  let tool: AnalyzeCodeTool;
  let mockConfigManager: jest.Mocked<ConfigManager>;

  beforeEach(() => {
    mockConfigManager = new ConfigManager() as jest.Mocked<ConfigManager>;
    mockConfigManager.getPersona = jest.fn();
    tool = new AnalyzeCodeTool(mockConfigManager);
  });

  describe('execute', () => {
    it('should analyze code without persona', async () => {
      const args = {
        code: 'function test() { return "hello"; }',
        depth: 'detailed' as const,
      };

      const result = await tool.execute(args);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Code Analysis Report');
    });

    it('should analyze code with architect persona', async () => {
      const mockPersona = {
        name: 'architect',
        description: 'Senior software architect',
        expertise: ['System architecture', 'Design patterns'],
        approach: 'Think holistically about system design',
      };

      mockConfigManager.getPersona.mockReturnValue(mockPersona);

      const args = {
        code: 'function test() { return "hello"; }',
        persona: 'architect',
        depth: 'comprehensive' as const,
      };

      const result = await tool.execute(args);

      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('architect');
      expect(mockConfigManager.getPersona).toHaveBeenCalledWith('architect');
    });

    it('should analyze code with focus areas', async () => {
      const args = {
        code: 'function test() { console.log("debug"); return "hello"; }',
        focus: ['security', 'performance'],
        depth: 'detailed' as const,
      };

      const result = await tool.execute(args);

      expect(result).toBeDefined();
      expect(result.content[0].text).toContain('Code Analysis Report');
    });

    it('should detect console.log issues', async () => {
      const args = {
        code: 'function test() { console.log("debug"); return "hello"; }',
        depth: 'basic' as const,
      };

      const result = await tool.execute(args);

      expect(result.content[0].text).toContain('Console.log statements found');
    });

    it('should detect var usage issues', async () => {
      const args = {
        code: 'var oldStyle = "should use let/const";',
        depth: 'basic' as const,
      };

      const result = await tool.execute(args);

      expect(result.content[0].text).toContain('Consider using let/const instead of var');
    });

    it('should detect security issues when focused on security', async () => {
      const args = {
        code: 'function dangerous() { eval("some code"); }',
        focus: ['security'],
        depth: 'detailed' as const,
      };

      const result = await tool.execute(args);

      expect(result.content[0].text).toContain('Use of eval() is dangerous');
    });

    it('should provide comprehensive suggestions for comprehensive depth', async () => {
      const args = {
        code: 'function test() { return "hello"; }',
        depth: 'comprehensive' as const,
      };

      const result = await tool.execute(args);

      expect(result.content[0].text).toContain('Suggestions');
      expect(result.content[0].text).toContain('performance');
      expect(result.content[0].text).toContain('maintainability');
    });

    it('should calculate basic metrics', async () => {
      const args = {
        code: 'function test() {\n  return "hello";\n}',
        depth: 'detailed' as const,
      };

      const result = await tool.execute(args);

      expect(result.content[0].text).toContain('Metrics');
      expect(result.content[0].text).toContain('lines of code');
    });

    it('should handle invalid input gracefully', async () => {
      const args = {
        // Missing required fields
        depth: 'detailed' as const,
      };

      await expect(tool.execute(args)).rejects.toThrow();
    });

    it('should apply persona-specific insights', async () => {
      const mockPersona = {
        name: 'security',
        description: 'Cybersecurity expert',
        expertise: ['Vulnerability assessment', 'Secure coding'],
        approach: 'Security-first mindset',
      };

      mockConfigManager.getPersona.mockReturnValue(mockPersona);

      const args = {
        code: 'function test() { return "hello"; }',
        persona: 'security',
        depth: 'detailed' as const,
      };

      const result = await tool.execute(args);

      expect(result.content[0].text).toContain('Persona Insights');
      expect(result.content[0].text).toContain('security');
    });
  });

  describe('tool properties', () => {
    it('should have correct name', () => {
      expect(tool.name).toBe('analyze_code');
    });

    it('should have description', () => {
      expect(tool.description).toBeDefined();
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('should have input schema', () => {
      expect(tool.inputSchema).toBeDefined();
    });
  });
});
