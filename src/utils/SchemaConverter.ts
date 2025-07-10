/**
 * SuperAugment Schema Converter
 * 
 * Provides robust and maintainable conversion between Zod schemas and JSON Schema
 * for MCP protocol compatibility. Designed to be simple, reliable, and extensible.
 */

import { z } from 'zod';
import { logger } from './logger.js';
import {
  ErrorCode,
  ErrorSeverity,
  SuperAugmentError,
} from '../errors/ErrorTypes.js';

/**
 * JSON Schema type definitions
 */
export interface JsonSchemaProperty {
  type: string;
  description?: string;
  enum?: any[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  default?: any;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

export interface JsonSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Schema conversion statistics
 */
export interface ConversionStats {
  totalProperties: number;
  successfulConversions: number;
  failedConversions: number;
  unsupportedTypes: string[];
  conversionTime: number;
}

/**
 * Schema conversion options
 */
export interface ConversionOptions {
  includeDescriptions: boolean;
  includeDefaults: boolean;
  strictMode: boolean;
  maxDepth: number;
}

/**
 * Default conversion options
 */
const DEFAULT_OPTIONS: ConversionOptions = {
  includeDescriptions: true,
  includeDefaults: true,
  strictMode: false,
  maxDepth: 10,
};

/**
 * Robust Schema Converter for Zod to JSON Schema conversion
 */
export class SchemaConverter {
  private conversionCache = new Map<string, JsonSchemaProperty>();
  private stats: ConversionStats = {
    totalProperties: 0,
    successfulConversions: 0,
    failedConversions: 0,
    unsupportedTypes: [],
    conversionTime: 0,
  };

  /**
   * Convert Zod schema to JSON Schema
   */
  convertZodToJsonSchema(
    zodSchema: z.ZodType<any>,
    options: Partial<ConversionOptions> = {}
  ): JsonSchema {
    const startTime = Date.now();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      this.resetStats();
      
      const result = this.convertZodSchemaInternal(zodSchema, opts, 0);
      
      this.stats.conversionTime = Date.now() - startTime;
      
      logger.debug('Schema conversion completed', {
        stats: this.stats,
        options: opts,
      });

      return result;

    } catch (error) {
      this.stats.conversionTime = Date.now() - startTime;
      this.stats.failedConversions++;

      throw new SuperAugmentError(
        `Schema conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.VALIDATION_FAILED,
        ErrorSeverity.HIGH,
        { additionalInfo: { stats: this.stats, options: opts } },
        false,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Convert Zod type to JSON Schema property
   */
  convertZodTypeToProperty(
    zodType: z.ZodType<any>,
    options: Partial<ConversionOptions> = {}
  ): JsonSchemaProperty {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    return this.convertZodTypeInternal(zodType, opts, 0);
  }

  /**
   * Get conversion statistics
   */
  getStats(): ConversionStats {
    return { ...this.stats };
  }

  /**
   * Clear conversion cache
   */
  clearCache(): void {
    this.conversionCache.clear();
    logger.debug('Schema conversion cache cleared');
  }

  /**
   * Internal schema conversion implementation
   */
  private convertZodSchemaInternal(
    zodSchema: z.ZodType<any>,
    options: ConversionOptions,
    depth: number
  ): JsonSchema {
    if (depth > options.maxDepth) {
      throw new SuperAugmentError(
        `Maximum conversion depth exceeded: ${options.maxDepth}`,
        ErrorCode.VALIDATION_FAILED,
        ErrorSeverity.HIGH,
        { additionalInfo: { depth, maxDepth: options.maxDepth } },
        false
      );
    }

    // Handle ZodObject specifically
    if (zodSchema instanceof z.ZodObject) {
      return this.convertZodObject(zodSchema, options, depth);
    }

    // Handle other schema types that can be converted to objects
    const property = this.convertZodTypeInternal(zodSchema, options, depth);
    
    if (property.type === 'object' && property.properties) {
      const result: JsonSchema = {
        type: 'object',
        properties: property.properties,
        additionalProperties: false,
      };
      
      if (property.required) {
        result.required = property.required;
      }
      
      return result;
    }

    // Fallback: wrap non-object types in a generic object
    return {
      type: 'object',
      properties: {
        value: property,
      },
      required: ['value'],
      additionalProperties: false,
    };
  }

  /**
   * Convert ZodObject to JSON Schema
   */
  private convertZodObject(
    zodObject: z.ZodObject<any>,
    options: ConversionOptions,
    depth: number
  ): JsonSchema {
    const properties: Record<string, JsonSchemaProperty> = {};
    const required: string[] = [];
    const shape = zodObject.shape;

    for (const [key, zodType] of Object.entries(shape)) {
      try {
        this.stats.totalProperties++;
        
        const property = this.convertZodTypeInternal(zodType as z.ZodType<any>, options, depth + 1);
        properties[key] = property;
        
        // Check if property is required (not optional or has default)
        if (this.isRequiredProperty(zodType as z.ZodType<any>)) {
          required.push(key);
        }
        
        this.stats.successfulConversions++;

      } catch (error) {
        this.stats.failedConversions++;
        logger.warn(`Failed to convert property '${key}'`, { error });
        
        if (options.strictMode) {
          throw error;
        }
        
        // Fallback property in non-strict mode
        properties[key] = {
          type: 'string',
          description: `Failed to convert property: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    const result: JsonSchema = {
      type: 'object',
      properties,
      additionalProperties: false,
    };
    
    if (required.length > 0) {
      result.required = required;
    }
    
    return result;
  }

  /**
   * Convert individual Zod type to JSON Schema property
   */
  private convertZodTypeInternal(
    zodType: z.ZodType<any>,
    options: ConversionOptions,
    depth: number
  ): JsonSchemaProperty {
    if (depth > options.maxDepth) {
      return {
        type: 'string',
        description: 'Maximum depth exceeded',
      };
    }

    // Check cache first
    const cacheKey = this.getCacheKey(zodType);
    if (this.conversionCache.has(cacheKey)) {
      return this.conversionCache.get(cacheKey)!;
    }

    const property = this.convertZodTypeCore(zodType, options, depth);
    
    // Cache the result
    this.conversionCache.set(cacheKey, property);
    
    return property;
  }

  /**
   * Core Zod type conversion logic
   */
  private convertZodTypeCore(
    zodType: z.ZodType<any>,
    options: ConversionOptions,
    depth: number
  ): JsonSchemaProperty {
    const typeName = (zodType as any)._def?.typeName;

    switch (typeName) {
      case 'ZodString':
        return this.convertZodString(zodType as z.ZodString, options);
      
      case 'ZodNumber':
        return this.convertZodNumber(zodType as z.ZodNumber, options);
      
      case 'ZodBoolean':
        return this.convertZodBoolean(zodType as z.ZodBoolean, options);
      
      case 'ZodArray':
        return this.convertZodArray(zodType as z.ZodArray<any>, options, depth);
      
      case 'ZodObject':
        return this.convertZodObjectToProperty(zodType as z.ZodObject<any>, options, depth);
      
      case 'ZodEnum':
        return this.convertZodEnum(zodType as z.ZodEnum<any>, options);
      
      case 'ZodNativeEnum':
        return this.convertZodNativeEnum(zodType as z.ZodNativeEnum<any>, options);
      
      case 'ZodLiteral':
        return this.convertZodLiteral(zodType as z.ZodLiteral<any>, options);
      
      case 'ZodUnion':
        return this.convertZodUnion(zodType as z.ZodUnion<any>, options, depth);
      
      case 'ZodOptional':
        return this.convertZodOptional(zodType as z.ZodOptional<any>, options, depth);
      
      case 'ZodDefault':
        return this.convertZodDefault(zodType as z.ZodDefault<any>, options, depth);
      
      case 'ZodNullable':
        return this.convertZodNullable(zodType as z.ZodNullable<any>, options, depth);
      
      case 'ZodRecord':
        return this.convertZodRecord(zodType as z.ZodRecord<any>, options, depth);
      
      default:
        this.stats.unsupportedTypes.push(typeName || 'unknown');
        logger.warn(`Unsupported Zod type: ${typeName}`, { typeName });
        
        const result: JsonSchemaProperty = {
          type: 'string',
        };
        
        if (options.includeDescriptions) {
          result.description = `Unsupported type: ${typeName}`;
        }
        
        return result;
    }
  }

  /**
   * Convert ZodString
   */
  private convertZodString(zodString: z.ZodString, options: ConversionOptions): JsonSchemaProperty {
    const property: JsonSchemaProperty = { type: 'string' };
    
    if (options.includeDescriptions && zodString.description) {
      property.description = zodString.description;
    }

    // Extract string constraints
    const checks = (zodString as any)._def.checks || [];
    for (const check of checks) {
      switch (check.kind) {
        case 'min':
          property.minLength = check.value;
          break;
        case 'max':
          property.maxLength = check.value;
          break;
        case 'regex':
          property.pattern = check.regex.source;
          break;
        case 'email':
          property.format = 'email';
          break;
        case 'url':
          property.format = 'uri';
          break;
        case 'uuid':
          property.format = 'uuid';
          break;
      }
    }

    return property;
  }

  /**
   * Convert ZodNumber
   */
  private convertZodNumber(zodNumber: z.ZodNumber, options: ConversionOptions): JsonSchemaProperty {
    const property: JsonSchemaProperty = { type: 'number' };
    
    if (options.includeDescriptions && zodNumber.description) {
      property.description = zodNumber.description;
    }

    // Extract number constraints
    const checks = (zodNumber as any)._def.checks || [];
    for (const check of checks) {
      switch (check.kind) {
        case 'min':
          property.minimum = check.value;
          break;
        case 'max':
          property.maximum = check.value;
          break;
        case 'int':
          property.type = 'integer';
          break;
      }
    }

    return property;
  }

  /**
   * Convert ZodBoolean
   */
  private convertZodBoolean(zodBoolean: z.ZodBoolean, options: ConversionOptions): JsonSchemaProperty {
    const property: JsonSchemaProperty = { type: 'boolean' };
    
    if (options.includeDescriptions && zodBoolean.description) {
      property.description = zodBoolean.description;
    }

    return property;
  }

  /**
   * Convert ZodArray
   */
  private convertZodArray(
    zodArray: z.ZodArray<any>,
    options: ConversionOptions,
    depth: number
  ): JsonSchemaProperty {
    const property: JsonSchemaProperty = {
      type: 'array',
      items: this.convertZodTypeInternal(zodArray.element, options, depth + 1),
    };
    
    if (options.includeDescriptions && zodArray.description) {
      property.description = zodArray.description;
    }

    return property;
  }

  /**
   * Convert ZodObject to property
   */
  private convertZodObjectToProperty(
    zodObject: z.ZodObject<any>,
    options: ConversionOptions,
    depth: number
  ): JsonSchemaProperty {
    const objectSchema = this.convertZodObject(zodObject, options, depth);
    
    const result: JsonSchemaProperty = {
      type: 'object',
      properties: objectSchema.properties,
    };
    
    if (objectSchema.required) {
      result.required = objectSchema.required;
    }
    
    return result;
  }

  /**
   * Convert ZodEnum
   */
  private convertZodEnum(zodEnum: z.ZodEnum<any>, options: ConversionOptions): JsonSchemaProperty {
    const property: JsonSchemaProperty = {
      type: 'string',
      enum: zodEnum.options,
    };
    
    if (options.includeDescriptions && zodEnum.description) {
      property.description = zodEnum.description;
    }

    return property;
  }

  /**
   * Convert ZodNativeEnum
   */
  private convertZodNativeEnum(zodNativeEnum: z.ZodNativeEnum<any>, options: ConversionOptions): JsonSchemaProperty {
    const enumValues = Object.values(zodNativeEnum.enum);
    
    const property: JsonSchemaProperty = {
      type: 'string',
      enum: enumValues,
    };
    
    if (options.includeDescriptions && zodNativeEnum.description) {
      property.description = zodNativeEnum.description;
    }

    return property;
  }

  /**
   * Convert ZodLiteral
   */
  private convertZodLiteral(zodLiteral: z.ZodLiteral<any>, options: ConversionOptions): JsonSchemaProperty {
    const value = zodLiteral.value;
    const property: JsonSchemaProperty = {
      type: typeof value as any,
      enum: [value],
    };
    
    if (options.includeDescriptions && zodLiteral.description) {
      property.description = zodLiteral.description;
    }

    return property;
  }

  /**
   * Convert ZodUnion (simplified - takes first option)
   */
  private convertZodUnion(
    zodUnion: z.ZodUnion<any>,
    options: ConversionOptions,
    depth: number
  ): JsonSchemaProperty {
    // For simplicity, convert the first option
    // In a more sophisticated implementation, this could create a oneOf schema
    const firstOption = zodUnion.options[0];
    const property = this.convertZodTypeInternal(firstOption, options, depth + 1);
    
    if (options.includeDescriptions) {
      property.description = `Union type (simplified to first option)${zodUnion.description ? ': ' + zodUnion.description : ''}`;
    }

    return property;
  }

  /**
   * Convert ZodOptional
   */
  private convertZodOptional(
    zodOptional: z.ZodOptional<any>,
    options: ConversionOptions,
    depth: number
  ): JsonSchemaProperty {
    return this.convertZodTypeInternal(zodOptional.unwrap(), options, depth);
  }

  /**
   * Convert ZodDefault
   */
  private convertZodDefault(
    zodDefault: z.ZodDefault<any>,
    options: ConversionOptions,
    depth: number
  ): JsonSchemaProperty {
    const property = this.convertZodTypeInternal(zodDefault._def.innerType, options, depth);
    
    if (options.includeDefaults) {
      property.default = zodDefault._def.defaultValue();
    }

    return property;
  }

  /**
   * Convert ZodNullable
   */
  private convertZodNullable(
    zodNullable: z.ZodNullable<any>,
    options: ConversionOptions,
    depth: number
  ): JsonSchemaProperty {
    const property = this.convertZodTypeInternal(zodNullable.unwrap(), options, depth);
    
    if (options.includeDescriptions) {
      property.description = `Nullable: ${property.description || 'No description'}`;
    }

    return property;
  }

  /**
   * Convert ZodRecord
   */
  private convertZodRecord(
    zodRecord: z.ZodRecord<any>,
    options: ConversionOptions,
    _depth: number
  ): JsonSchemaProperty {
    const description = options.includeDescriptions 
      ? `Record type${zodRecord.description ? ': ' + zodRecord.description : ''}` 
      : undefined;
    
    return {
      type: 'object',
      ...(description && { description }),
    };
  }

  /**
   * Check if a Zod type represents a required property
   */
  private isRequiredProperty(zodType: z.ZodType<any>): boolean {
    const typeName = (zodType as any)._def?.typeName;
    return typeName !== 'ZodOptional' && typeName !== 'ZodDefault';
  }

  /**
   * Generate cache key for Zod type
   */
  private getCacheKey(zodType: z.ZodType<any>): string {
    try {
      // Simple cache key based on type name and basic properties
      const typeName = (zodType as any)._def?.typeName || 'unknown';
      const description = zodType.description || '';
      return `${typeName}:${description}`;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Reset conversion statistics
   */
  private resetStats(): void {
    this.stats = {
      totalProperties: 0,
      successfulConversions: 0,
      failedConversions: 0,
      unsupportedTypes: [],
      conversionTime: 0,
    };
  }
}
