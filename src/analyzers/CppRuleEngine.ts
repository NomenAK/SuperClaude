/**
 * SuperAugment C++ Rule Engine
 * 
 * Provides rule-based code quality analysis for C++ code,
 * supporting different C++ standards and custom rule sets.
 */

import { logger } from '../utils/logger.js';
import { readFile } from 'fs/promises';

/**
 * Rule violation interface
 */
export interface RuleViolation {
  rule: string;
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

/**
 * C++ rule definition
 */
export interface CppRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  cppStandards: string[];
  pattern?: RegExp;
  check: (line: string, lineNumber: number, content: string, filePath: string) => RuleViolation | null;
}

/**
 * Rule category definitions
 */
export enum RuleCategory {
  STYLE = 'style',
  PERFORMANCE = 'performance',
  MEMORY = 'memory',
  SECURITY = 'security',
  MODERN_CPP = 'modern-cpp',
  BEST_PRACTICES = 'best-practices',
  NAMING = 'naming',
  COMPLEXITY = 'complexity',
}

/**
 * C++ Rule Engine
 */
export class CppRuleEngine {
  private rules: Map<string, CppRule> = new Map();
  private rulesByCategory: Map<string, CppRule[]> = new Map();

  constructor() {
    this.initializeBuiltInRules();
  }

  /**
   * Load rules for specific C++ standard and custom rules
   */
  async loadRules(cppStandard: string, customRuleNames: string[] = []): Promise<CppRule[]> {
    const applicableRules: CppRule[] = [];

    // Get built-in rules for the C++ standard
    for (const rule of this.rules.values()) {
      if (rule.cppStandards.includes(cppStandard) || rule.cppStandards.includes('all')) {
        applicableRules.push(rule);
      }
    }

    // Add custom rules if specified
    for (const ruleName of customRuleNames) {
      const rule = this.rules.get(ruleName);
      if (rule && !applicableRules.includes(rule)) {
        applicableRules.push(rule);
      }
    }

    logger.info(`Loaded ${applicableRules.length} rules for C++ standard ${cppStandard}`, {
      cppStandard,
      customRules: customRuleNames.length,
      totalRules: applicableRules.length,
    });

    return applicableRules;
  }

  /**
   * Analyze file against loaded rules
   */
  async analyzeFile(filePath: string, content: string, rules: CppRule[]): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = [];
    const lines = content.split('\n');

    for (const rule of rules) {
      try {
        // Check each line against the rule
        lines.forEach((line, index) => {
          const violation = rule.check(line, index + 1, content, filePath);
          if (violation) {
            violations.push(violation);
          }
        });
      } catch (error) {
        logger.warn(`Error applying rule ${rule.id} to ${filePath}`, { error });
      }
    }

    return violations;
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): CppRule[] {
    return this.rulesByCategory.get(category) || [];
  }

  /**
   * Get all available rules
   */
  getAllRules(): CppRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Initialize built-in rules
   */
  private initializeBuiltInRules(): void {
    // Style rules
    this.addRule({
      id: 'cpp-style-001',
      name: 'Brace Style',
      description: 'Enforce consistent brace style',
      severity: 'warning',
      category: RuleCategory.STYLE,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        if (line.trim().endsWith('{') && line.includes('if ') && !line.includes('\n')) {
          return {
            rule: 'cpp-style-001',
            file: filePath,
            line: lineNumber,
            column: line.indexOf('{'),
            severity: 'warning',
            message: 'Opening brace should be on next line',
            suggestion: 'Move opening brace to next line for better readability',
          };
        }
        return null;
      },
    });

    this.addRule({
      id: 'cpp-style-002',
      name: 'Line Length',
      description: 'Enforce maximum line length',
      severity: 'warning',
      category: RuleCategory.STYLE,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        if (line.length > 120) {
          return {
            rule: 'cpp-style-002',
            file: filePath,
            line: lineNumber,
            column: 120,
            severity: 'warning',
            message: 'Line too long (>120 characters)',
            suggestion: 'Break long lines for better readability',
          };
        }
        return null;
      },
    });

    // Performance rules
    this.addRule({
      id: 'cpp-perf-001',
      name: 'Pass by Reference',
      description: 'Large objects should be passed by const reference',
      severity: 'warning',
      category: RuleCategory.PERFORMANCE,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        const match = line.match(/(\w+)\s+(\w+)\s*\([^)]*std::(string|vector|map|set)\s+(\w+)[^)]*\)/);
        if (match && match[1] && !line.includes('const') && !line.includes('&')) {
          return {
            rule: 'cpp-perf-001',
            file: filePath,
            line: lineNumber,
            column: match[3] ? line.indexOf(match[3]) : 0,
            severity: 'warning',
            message: 'Large object passed by value',
            suggestion: 'Pass large objects by const reference to avoid unnecessary copying',
          };
        }
        return null;
      },
    });

    this.addRule({
      id: 'cpp-perf-002',
      name: 'String Concatenation',
      description: 'Avoid inefficient string concatenation',
      severity: 'warning',
      category: RuleCategory.PERFORMANCE,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        if (line.includes('string') && line.includes('+') && !line.includes('append')) {
          return {
            rule: 'cpp-perf-002',
            file: filePath,
            line: lineNumber,
            column: line.indexOf('+'),
            severity: 'warning',
            message: 'Inefficient string concatenation',
            suggestion: 'Use std::string::append() or std::stringstream for better performance',
          };
        }
        return null;
      },
    });

    // Memory rules
    this.addRule({
      id: 'cpp-mem-001',
      name: 'Raw Pointer Usage',
      description: 'Avoid raw pointers in favor of smart pointers',
      severity: 'warning',
      category: RuleCategory.MEMORY,
      cppStandards: ['cpp11', 'cpp14', 'cpp17', 'cpp20', 'cpp23'],
      check: (line, lineNumber, _content, filePath) => {
        if (line.includes('new ') && !line.includes('std::') && !line.includes('//')) {
          return {
            rule: 'cpp-mem-001',
            file: filePath,
            line: lineNumber,
            column: line.indexOf('new'),
            severity: 'warning',
            message: 'Raw pointer allocation detected',
            suggestion: 'Use std::unique_ptr or std::shared_ptr for automatic memory management',
          };
        }
        return null;
      },
    });

    this.addRule({
      id: 'cpp-mem-002',
      name: 'Memory Leak Prevention',
      description: 'Ensure proper memory deallocation',
      severity: 'error',
      category: RuleCategory.MEMORY,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        if (line.includes('new ') && !_content.includes('delete') && !line.includes('std::')) {
          return {
            rule: 'cpp-mem-002',
            file: filePath,
            line: lineNumber,
            column: line.indexOf('new'),
            severity: 'error',
            message: 'Potential memory leak - new without delete',
            suggestion: 'Ensure proper memory deallocation or use RAII',
          };
        }
        return null;
      },
    });

    // Security rules
    this.addRule({
      id: 'cpp-sec-001',
      name: 'Unsafe String Functions',
      description: 'Avoid unsafe C string functions',
      severity: 'error',
      category: RuleCategory.SECURITY,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        const unsafeFunctions = ['strcpy', 'strcat', 'sprintf', 'gets'];
        for (const func of unsafeFunctions) {
          if (line.includes(`${func}(`)) {
            return {
              rule: 'cpp-sec-001',
              file: filePath,
              line: lineNumber,
              column: line.indexOf(func),
              severity: 'error',
              message: `Unsafe function ${func} detected`,
              suggestion: `Use safe alternatives like strncpy, strncat, snprintf, or std::string`,
            };
          }
        }
        return null;
      },
    });

    this.addRule({
      id: 'cpp-sec-002',
      name: 'Buffer Overflow Prevention',
      description: 'Prevent potential buffer overflows',
      severity: 'error',
      category: RuleCategory.SECURITY,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        if (line.includes('char ') && line.includes('[') && !line.includes('const')) {
          const match = line.match(/char\s+\w+\[(\d+)\]/);
          if (match && match[1] && match[1] && parseInt(match[1]) > 1024) {
            return {
              rule: 'cpp-sec-002',
              file: filePath,
              line: lineNumber,
              column: line.indexOf('char'),
              severity: 'error',
              message: 'Large fixed-size buffer detected',
              suggestion: 'Use std::string or std::vector for dynamic sizing',
            };
          }
        }
        return null;
      },
    });

    // Modern C++ rules
    this.addRule({
      id: 'cpp-modern-001',
      name: 'Use nullptr',
      description: 'Use nullptr instead of NULL',
      severity: 'warning',
      category: RuleCategory.MODERN_CPP,
      cppStandards: ['cpp11', 'cpp14', 'cpp17', 'cpp20', 'cpp23'],
      check: (line, lineNumber, _content, filePath) => {
        if (line.includes('NULL') && !line.includes('//') && !line.includes('/*')) {
          return {
            rule: 'cpp-modern-001',
            file: filePath,
            line: lineNumber,
            column: line.indexOf('NULL'),
            severity: 'warning',
            message: 'Use nullptr instead of NULL',
            suggestion: 'Replace NULL with nullptr for type safety',
          };
        }
        return null;
      },
    });

    this.addRule({
      id: 'cpp-modern-002',
      name: 'Use auto keyword',
      description: 'Consider using auto for type deduction',
      severity: 'info',
      category: RuleCategory.MODERN_CPP,
      cppStandards: ['cpp11', 'cpp14', 'cpp17', 'cpp20', 'cpp23'],
      check: (line, lineNumber, _content, filePath) => {
        const match = line.match(/^\s*(std::\w+(?:<[^>]+>)?)\s+(\w+)\s*=/);
        if (match && match[1] && match[1] && !line.includes('auto')) {
          return {
            rule: 'cpp-modern-002',
            file: filePath,
            line: lineNumber,
            column: match[1] ? line.indexOf(match[1]) : 0,
            severity: 'info',
            message: 'Consider using auto for type deduction',
            suggestion: 'Use auto to improve code readability and maintainability',
          };
        }
        return null;
      },
    });

    this.addRule({
      id: 'cpp-modern-003',
      name: 'Range-based for loops',
      description: 'Use range-based for loops when possible',
      severity: 'info',
      category: RuleCategory.MODERN_CPP,
      cppStandards: ['cpp11', 'cpp14', 'cpp17', 'cpp20', 'cpp23'],
      check: (line, lineNumber, _content, filePath) => {
        const match = line.match(/for\s*\(\s*\w+\s+\w+\s*=\s*\w+\.begin\(\)/);
        if (match) {
          return {
            rule: 'cpp-modern-003',
            file: filePath,
            line: lineNumber,
            column: line.indexOf('for'),
            severity: 'info',
            message: 'Consider using range-based for loop',
            suggestion: 'Use range-based for loop for cleaner iteration',
          };
        }
        return null;
      },
    });

    // Best practices rules
    this.addRule({
      id: 'cpp-best-001',
      name: 'Include Guards',
      description: 'Header files should have include guards',
      severity: 'warning',
      category: RuleCategory.BEST_PRACTICES,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        if (filePath.endsWith('.h') || filePath.endsWith('.hpp')) {
          if (lineNumber === 1 && !line.includes('#ifndef') && !line.includes('#pragma once')) {
            return {
              rule: 'cpp-best-001',
              file: filePath,
              line: lineNumber,
              column: 0,
              severity: 'warning',
              message: 'Header file missing include guard',
              suggestion: 'Add #pragma once or #ifndef include guard',
            };
          }
        }
        return null;
      },
    });

    this.addRule({
      id: 'cpp-best-002',
      name: 'Const Correctness',
      description: 'Use const where appropriate',
      severity: 'warning',
      category: RuleCategory.BEST_PRACTICES,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        const match = line.match(/(\w+)\s*\*\s*(\w+)\s*=/);
        if (match && match[1] && !line.includes('const') && !line.includes('//')) {
          return {
            rule: 'cpp-best-002',
            file: filePath,
            line: lineNumber,
            column: match[1] ? line.indexOf(match[1]) : 0,
            severity: 'warning',
            message: 'Consider using const for immutable data',
            suggestion: 'Add const qualifier for better code safety',
          };
        }
        return null;
      },
    });

    // Naming rules
    this.addRule({
      id: 'cpp-naming-001',
      name: 'Class Naming Convention',
      description: 'Class names should use PascalCase',
      severity: 'warning',
      category: RuleCategory.NAMING,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        const match = line.match(/class\s+([a-z]\w*)/);
        if (match) {
          return {
            rule: 'cpp-naming-001',
            file: filePath,
            line: lineNumber,
            column: match[1] ? line.indexOf(match[1]) : 0,
            severity: 'warning',
            message: 'Class name should use PascalCase',
            suggestion: 'Use PascalCase for class names (e.g., MyClass)',
          };
        }
        return null;
      },
    });

    this.addRule({
      id: 'cpp-naming-002',
      name: 'Constant Naming Convention',
      description: 'Constants should use UPPER_CASE',
      severity: 'info',
      category: RuleCategory.NAMING,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        const match = line.match(/const\s+\w+\s+([a-z]\w*)\s*=/);
        if (match && match[1] && !match[1].includes('_')) {
          return {
            rule: 'cpp-naming-002',
            file: filePath,
            line: lineNumber,
            column: match[1] ? line.indexOf(match[1]) : 0,
            severity: 'info',
            message: 'Constant should use UPPER_CASE naming',
            suggestion: 'Use UPPER_CASE for constant names (e.g., MAX_SIZE)',
          };
        }
        return null;
      },
    });

    // Complexity rules
    this.addRule({
      id: 'cpp-complex-001',
      name: 'Function Length',
      description: 'Functions should not be too long',
      severity: 'warning',
      category: RuleCategory.COMPLEXITY,
      cppStandards: ['all'],
      check: (line, lineNumber, _content, filePath) => {
        // This is a simplified check - would need more sophisticated analysis
        if (line.includes('{') && _content.split('\n').length > 100) {
          return {
            rule: 'cpp-complex-001',
            file: filePath,
            line: lineNumber,
            column: 0,
            severity: 'warning',
            message: 'Function may be too long',
            suggestion: 'Consider breaking down large functions into smaller ones',
          };
        }
        return null;
      },
    });

    // Organize rules by category
    this.organizeRulesByCategory();
  }

  /**
   * Add a rule to the engine
   */
  private addRule(rule: CppRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Organize rules by category for easy access
   */
  private organizeRulesByCategory(): void {
    this.rulesByCategory.clear();
    
    for (const rule of this.rules.values()) {
      if (!this.rulesByCategory.has(rule.category)) {
        this.rulesByCategory.set(rule.category, []);
      }
      this.rulesByCategory.get(rule.category)!.push(rule);
    }
  }

  /**
   * Load custom rules from configuration
   */
  async loadCustomRules(configPath: string): Promise<void> {
    try {
      const config = await readFile(configPath, 'utf-8');
      const customRules = JSON.parse(config);
      
      for (const ruleConfig of customRules.rules || []) {
        const rule: CppRule = {
          id: ruleConfig.id,
          name: ruleConfig.name,
          description: ruleConfig.description,
          severity: ruleConfig.severity,
          category: ruleConfig.category,
          cppStandards: ruleConfig.cppStandards || ['all'],
          check: this.createRuleFromConfig(ruleConfig),
        };
        
        this.addRule(rule);
      }
      
      this.organizeRulesByCategory();
      logger.info(`Loaded ${customRules.rules?.length || 0} custom rules from ${configPath}`);
    } catch (error) {
      logger.warn(`Failed to load custom rules from ${configPath}`, { error });
    }
  }

  /**
   * Create a rule check function from configuration
   */
  private createRuleFromConfig(ruleConfig: any): CppRule['check'] {
    return (line: string, lineNumber: number, _content: string, filePath: string) => {
      // Simplified rule creation from config
      // In a real implementation, this would support more sophisticated rule definitions
      if (ruleConfig.pattern && new RegExp(ruleConfig.pattern).test(line)) {
        return {
          rule: ruleConfig.id,
          file: filePath,
          line: lineNumber,
          column: 0,
          severity: ruleConfig.severity,
          message: ruleConfig.message || 'Rule violation detected',
          suggestion: ruleConfig.suggestion || 'Fix the violation',
        };
      }
      return null;
    };
  }

  /**
   * Get rule statistics
   */
  getRuleStatistics(): {
    totalRules: number;
    rulesByCategory: Record<string, number>;
    rulesBySeverity: Record<string, number>;
  } {
    const rulesByCategory: Record<string, number> = {};
    const rulesBySeverity: Record<string, number> = {};

    for (const rule of this.rules.values()) {
      rulesByCategory[rule.category] = (rulesByCategory[rule.category] || 0) + 1;
      rulesBySeverity[rule.severity] = (rulesBySeverity[rule.severity] || 0) + 1;
    }

    return {
      totalRules: this.rules.size,
      rulesByCategory,
      rulesBySeverity,
    };
  }
}
