import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { ConfigValidator, type ValidationResult } from './ConfigValidator.js';
import { ConfigWatcher, type ConfigChangeEvent } from './ConfigWatcher.js';
import {
  ConfigurationError,
  ErrorCode,
} from '../errors/ErrorTypes.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

// Configuration schemas
const PersonaSchema = z.object({
  name: z.string(),
  description: z.string(),
  expertise: z.array(z.string()),
  approach: z.string(),
  tools: z.array(z.string()).optional(),
});

const ToolConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  parameters: z.record(z.any()),
  personas: z.array(z.string()).optional(),
  examples: z.array(z.any()).optional(),
});

const ConfigSchema = z.object({
  personas: z.array(PersonaSchema),
  tools: z.array(ToolConfigSchema),
  patterns: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export type Persona = z.infer<typeof PersonaSchema>;
export type ToolConfig = z.infer<typeof ToolConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Enhanced configuration manager with validation and hot reload capabilities
 */
export class ConfigManager {
  private config: Config | null = null;
  private configPath: string;
  private validator: ConfigValidator;
  private watcher: ConfigWatcher | null = null;
  private isInitialized = false;
  private lastValidationResult: ValidationResult | null = null;

  constructor() {
    this.configPath = join(PROJECT_ROOT, 'config');
    this.validator = new ConfigValidator();
  }

  /**
   * Initialize the configuration manager with validation and optional hot reload
   */
  async initialize(options: { enableHotReload?: boolean; validateOnLoad?: boolean } = {}): Promise<void> {
    const { enableHotReload = true, validateOnLoad = true } = options;

    try {
      logger.info('Initializing SuperAugment configuration manager...');

      // Validate configuration first if enabled
      if (validateOnLoad) {
        logger.info('Validating configuration files...');
        this.lastValidationResult = await this.validator.validateAll(this.configPath);
        
        if (!this.lastValidationResult.isValid) {
          const errorCount = this.lastValidationResult.errors.length;
          const warningCount = this.lastValidationResult.warnings.length;
          
          logger.error(`Configuration validation failed with ${errorCount} errors and ${warningCount} warnings`);
          
          // Log first few errors for immediate visibility
          this.lastValidationResult.errors.slice(0, 3).forEach(error => {
            logger.error(`Config Error [${error.code}]: ${error.message}`, {
              path: error.path,
              suggestion: error.suggestion,
            });
          });

          throw new ConfigurationError(
            `Configuration validation failed with ${errorCount} errors. Please fix configuration files before starting.`,
            ErrorCode.CONFIG_VALIDATION_FAILED,
            { 
              additionalInfo: { 
                errors: this.lastValidationResult.errors,
                warnings: this.lastValidationResult.warnings,
                configPath: this.configPath
              } 
            }
          );
        }

        if (this.lastValidationResult.warnings.length > 0) {
          logger.warn(`Configuration loaded with ${this.lastValidationResult.warnings.length} warnings`);
          this.lastValidationResult.warnings.forEach(warning => {
            logger.warn(`Config Warning [${warning.code}]: ${warning.message}`, {
              path: warning.path,
              suggestion: warning.suggestion,
            });
          });
        }

        logger.info('Configuration validation passed successfully');
      }
      
      // Load main configuration files
      const personas = await this.loadPersonas();
      const tools = await this.loadTools();
      const patterns = await this.loadPatterns();
      const settings = await this.loadSettings();

      // Combine into main config
      this.config = {
        personas,
        tools,
        patterns,
        settings,
      };

      // Final schema validation
      try {
        ConfigSchema.parse(this.config);
      } catch (error) {
        throw new ConfigurationError(
          `Configuration schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ErrorCode.CONFIG_VALIDATION_FAILED,
          { additionalInfo: { schemaError: error } },
          error instanceof Error ? error : undefined
        );
      }

      // Setup hot reload if enabled
      if (enableHotReload) {
        await this.setupHotReload();
      }

      this.isInitialized = true;
      
      logger.info(`Configuration manager initialized successfully`, {
        personas: personas.length,
        tools: tools.length,
        hotReload: enableHotReload,
        validation: validateOnLoad,
      });

    } catch (error) {
      logger.error('Failed to initialize configuration manager:', error);
      throw error;
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): Config {
    if (!this.config) {
      throw new Error('Configuration not initialized');
    }
    return this.config;
  }

  /**
   * Get all personas
   */
  getPersonas(): Persona[] {
    return this.getConfig().personas;
  }

  /**
   * Get a specific persona by name
   */
  getPersona(name: string): Persona | undefined {
    return this.getPersonas().find(p => p.name === name);
  }

  /**
   * Get all tool configurations
   */
  getToolConfigs(): ToolConfig[] {
    return this.getConfig().tools;
  }

  /**
   * Get a specific tool configuration by name
   */
  getToolConfig(name: string): ToolConfig | undefined {
    return this.getToolConfigs().find(t => t.name === name);
  }

  /**
   * Load personas from configuration
   */
  private async loadPersonas(): Promise<Persona[]> {
    const personasPath = join(this.configPath, 'personas.yml');
    const content = await readFile(personasPath, 'utf-8');
    const data = YAML.parse(content);
    return data.personas || [];
  }

  /**
   * Load tool configurations
   */
  private async loadTools(): Promise<ToolConfig[]> {
    const toolsPath = join(this.configPath, 'tools.yml');
    const content = await readFile(toolsPath, 'utf-8');
    const data = YAML.parse(content);
    return data.tools || [];
  }

  /**
   * Load patterns configuration
   */
  private async loadPatterns(): Promise<Record<string, any>> {
    try {
      const patternsPath = join(this.configPath, 'patterns.yml');
      const content = await readFile(patternsPath, 'utf-8');
      return YAML.parse(content) || {};
    } catch (error) {
      logger.warn('No patterns configuration found, using empty patterns');
      return {};
    }
  }

  /**
   * Load settings configuration
   */
  private async loadSettings(): Promise<Record<string, any>> {
    try {
      const settingsPath = join(this.configPath, 'settings.yml');
      const content = await readFile(settingsPath, 'utf-8');
      return YAML.parse(content) || {};
    } catch (error) {
      logger.warn('No settings configuration found, using default settings');
      return {};
    }
  }

  /**
   * Setup hot reload functionality
   */
  private async setupHotReload(): Promise<void> {
    try {
      this.watcher = new ConfigWatcher(this.configPath, {
        enableHotReload: true,
        debounceMs: 1000,
        validateOnChange: true,
        backupOnChange: true,
        maxBackups: 5,
      });

      // Handle configuration changes
      this.watcher.on('reload', async (event: ConfigChangeEvent) => {
        logger.info(`Hot reloading configuration due to ${event.file} change`);
        try {
          await this.reloadConfiguration();
          logger.info('Configuration hot reload completed successfully');
        } catch (error) {
          logger.error('Configuration hot reload failed:', error);
        }
      });

      // Handle validation failures
      this.watcher.on('validation_failed', (event: ConfigChangeEvent) => {
        logger.error(`Configuration validation failed for ${event.file}:`, {
          errors: event.validationResult?.errors.length || 0,
          warnings: event.validationResult?.warnings.length || 0,
        });
      });

      // Handle validation success
      this.watcher.on('validation_passed', (event: ConfigChangeEvent) => {
        logger.info(`Configuration validation passed for ${event.file}`);
      });

      await this.watcher.startWatching();
      logger.info('Configuration hot reload enabled');

    } catch (error) {
      logger.warn('Failed to setup configuration hot reload:', error);
      // Don't throw error, hot reload is optional
    }
  }

  /**
   * Reload configuration from files
   */
  private async reloadConfiguration(): Promise<void> {
    try {
      // Validate first
      const validationResult = await this.validator.validateAll(this.configPath);
      if (!validationResult.isValid) {
        throw new ConfigurationError(
          `Cannot reload invalid configuration: ${validationResult.errors.length} errors found`,
          ErrorCode.CONFIG_VALIDATION_FAILED,
          { additionalInfo: { errors: validationResult.errors } }
        );
      }

      // Load new configuration
      const personas = await this.loadPersonas();
      const tools = await this.loadTools();
      const patterns = await this.loadPatterns();
      const settings = await this.loadSettings();

      // Update config
      this.config = {
        personas,
        tools,
        patterns,
        settings,
      };

      this.lastValidationResult = validationResult;

      logger.info('Configuration reloaded successfully', {
        personas: personas.length,
        tools: tools.length,
      });

    } catch (error) {
      logger.error('Failed to reload configuration:', error);
      throw error;
    }
  }

  /**
   * Validate current configuration
   */
  async validateConfiguration(): Promise<ValidationResult> {
    try {
      const result = await this.validator.validateAll(this.configPath);
      this.lastValidationResult = result;
      return result;
    } catch (error) {
      throw new ConfigurationError(
        `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.CONFIG_VALIDATION_FAILED,
        { additionalInfo: { configPath: this.configPath } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get last validation result
   */
  getLastValidationResult(): ValidationResult | null {
    return this.lastValidationResult;
  }

  /**
   * Check if configuration manager is initialized
   */
  isConfigInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get configuration health status
   */
  getHealthStatus(): {
    initialized: boolean;
    valid: boolean;
    hotReloadEnabled: boolean;
    lastValidation?: Date;
    errors: number;
    warnings: number;
  } {
    const result: {
      initialized: boolean;
      valid: boolean;
      hotReloadEnabled: boolean;
      lastValidation?: Date;
      errors: number;
      warnings: number;
    } = {
      initialized: this.isInitialized,
      valid: this.lastValidationResult?.isValid ?? false,
      hotReloadEnabled: this.watcher !== null,
      errors: this.lastValidationResult?.errors.length ?? 0,
      warnings: this.lastValidationResult?.warnings.length ?? 0,
    };
    
    if (this.lastValidationResult?.metadata.validatedAt) {
      result.lastValidation = this.lastValidationResult.metadata.validatedAt;
    }
    
    return result;
  }

  /**
   * Force reload configuration (useful for testing or manual refresh)
   */
  async forceReload(): Promise<void> {
    if (!this.isInitialized) {
      throw new ConfigurationError(
        'Configuration manager not initialized',
        ErrorCode.INITIALIZATION_FAILED
      );
    }

    await this.reloadConfiguration();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.watcher) {
      await this.watcher.stopWatching();
      this.watcher = null;
    }
    this.isInitialized = false;
    logger.info('Configuration manager cleaned up');
  }
}
