/**
 * SuperAugment Configuration Validator
 * 
 * Provides comprehensive validation for all configuration files with
 * detailed error reporting, dependency checking, and runtime validation.
 */

import { z } from 'zod';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import YAML from 'yaml';
import { logger } from '../utils/logger.js';
import {
  ConfigurationError,
  ErrorCode,
} from '../errors/ErrorTypes.js';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: {
    validatedAt: Date;
    configVersion?: string;
    validationDuration: number;
  };
}

/**
 * Validation error details
 */
export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error' | 'warning';
  context?: Record<string, any>;
  suggestion?: string;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  suggestion: string;
  context?: Record<string, any>;
}

/**
 * Enhanced schema definitions with detailed validation
 */

// Persona validation schema
const PersonaSchema = z.object({
  name: z.string()
    .min(1, 'Persona name cannot be empty')
    .max(50, 'Persona name too long (max 50 characters)')
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Persona name must start with letter and contain only alphanumeric, underscore, or dash'),
  description: z.string()
    .min(10, 'Description too short (minimum 10 characters)')
    .max(500, 'Description too long (maximum 500 characters)'),
  expertise: z.array(z.string().min(1))
    .min(1, 'At least one expertise area required')
    .max(20, 'Too many expertise areas (maximum 20)'),
  approach: z.string()
    .min(20, 'Approach description too short (minimum 20 characters)')
    .max(1000, 'Approach description too long (maximum 1000 characters)'),
  tools: z.array(z.string().min(1))
    .optional()
    .refine(tools => !tools || tools.length <= 10, 'Too many tools (maximum 10)'),
}).strict();

// Tool configuration validation schema
const ToolConfigSchema = z.object({
  name: z.string()
    .min(1, 'Tool name cannot be empty')
    .max(50, 'Tool name too long (max 50 characters)')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Tool name must start with letter and contain only alphanumeric or underscore'),
  description: z.string()
    .min(10, 'Description too short (minimum 10 characters)')
    .max(500, 'Description too long (maximum 500 characters)'),
  category: z.enum(['analysis', 'build', 'test', 'deploy', 'security', 'utility'], {
    errorMap: () => ({ message: 'Category must be one of: analysis, build, test, deploy, security, utility' })
  }),
  parameters: z.record(z.any())
    .refine(params => Object.keys(params).length <= 50, 'Too many parameters (maximum 50)'),
  personas: z.array(z.string().min(1))
    .optional()
    .refine(personas => !personas || personas.length <= 10, 'Too many personas (maximum 10)'),
  examples: z.array(z.any())
    .optional()
    .refine(examples => !examples || examples.length <= 5, 'Too many examples (maximum 5)'),
}).strict();

// Settings validation schema
const SettingsSchema = z.object({
  server: z.object({
    port: z.number().int().min(1024).max(65535).optional(),
    host: z.string().optional(),
    timeout: z.number().int().min(1000).max(300000).optional(), // 1s to 5min
  }).optional(),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).optional(),
    file: z.string().optional(),
    maxSize: z.number().int().min(1024).optional(), // minimum 1KB
  }).optional(),
  performance: z.object({
    maxMemoryUsage: z.number().int().min(1024 * 1024).optional(), // minimum 1MB
    maxExecutionTime: z.number().int().min(1000).optional(), // minimum 1s
    enableMetrics: z.boolean().optional(),
  }).optional(),
  security: z.object({
    enableSanitization: z.boolean().optional(),
    maxFileSize: z.number().int().min(1024).optional(), // minimum 1KB
    allowedExtensions: z.array(z.string()).optional(),
  }).optional(),
  languages: z.array(z.string()).optional(),
}).strict();

// Patterns validation schema
const PatternsSchema = z.object({
  development: z.record(z.any()).optional(),
  architecture: z.record(z.any()).optional(),
  security: z.record(z.any()).optional(),
  testing: z.record(z.any()).optional(),
  performance: z.record(z.any()).optional(),
}).strict();

// Main configuration schema
// const ConfigSchema = z.object({
//   version: z.string().optional(),
//   personas: z.array(PersonaSchema),
//   tools: z.array(ToolConfigSchema),
//   patterns: PatternsSchema.optional(),
//   settings: SettingsSchema.optional(),
// }).strict();

/**
 * Configuration validator class
 */
export class ConfigValidator {
  private validationCache = new Map<string, ValidationResult>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Validate all configuration files
   */
  async validateAll(configPath: string): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validate individual files
      const personasResult = await this.validatePersonas(configPath);
      const toolsResult = await this.validateTools(configPath);
      const settingsResult = await this.validateSettings(configPath);
      const patternsResult = await this.validatePatterns(configPath);

      // Collect all errors and warnings
      errors.push(...personasResult.errors, ...toolsResult.errors, ...settingsResult.errors, ...patternsResult.errors);
      warnings.push(...personasResult.warnings, ...toolsResult.warnings, ...settingsResult.warnings, ...patternsResult.warnings);

      // Cross-validation checks
      const crossValidationResult = await this.performCrossValidation(configPath);
      errors.push(...crossValidationResult.errors);
      warnings.push(...crossValidationResult.warnings);

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          validatedAt: new Date(),
          validationDuration: Date.now() - startTime,
        },
      };

      // Cache the result
      this.cacheValidationResult(configPath, result);

      return result;
    } catch (error) {
      throw new ConfigurationError(
        `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.CONFIG_VALIDATION_FAILED,
        { additionalInfo: { configPath, validationDuration: Date.now() - startTime } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate personas configuration
   */
  async validatePersonas(configPath: string): Promise<ValidationResult> {
    const filePath = join(configPath, 'personas.yml');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      await access(filePath);
      const content = await readFile(filePath, 'utf-8');
      const data = YAML.parse(content);

      if (!data || !data.personas) {
        errors.push({
          code: 'PERSONAS_MISSING',
          message: 'Personas configuration is missing or empty',
          path: filePath,
          severity: 'error',
          suggestion: 'Add at least one persona configuration',
        });
        return { isValid: false, errors, warnings, metadata: { validatedAt: new Date(), validationDuration: 0 } };
      }

      // Validate schema
      const result = z.array(PersonaSchema).safeParse(data.personas);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            code: 'PERSONA_SCHEMA_ERROR',
            message: issue.message,
            path: `${filePath}[${issue.path.join('.')}]`,
            severity: 'error',
            context: { issue },
            suggestion: this.getSuggestionForSchemaError(issue),
          });
        }
      }

      // Additional validation checks
      if (result.success) {
        const personas = result.data;
        
        // Check for duplicate names
        const names = new Set<string>();
        for (let i = 0; i < personas.length; i++) {
          const persona = personas[i];
          if (persona && names.has(persona.name)) {
            errors.push({
              code: 'DUPLICATE_PERSONA_NAME',
              message: `Duplicate persona name: ${persona.name}`,
              path: `${filePath}[${i}].name`,
              severity: 'error',
              suggestion: 'Use unique names for each persona',
            });
          }
          if (persona) {
            names.add(persona.name);
          }
        }

        // Check for reasonable number of personas
        if (personas.length > 20) {
          warnings.push({
            code: 'TOO_MANY_PERSONAS',
            message: `Large number of personas (${personas.length}). Consider consolidating.`,
            path: filePath,
            suggestion: 'Keep the number of personas manageable (recommended: 5-15)',
          });
        }

        // Check for common expertise areas
        const allExpertise = personas.flatMap(p => p.expertise);
        const expertiseCount = new Map<string, number>();
        allExpertise.forEach(exp => {
          expertiseCount.set(exp, (expertiseCount.get(exp) || 0) + 1);
        });

        for (const [expertise, count] of expertiseCount) {
          if (count > personas.length * 0.8) {
            warnings.push({
              code: 'COMMON_EXPERTISE',
              message: `Expertise "${expertise}" is too common across personas`,
              path: filePath,
              suggestion: 'Consider making expertise areas more specific to each persona',
            });
          }
        }
      }

    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        errors.push({
          code: 'PERSONAS_FILE_MISSING',
          message: 'Personas configuration file not found',
          path: filePath,
          severity: 'error',
          suggestion: 'Create personas.yml file with persona definitions',
        });
      } else {
        errors.push({
          code: 'PERSONAS_READ_ERROR',
          message: `Failed to read personas file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path: filePath,
          severity: 'error',
          suggestion: 'Check file permissions and YAML syntax',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: { validatedAt: new Date(), validationDuration: 0 },
    };
  }

  /**
   * Validate tools configuration
   */
  async validateTools(configPath: string): Promise<ValidationResult> {
    const filePath = join(configPath, 'tools.yml');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      await access(filePath);
      const content = await readFile(filePath, 'utf-8');
      const data = YAML.parse(content);

      if (!data || !data.tools) {
        errors.push({
          code: 'TOOLS_MISSING',
          message: 'Tools configuration is missing or empty',
          path: filePath,
          severity: 'error',
          suggestion: 'Add at least one tool configuration',
        });
        return { isValid: false, errors, warnings, metadata: { validatedAt: new Date(), validationDuration: 0 } };
      }

      // Validate schema
      const result = z.array(ToolConfigSchema).safeParse(data.tools);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            code: 'TOOL_SCHEMA_ERROR',
            message: issue.message,
            path: `${filePath}[${issue.path.join('.')}]`,
            severity: 'error',
            context: { issue },
            suggestion: this.getSuggestionForSchemaError(issue),
          });
        }
      }

      // Additional validation checks
      if (result.success) {
        const tools = result.data;
        
        // Check for duplicate names
        const names = new Set<string>();
        for (let i = 0; i < tools.length; i++) {
          const tool = tools[i];
          if (tool && names.has(tool.name)) {
            errors.push({
              code: 'DUPLICATE_TOOL_NAME',
              message: `Duplicate tool name: ${tool.name}`,
              path: `${filePath}[${i}].name`,
              severity: 'error',
              suggestion: 'Use unique names for each tool',
            });
          }
          if (tool) {
            names.add(tool.name);
          }
        }

        // Check category distribution
        const categoryCount = new Map<string, number>();
        tools.forEach(tool => {
          categoryCount.set(tool.category, (categoryCount.get(tool.category) || 0) + 1);
        });

        for (const [category, count] of categoryCount) {
          if (count > tools.length * 0.7) {
            warnings.push({
              code: 'CATEGORY_IMBALANCE',
              message: `Too many tools in category "${category}" (${count}/${tools.length})`,
              path: filePath,
              suggestion: 'Consider distributing tools more evenly across categories',
            });
          }
        }
      }

    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        errors.push({
          code: 'TOOLS_FILE_MISSING',
          message: 'Tools configuration file not found',
          path: filePath,
          severity: 'error',
          suggestion: 'Create tools.yml file with tool definitions',
        });
      } else {
        errors.push({
          code: 'TOOLS_READ_ERROR',
          message: `Failed to read tools file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path: filePath,
          severity: 'error',
          suggestion: 'Check file permissions and YAML syntax',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: { validatedAt: new Date(), validationDuration: 0 },
    };
  }

  /**
   * Validate settings configuration
   */
  async validateSettings(configPath: string): Promise<ValidationResult> {
    const filePath = join(configPath, 'settings.yml');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      await access(filePath);
      const content = await readFile(filePath, 'utf-8');
      const data = YAML.parse(content);

      // Settings file is optional, but if it exists, validate it
      if (data) {
        const result = SettingsSchema.safeParse(data);
        if (!result.success) {
          for (const issue of result.error.issues) {
            errors.push({
              code: 'SETTINGS_SCHEMA_ERROR',
              message: issue.message,
              path: `${filePath}[${issue.path.join('.')}]`,
              severity: 'error',
              context: { issue },
              suggestion: this.getSuggestionForSchemaError(issue),
            });
          }
        }

        // Additional validation checks
        if (result.success) {
          const settings = result.data;
          
          // Check for reasonable memory limits
          if (settings.performance?.maxMemoryUsage && settings.performance.maxMemoryUsage > 2 * 1024 * 1024 * 1024) {
            warnings.push({
              code: 'HIGH_MEMORY_LIMIT',
              message: `Memory limit is very high (${Math.round(settings.performance.maxMemoryUsage / 1024 / 1024)}MB)`,
              path: `${filePath}.performance.maxMemoryUsage`,
              suggestion: 'Consider if such high memory usage is necessary',
            });
          }

          // Check for reasonable timeout values
          if (settings.performance?.maxExecutionTime && settings.performance.maxExecutionTime > 10 * 60 * 1000) {
            warnings.push({
              code: 'HIGH_TIMEOUT',
              message: `Execution timeout is very high (${settings.performance.maxExecutionTime / 1000}s)`,
              path: `${filePath}.performance.maxExecutionTime`,
              suggestion: 'Consider if such long execution time is necessary',
            });
          }
        }
      }

    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        errors.push({
          code: 'SETTINGS_READ_ERROR',
          message: `Failed to read settings file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path: filePath,
          severity: 'error',
          suggestion: 'Check file permissions and YAML syntax',
        });
      }
      // Settings file is optional, so ENOENT is not an error
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: { validatedAt: new Date(), validationDuration: 0 },
    };
  }

  /**
   * Validate patterns configuration
   */
  async validatePatterns(configPath: string): Promise<ValidationResult> {
    const filePath = join(configPath, 'patterns.yml');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      await access(filePath);
      const content = await readFile(filePath, 'utf-8');
      const data = YAML.parse(content);

      // Patterns file is optional, but if it exists, validate it
      if (data) {
        const result = PatternsSchema.safeParse(data);
        if (!result.success) {
          for (const issue of result.error.issues) {
            errors.push({
              code: 'PATTERNS_SCHEMA_ERROR',
              message: issue.message,
              path: `${filePath}[${issue.path.join('.')}]`,
              severity: 'error',
              context: { issue },
              suggestion: this.getSuggestionForSchemaError(issue),
            });
          }
        }
      }

    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        errors.push({
          code: 'PATTERNS_READ_ERROR',
          message: `Failed to read patterns file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path: filePath,
          severity: 'error',
          suggestion: 'Check file permissions and YAML syntax',
        });
      }
      // Patterns file is optional, so ENOENT is not an error
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: { validatedAt: new Date(), validationDuration: 0 },
    };
  }

  /**
   * Perform cross-validation between configuration files
   */
  async performCrossValidation(configPath: string): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Load all configurations
      const [personasData, toolsData] = await Promise.all([
        this.loadYamlFile(join(configPath, 'personas.yml')),
        this.loadYamlFile(join(configPath, 'tools.yml')),
      ]);

      if (personasData?.personas && toolsData?.tools) {
        const personaNames = new Set(personasData.personas.map((p: any) => p.name));
        const toolNames = new Set(toolsData.tools.map((t: any) => t.name));

        // Check if personas reference valid tools
        for (const persona of personasData.personas) {
          if (persona.tools) {
            for (const toolName of persona.tools) {
              if (!toolNames.has(toolName)) {
                errors.push({
                  code: 'INVALID_TOOL_REFERENCE',
                  message: `Persona "${persona.name}" references non-existent tool "${toolName}"`,
                  path: `personas.yml[${persona.name}].tools`,
                  severity: 'error',
                  suggestion: `Remove reference to "${toolName}" or add the tool to tools.yml`,
                });
              }
            }
          }
        }

        // Check if tools reference valid personas
        for (const tool of toolsData.tools) {
          if (tool.personas) {
            for (const personaName of tool.personas) {
              if (!personaNames.has(personaName)) {
                errors.push({
                  code: 'INVALID_PERSONA_REFERENCE',
                  message: `Tool "${tool.name}" references non-existent persona "${personaName}"`,
                  path: `tools.yml[${tool.name}].personas`,
                  severity: 'error',
                  suggestion: `Remove reference to "${personaName}" or add the persona to personas.yml`,
                });
              }
            }
          }
        }

        // Check for orphaned tools (not referenced by any persona)
        const referencedTools = new Set<string>();
        for (const persona of personasData.personas) {
          if (persona.tools) {
            persona.tools.forEach((tool: string) => referencedTools.add(tool));
          }
        }

        for (const tool of toolsData.tools) {
          if (!referencedTools.has(tool.name)) {
            warnings.push({
              code: 'ORPHANED_TOOL',
              message: `Tool "${tool.name}" is not referenced by any persona`,
              path: `tools.yml[${tool.name}]`,
              suggestion: 'Consider assigning this tool to relevant personas or removing it',
            });
          }
        }
      }

    } catch (error) {
      logger.warn('Cross-validation failed', { error });
    }

    return { errors, warnings };
  }

  /**
   * Load and parse YAML file
   */
  private async loadYamlFile(filePath: string): Promise<any> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return YAML.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get suggestion for schema validation error
   */
  private getSuggestionForSchemaError(issue: z.ZodIssue): string {
    switch (issue.code) {
      case 'too_small':
        return `Value should be at least ${issue.minimum}`;
      case 'too_big':
        return `Value should be at most ${issue.maximum}`;
      case 'invalid_type':
        return `Expected ${issue.expected}, got ${issue.received}`;
      case 'invalid_string':
        return 'String format is invalid';
      case 'invalid_enum_value':
        return `Value should be one of: ${issue.options?.join(', ')}`;
      default:
        return 'Please check the configuration format';
    }
  }

  /**
   * Cache validation result
   */
  private cacheValidationResult(key: string, result: ValidationResult): void {
    this.validationCache.set(key, result);
    
    // Clean up old cache entries
    setTimeout(() => {
      this.validationCache.delete(key);
    }, this.cacheTimeout);
  }

  /**
   * Get cached validation result
   */
  getCachedValidationResult(key: string): ValidationResult | null {
    return this.validationCache.get(key) || null;
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }
}
