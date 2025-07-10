/**
 * SchemaConverter Unit Tests
 * 
 * Comprehensive tests for the SchemaConverter class to ensure robust
 * Zod to JSON Schema conversion functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { z } from 'zod';
import { SchemaConverter } from '../SchemaConverter.js';
import { ValidationError } from '../../errors/ErrorTypes.js';
import { TestEnvironment, TestDataGenerator, TestAssertions } from '../../test-utils/TestHelpers.js';

describe('SchemaConverter', () => {
  let converter: SchemaConverter;

  beforeEach(() => {
    TestEnvironment.setup();
    converter = new SchemaConverter();
  });

  afterEach(() => {
    TestEnvironment.teardown();
  });

  describe('Basic Type Conversion', () => {
    it('should convert ZodString to JSON Schema', () => {
      const zodSchema = z.string().describe('A test string');
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'string',
        description: 'A test string',
      });
    });

    it('should convert ZodNumber to JSON Schema', () => {
      const zodSchema = z.number().min(0).max(100).describe('A test number');
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'number',
        description: 'A test number',
        minimum: 0,
        maximum: 100,
      });
    });

    it('should convert ZodBoolean to JSON Schema', () => {
      const zodSchema = z.boolean().describe('A test boolean');
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'boolean',
        description: 'A test boolean',
      });
    });

    it('should convert ZodArray to JSON Schema', () => {
      const zodSchema = z.array(z.string()).describe('A test array');
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'array',
        description: 'A test array',
        items: {
          type: 'string',
        },
      });
    });

    it('should convert ZodEnum to JSON Schema', () => {
      const zodSchema = z.enum(['A', 'B', 'C']).describe('A test enum');
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'string',
        description: 'A test enum',
        enum: ['A', 'B', 'C'],
      });
    });
  });

  describe('Complex Type Conversion', () => {
    it('should convert ZodObject to JSON Schema', () => {
      const zodSchema = z.object({
        name: z.string().describe('User name'),
        age: z.number().int().min(0).describe('User age'),
        email: z.string().email().optional().describe('User email'),
      });

      const result = converter.convertZodToJsonSchema(zodSchema);

      expect(result).toEqual({
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'User name',
          },
          age: {
            type: 'integer',
            description: 'User age',
            minimum: 0,
          },
          email: {
            type: 'string',
            description: 'User email',
            format: 'email',
          },
        },
        required: ['name', 'age'],
        additionalProperties: false,
      });
    });

    it('should handle nested objects', () => {
      const zodSchema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            bio: z.string(),
          }),
        }),
      });

      const result = converter.convertZodToJsonSchema(zodSchema);

      expect(result.properties.user).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          profile: {
            type: 'object',
            properties: {
              bio: { type: 'string' },
            },
            required: ['bio'],
          },
        },
        required: ['name', 'profile'],
      });
    });

    it('should handle arrays of objects', () => {
      const zodSchema = z.object({
        users: z.array(z.object({
          id: z.number(),
          name: z.string(),
        })),
      });

      const result = converter.convertZodToJsonSchema(zodSchema);

      expect(result.properties.users).toEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
          required: ['id', 'name'],
        },
      });
    });
  });

  describe('Optional and Default Values', () => {
    it('should handle optional properties', () => {
      const zodSchema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      const result = converter.convertZodToJsonSchema(zodSchema);

      expect(result.required).toEqual(['required']);
      expect(result.properties.optional).toEqual({
        type: 'string',
      });
    });

    it('should handle default values', () => {
      const zodSchema = z.object({
        withDefault: z.string().default('default value'),
        withoutDefault: z.string(),
      });

      const result = converter.convertZodToJsonSchema(zodSchema);

      expect(result.properties.withDefault).toEqual({
        type: 'string',
        default: 'default value',
      });
      expect(result.required).toEqual(['withoutDefault']);
    });

    it('should handle nullable types', () => {
      const zodSchema = z.object({
        nullable: z.string().nullable(),
      });

      const result = converter.convertZodToJsonSchema(zodSchema);

      expect(result.properties.nullable).toEqual({
        type: 'string',
        description: 'Nullable: No description',
      });
    });
  });

  describe('String Constraints', () => {
    it('should handle string length constraints', () => {
      const zodSchema = z.string().min(5).max(50);
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'string',
        minLength: 5,
        maxLength: 50,
      });
    });

    it('should handle string format constraints', () => {
      const emailSchema = z.string().email();
      const urlSchema = z.string().url();
      const uuidSchema = z.string().uuid();

      expect(converter.convertZodTypeToProperty(emailSchema)).toEqual({
        type: 'string',
        format: 'email',
      });

      expect(converter.convertZodTypeToProperty(urlSchema)).toEqual({
        type: 'string',
        format: 'uri',
      });

      expect(converter.convertZodTypeToProperty(uuidSchema)).toEqual({
        type: 'string',
        format: 'uuid',
      });
    });

    it('should handle regex patterns', () => {
      const zodSchema = z.string().regex(/^[A-Z]+$/);
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'string',
        pattern: '^[A-Z]+$',
      });
    });
  });

  describe('Number Constraints', () => {
    it('should handle integer type', () => {
      const zodSchema = z.number().int();
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'integer',
      });
    });

    it('should handle min/max constraints', () => {
      const zodSchema = z.number().min(10).max(100);
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'number',
        minimum: 10,
        maximum: 100,
      });
    });
  });

  describe('Union Types', () => {
    it('should handle union types by taking first option', () => {
      const zodSchema = z.union([z.string(), z.number()]);
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'string',
        description: 'Union type (simplified to first option)',
      });
    });
  });

  describe('Literal Types', () => {
    it('should handle string literals', () => {
      const zodSchema = z.literal('specific-value');
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'string',
        enum: ['specific-value'],
      });
    });

    it('should handle number literals', () => {
      const zodSchema = z.literal(42);
      const result = converter.convertZodTypeToProperty(zodSchema);

      expect(result).toEqual({
        type: 'number',
        enum: [42],
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported types gracefully', () => {
      // Create a mock Zod type that's not supported
      const unsupportedType = {
        _def: { typeName: 'ZodUnsupported' },
      } as any;

      const result = converter.convertZodTypeToProperty(unsupportedType);

      expect(result).toEqual({
        type: 'string',
        description: 'Unsupported type: ZodUnsupported',
      });
    });

    it('should handle conversion errors in strict mode', () => {
      const invalidSchema = null as any;

      expect(() => {
        converter.convertZodToJsonSchema(invalidSchema, { strictMode: true });
      }).toThrow(ValidationError);
    });

    it('should handle conversion errors in non-strict mode', () => {
      const zodSchema = z.object({
        valid: z.string(),
        // This would cause an error in property conversion
      });

      const result = converter.convertZodToJsonSchema(zodSchema, { strictMode: false });

      expect(result.type).toBe('object');
      expect(result.properties.valid).toEqual({
        type: 'string',
      });
    });

    it('should handle maximum depth exceeded', () => {
      const deepSchema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.string(),
          }),
        }),
      });

      const result = converter.convertZodToJsonSchema(deepSchema, { maxDepth: 2 });

      expect(result.properties.level1.properties.level2).toEqual({
        type: 'string',
        description: 'Maximum depth exceeded',
      });
    });
  });

  describe('Conversion Options', () => {
    it('should respect includeDescriptions option', () => {
      const zodSchema = z.string().describe('Test description');

      const withDescriptions = converter.convertZodTypeToProperty(zodSchema, {
        includeDescriptions: true,
      });

      const withoutDescriptions = converter.convertZodTypeToProperty(zodSchema, {
        includeDescriptions: false,
      });

      expect(withDescriptions.description).toBe('Test description');
      expect(withoutDescriptions.description).toBeUndefined();
    });

    it('should respect includeDefaults option', () => {
      const zodSchema = z.string().default('default value');

      const withDefaults = converter.convertZodTypeToProperty(zodSchema, {
        includeDefaults: true,
      });

      const withoutDefaults = converter.convertZodTypeToProperty(zodSchema, {
        includeDefaults: false,
      });

      expect(withDefaults.default).toBe('default value');
      expect(withoutDefaults.default).toBeUndefined();
    });
  });

  describe('Caching', () => {
    it('should cache conversion results', () => {
      const zodSchema = z.string().describe('Cached string');

      // First conversion
      const result1 = converter.convertZodTypeToProperty(zodSchema);
      const stats1 = converter.getStats();

      // Second conversion (should use cache)
      const result2 = converter.convertZodTypeToProperty(zodSchema);
      const stats2 = converter.getStats();

      expect(result1).toEqual(result2);
      // Stats should be the same since second call used cache
      expect(stats2.totalProperties).toBe(stats1.totalProperties);
    });

    it('should clear cache when requested', () => {
      const zodSchema = z.string();
      converter.convertZodTypeToProperty(zodSchema);

      converter.clearCache();

      // After clearing cache, conversion should work normally
      const result = converter.convertZodTypeToProperty(zodSchema);
      expect(result.type).toBe('string');
    });
  });

  describe('Statistics', () => {
    it('should track conversion statistics', () => {
      const zodSchema = z.object({
        prop1: z.string(),
        prop2: z.number(),
        prop3: z.boolean(),
      });

      converter.convertZodToJsonSchema(zodSchema);
      const stats = converter.getStats();

      expect(stats.totalProperties).toBe(3);
      expect(stats.successfulConversions).toBe(3);
      expect(stats.failedConversions).toBe(0);
      expect(stats.conversionTime).toBeGreaterThan(0);
    });

    it('should track unsupported types', () => {
      const unsupportedType = {
        _def: { typeName: 'ZodCustom' },
      } as any;

      converter.convertZodTypeToProperty(unsupportedType);
      const stats = converter.getStats();

      expect(stats.unsupportedTypes).toContain('ZodCustom');
    });
  });

  describe('Complex Real-World Scenarios', () => {
    it('should handle the sample schema from TestDataGenerator', () => {
      const sampleSchema = TestDataGenerator.createSampleZodSchema();
      const result = converter.convertZodToJsonSchema(sampleSchema);

      TestAssertions.assertValidJsonSchema(result);

      expect(result.properties.name).toEqual({
        type: 'string',
        description: 'The name of the item',
      });

      expect(result.properties.age).toEqual({
        type: 'integer',
        description: 'Age in years',
        minimum: 0,
        maximum: 150,
      });

      expect(result.properties.email).toEqual({
        type: 'string',
        description: 'Email address',
        format: 'email',
      });

      expect(result.properties.tags).toEqual({
        type: 'array',
        description: 'List of tags',
        items: { type: 'string' },
        default: [],
      });

      expect(result.properties.isActive).toEqual({
        type: 'boolean',
        description: 'Whether the item is active',
        default: true,
      });

      expect(result.properties.category).toEqual({
        type: 'string',
        description: 'Category selection',
        enum: ['A', 'B', 'C'],
      });

      expect(result.required).toEqual(['name', 'age']);
    });
  });
});
