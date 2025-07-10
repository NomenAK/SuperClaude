import { ConfigManager } from '../ConfigManager.js';
import { readFile } from 'fs/promises';
import YAML from 'yaml';

// Mock fs/promises
jest.mock('fs/promises');
jest.mock('../../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should load configuration successfully', async () => {
      // Mock personas.yml
      const mockPersonas = {
        personas: [
          {
            name: 'architect',
            description: 'Senior software architect',
            expertise: ['System architecture', 'Design patterns'],
            approach: 'Think holistically about system design',
          },
        ],
      };

      // Mock tools.yml
      const mockTools = {
        tools: [
          {
            name: 'analyze_code',
            description: 'Analyze code for quality',
            category: 'analysis',
            parameters: {},
          },
        ],
      };

      // Mock patterns.yml
      const mockPatterns = {
        development: {
          best_practices: ['Use meaningful names'],
        },
      };

      // Mock settings.yml
      const mockSettings = {
        server: {
          name: 'SuperAugment',
          version: '1.0.0',
        },
      };

      mockReadFile
        .mockResolvedValueOnce(YAML.stringify(mockPersonas))
        .mockResolvedValueOnce(YAML.stringify(mockTools))
        .mockResolvedValueOnce(YAML.stringify(mockPatterns))
        .mockResolvedValueOnce(YAML.stringify(mockSettings));

      await configManager.initialize();

      const config = configManager.getConfig();
      expect(config.personas).toHaveLength(1);
      expect(config.tools).toHaveLength(1);
      expect(config.patterns).toBeDefined();
      expect(config.settings).toBeDefined();
    });

    it('should handle missing patterns file gracefully', async () => {
      const mockPersonas = { personas: [] };
      const mockTools = { tools: [] };
      const mockSettings = { server: {} };

      mockReadFile
        .mockResolvedValueOnce(YAML.stringify(mockPersonas))
        .mockResolvedValueOnce(YAML.stringify(mockTools))
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce(YAML.stringify(mockSettings));

      await configManager.initialize();

      const config = configManager.getConfig();
      expect(config.patterns).toEqual({});
    });

    it('should handle missing settings file gracefully', async () => {
      const mockPersonas = { personas: [] };
      const mockTools = { tools: [] };
      const mockPatterns = {};

      mockReadFile
        .mockResolvedValueOnce(YAML.stringify(mockPersonas))
        .mockResolvedValueOnce(YAML.stringify(mockTools))
        .mockResolvedValueOnce(YAML.stringify(mockPatterns))
        .mockRejectedValueOnce(new Error('File not found'));

      await configManager.initialize();

      const config = configManager.getConfig();
      expect(config.settings).toEqual({});
    });

    it('should throw error if personas file is missing', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      await expect(configManager.initialize()).rejects.toThrow();
    });

    it('should validate configuration schema', async () => {
      const invalidPersonas = {
        personas: [
          {
            // Missing required fields
            name: 'invalid',
          },
        ],
      };

      mockReadFile.mockResolvedValueOnce(YAML.stringify(invalidPersonas));

      await expect(configManager.initialize()).rejects.toThrow();
    });
  });

  describe('getPersonas', () => {
    beforeEach(async () => {
      const mockPersonas = {
        personas: [
          {
            name: 'architect',
            description: 'Senior software architect',
            expertise: ['System architecture'],
            approach: 'Think holistically',
          },
          {
            name: 'security',
            description: 'Cybersecurity expert',
            expertise: ['Vulnerability assessment'],
            approach: 'Security-first mindset',
          },
        ],
      };

      const mockTools = { tools: [] };

      mockReadFile
        .mockResolvedValueOnce(YAML.stringify(mockPersonas))
        .mockResolvedValueOnce(YAML.stringify(mockTools))
        .mockResolvedValueOnce('{}')
        .mockResolvedValueOnce('{}');

      await configManager.initialize();
    });

    it('should return all personas', () => {
      const personas = configManager.getPersonas();
      expect(personas).toHaveLength(2);
      expect(personas[0].name).toBe('architect');
      expect(personas[1].name).toBe('security');
    });

    it('should get specific persona by name', () => {
      const architect = configManager.getPersona('architect');
      expect(architect).toBeDefined();
      expect(architect?.name).toBe('architect');
      expect(architect?.description).toBe('Senior software architect');
    });

    it('should return undefined for non-existent persona', () => {
      const nonExistent = configManager.getPersona('nonexistent');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('getToolConfigs', () => {
    beforeEach(async () => {
      const mockPersonas = { personas: [] };
      const mockTools = {
        tools: [
          {
            name: 'analyze_code',
            description: 'Analyze code for quality',
            category: 'analysis',
            parameters: {
              code: { type: 'string', required: true },
            },
          },
          {
            name: 'build_project',
            description: 'Build projects',
            category: 'build',
            parameters: {
              type: { type: 'string', required: true },
            },
          },
        ],
      };

      mockReadFile
        .mockResolvedValueOnce(YAML.stringify(mockPersonas))
        .mockResolvedValueOnce(YAML.stringify(mockTools))
        .mockResolvedValueOnce('{}')
        .mockResolvedValueOnce('{}');

      await configManager.initialize();
    });

    it('should return all tool configurations', () => {
      const tools = configManager.getToolConfigs();
      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('analyze_code');
      expect(tools[1].name).toBe('build_project');
    });

    it('should get specific tool configuration by name', () => {
      const analyzeTool = configManager.getToolConfig('analyze_code');
      expect(analyzeTool).toBeDefined();
      expect(analyzeTool?.name).toBe('analyze_code');
      expect(analyzeTool?.category).toBe('analysis');
    });

    it('should return undefined for non-existent tool', () => {
      const nonExistent = configManager.getToolConfig('nonexistent');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('getConfig', () => {
    it('should throw error if not initialized', () => {
      expect(() => configManager.getConfig()).toThrow('Configuration not initialized');
    });

    it('should return config after initialization', async () => {
      const mockPersonas = { personas: [] };
      const mockTools = { tools: [] };

      mockReadFile
        .mockResolvedValueOnce(YAML.stringify(mockPersonas))
        .mockResolvedValueOnce(YAML.stringify(mockTools))
        .mockResolvedValueOnce('{}')
        .mockResolvedValueOnce('{}');

      await configManager.initialize();

      const config = configManager.getConfig();
      expect(config).toBeDefined();
      expect(config.personas).toBeDefined();
      expect(config.tools).toBeDefined();
      expect(config.patterns).toBeDefined();
      expect(config.settings).toBeDefined();
    });
  });
});
