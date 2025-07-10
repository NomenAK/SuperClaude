/**
 * SuperAugment C++ Code Analyzer
 * 
 * Provides comprehensive C++ code analysis including syntax parsing,
 * semantic analysis, dependency tracking, and code metrics calculation.
 */

import { join, dirname } from 'path';
import { FileSystemManager } from '../utils/FileSystemManager.js';
import { logger } from '../utils/logger.js';
import {
  AnalysisError,
  ErrorCode,
} from '../errors/ErrorTypes.js';

/**
 * C++ analysis result interfaces
 */
export interface CppAnalysisResult {
  lineCount: {
    total: number;
    code: number;
    comments: number;
    blank: number;
  };
  functions: CppFunction[];
  classes: CppClass[];
  namespaces: CppNamespace[];
  includes: CppInclude[];
  variables: CppVariable[];
  enums: CppEnum[];
}

export interface CppFunction {
  name: string;
  line: number;
  returnType: string;
  parameters: CppParameter[];
  isStatic: boolean;
  isVirtual: boolean;
  isConst: boolean;
  complexity: number;
  bodyLines: number;
}

export interface CppClass {
  name: string;
  line: number;
  type: 'class' | 'struct';
  baseClasses: string[];
  methods: CppFunction[];
  members: CppVariable[];
  accessLevel: 'public' | 'private' | 'protected';
}

export interface CppNamespace {
  name: string;
  line: number;
  nested: boolean;
}

export interface CppInclude {
  file: string;
  line: number;
  type: 'system' | 'local';
  found: boolean;
  path?: string;
}

export interface CppVariable {
  name: string;
  line: number;
  type: string;
  isStatic: boolean;
  isConst: boolean;
  scope: string;
}

export interface CppParameter {
  name: string;
  type: string;
  defaultValue?: string;
}

export interface CppEnum {
  name: string;
  line: number;
  values: string[];
  isClass: boolean;
}

/**
 * Modern C++ features analysis
 */
export interface ModernCppFeatures {
  features: {
    name: string;
    used: boolean;
    recommendation: string;
  }[];
  improvements: string[];
}

/**
 * Performance analysis result
 */
export interface PerformanceAnalysis {
  hotspots: {
    file: string;
    line: number;
    issue: string;
    severity: string;
    suggestion: string;
  }[];
  optimizations: string[];
}

/**
 * Memory analysis result
 */
export interface MemoryAnalysis {
  issues: {
    file: string;
    line: number;
    type: string;
    description: string;
    fix: string;
  }[];
  recommendations: string[];
}

/**
 * Security analysis result
 */
export interface SecurityAnalysis {
  vulnerabilities: {
    file: string;
    line: number;
    type: string;
    severity: string;
    description: string;
    mitigation: string;
  }[];
  recommendations: string[];
}

/**
 * Dependency analysis result
 */
export interface DependencyAnalysis {
  includes: CppInclude[];
  circularDependencies: string[][];
  missingIncludes: string[];
}

/**
 * Code metrics
 */
export interface CodeMetrics {
  cyclomatic: number;
  cognitive: number;
  halstead: {
    volume: number;
    difficulty: number;
    effort: number;
  };
}

/**
 * C++ Code Analyzer
 */
export class CppAnalyzer {
  private fileSystemManager: FileSystemManager;

  constructor(fileSystemManager: FileSystemManager) {
    this.fileSystemManager = fileSystemManager;
  }

  /**
   * Analyze C++ syntax and structure
   */
  async analyzeSyntax(filePath: string, cppStandard: string): Promise<CppAnalysisResult> {
    try {
      const content = await this.fileSystemManager.readFileContent(filePath);
      const lines = content.split('\n');

      const result: CppAnalysisResult = {
        lineCount: this.analyzeLineCount(lines),
        functions: this.extractFunctions(lines),
        classes: this.extractClasses(lines),
        namespaces: this.extractNamespaces(lines),
        includes: this.extractIncludes(lines, filePath),
        variables: this.extractVariables(lines),
        enums: this.extractEnums(lines),
      };

      return result;
    } catch (error) {
      throw new AnalysisError(
        `Failed to analyze C++ syntax: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.ANALYSIS_FAILED,
        { additionalInfo: { filePath, cppStandard } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze C++ semantics (placeholder implementation)
   */
  async analyzeSemantics(_filePath: string, _cppStandard: string): Promise<any> {
    // Placeholder for semantic analysis
    // In a real implementation, this would involve:
    // - Type checking
    // - Scope analysis
    // - Symbol resolution
    // - Template instantiation analysis
    return {};
  }

  /**
   * Analyze dependencies and includes
   */
  async analyzeDependencies(filePath: string, maxDepth: number): Promise<DependencyAnalysis> {
    try {
      const content = await this.fileSystemManager.readFileContent(filePath);
      const lines = content.split('\n');
      const includes = this.extractIncludes(lines, filePath);

      // Resolve include paths
      for (const include of includes) {
        include.found = await this.resolveIncludePath(include, filePath);
      }

      return {
        includes,
        circularDependencies: [], // Placeholder
        missingIncludes: includes.filter(inc => !inc.found).map(inc => inc.file),
      };
    } catch (error) {
      throw new AnalysisError(
        `Failed to analyze dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.ANALYSIS_FAILED,
        { additionalInfo: { filePath, maxDepth } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze modern C++ features usage
   */
  async analyzeModernCppFeatures(files: string[], cppStandard: string): Promise<ModernCppFeatures> {
    const features = this.getModernCppFeatures(cppStandard);
    const usageMap = new Map<string, boolean>();

    // Initialize all features as unused
    features.forEach(feature => usageMap.set(feature.name, false));

    // Check usage in files
    for (const file of files) {
      try {
        const content = await this.fileSystemManager.readFileContent(file);
        this.checkFeatureUsage(content, usageMap);
      } catch (error) {
        logger.warn(`Failed to analyze modern C++ features in ${file}`, { error });
      }
    }

    // Generate recommendations
    const improvements: string[] = [];
    features.forEach(feature => {
      if (!usageMap.get(feature.name)) {
        improvements.push(feature.recommendation);
      }
    });

    return {
      features: features.map(feature => ({
        ...feature,
        used: usageMap.get(feature.name) || false,
      })),
      improvements,
    };
  }

  /**
   * Analyze performance issues
   */
  async analyzePerformance(filePath: string): Promise<PerformanceAnalysis> {
    try {
      const content = await this.fileSystemManager.readFileContent(filePath);
      const lines = content.split('\n');
      const hotspots: PerformanceAnalysis['hotspots'] = [];
      const optimizations: string[] = [];

      // Check for common performance issues
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();

        // Check for inefficient string operations
        if (trimmedLine.includes('string +') || trimmedLine.includes('+ string')) {
          hotspots.push({
            file: filePath,
            line: lineNum,
            issue: 'Inefficient string concatenation',
            severity: 'medium',
            suggestion: 'Use std::stringstream or std::string::append() for better performance',
          });
        }

        // Check for unnecessary copies
        if (trimmedLine.match(/\w+\s+\w+\s*=\s*\w+\s*\[/)) {
          hotspots.push({
            file: filePath,
            line: lineNum,
            issue: 'Potential unnecessary copy',
            severity: 'medium',
            suggestion: 'Consider using const reference or move semantics',
          });
        }

        // Check for inefficient loops
        if (trimmedLine.includes('vector.size()') && trimmedLine.includes('for')) {
          hotspots.push({
            file: filePath,
            line: lineNum,
            issue: 'Inefficient loop condition',
            severity: 'low',
            suggestion: 'Cache vector.size() in a variable or use range-based for loop',
          });
        }
      });

      // Generate general optimizations
      if (content.includes('std::vector')) {
        optimizations.push('Consider using std::vector::reserve() when the size is known in advance');
      }
      if (content.includes('std::map')) {
        optimizations.push('Consider using std::unordered_map for better average performance');
      }

      return { hotspots, optimizations };
    } catch (error) {
      throw new AnalysisError(
        `Failed to analyze performance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.ANALYSIS_FAILED,
        { additionalInfo: { filePath } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze memory management issues
   */
  async analyzeMemory(filePath: string): Promise<MemoryAnalysis> {
    try {
      const content = await this.fileSystemManager.readFileContent(filePath);
      const lines = content.split('\n');
      const issues: MemoryAnalysis['issues'] = [];
      const recommendations: string[] = [];

      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();

        // Check for raw pointers
        if (trimmedLine.includes('new ') && !trimmedLine.includes('std::')) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'raw_pointer',
            description: 'Raw pointer allocation detected',
            fix: 'Use smart pointers (std::unique_ptr, std::shared_ptr) instead',
          });
        }

        // Check for missing delete
        if (trimmedLine.includes('new ') && !content.includes('delete')) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'memory_leak',
            description: 'Potential memory leak - new without corresponding delete',
            fix: 'Ensure proper memory deallocation or use RAII',
          });
        }

        // Check for array allocation
        if (trimmedLine.includes('new[]') && !trimmedLine.includes('delete[]')) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'array_leak',
            description: 'Array allocation without proper deallocation',
            fix: 'Use delete[] for array deallocation or prefer std::vector',
          });
        }
      });

      // Generate recommendations
      if (content.includes('malloc') || content.includes('free')) {
        recommendations.push('Prefer C++ memory management (new/delete) over C-style malloc/free');
      }
      if (issues.length > 0) {
        recommendations.push('Consider using RAII (Resource Acquisition Is Initialization) pattern');
        recommendations.push('Use smart pointers to automatically manage memory');
      }

      return { issues, recommendations };
    } catch (error) {
      throw new AnalysisError(
        `Failed to analyze memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.ANALYSIS_FAILED,
        { additionalInfo: { filePath } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze security vulnerabilities
   */
  async analyzeSecurity(filePath: string): Promise<SecurityAnalysis> {
    try {
      const content = await this.fileSystemManager.readFileContent(filePath);
      const lines = content.split('\n');
      const vulnerabilities: SecurityAnalysis['vulnerabilities'] = [];
      const recommendations: string[] = [];

      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();

        // Check for unsafe functions
        if (trimmedLine.includes('strcpy') || trimmedLine.includes('strcat')) {
          vulnerabilities.push({
            file: filePath,
            line: lineNum,
            type: 'buffer_overflow',
            severity: 'high',
            description: 'Unsafe string function that can cause buffer overflow',
            mitigation: 'Use safe alternatives like strncpy, strncat, or std::string',
          });
        }

        // Check for gets function
        if (trimmedLine.includes('gets(')) {
          vulnerabilities.push({
            file: filePath,
            line: lineNum,
            type: 'buffer_overflow',
            severity: 'critical',
            description: 'gets() function is inherently unsafe',
            mitigation: 'Use fgets() or std::getline() instead',
          });
        }

        // Check for printf format vulnerabilities
        if (trimmedLine.includes('printf(') && !trimmedLine.includes('printf("')) {
          vulnerabilities.push({
            file: filePath,
            line: lineNum,
            type: 'format_string',
            severity: 'medium',
            description: 'Potential format string vulnerability',
            mitigation: 'Always use format strings with printf family functions',
          });
        }
      });

      // Generate recommendations
      if (vulnerabilities.length > 0) {
        recommendations.push('Review and replace unsafe C functions with secure alternatives');
        recommendations.push('Enable compiler warnings for deprecated and unsafe functions');
      }
      recommendations.push('Use static analysis tools for comprehensive security scanning');
      recommendations.push('Follow secure coding guidelines (CERT C++, MISRA C++)');

      return { vulnerabilities, recommendations };
    } catch (error) {
      throw new AnalysisError(
        `Failed to analyze security: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.ANALYSIS_FAILED,
        { additionalInfo: { filePath } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Calculate code metrics
   */
  async calculateMetrics(filePath: string): Promise<CodeMetrics> {
    try {
      const content = await this.fileSystemManager.readFileContent(filePath);
      const lines = content.split('\n');

      const cyclomatic = this.calculateCyclomaticComplexity(lines);
      const cognitive = this.calculateCognitiveComplexity(lines);
      const halstead = this.calculateHalsteadMetrics(content);

      return {
        cyclomatic,
        cognitive,
        halstead,
      };
    } catch (error) {
      throw new AnalysisError(
        `Failed to calculate metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.ANALYSIS_FAILED,
        { additionalInfo: { filePath } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze line count statistics
   */
  private analyzeLineCount(lines: string[]): CppAnalysisResult['lineCount'] {
    let code = 0;
    let comments = 0;
    let blank = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === '') {
        blank++;
      } else if (trimmed.startsWith('//')) {
        comments++;
      } else if (trimmed.startsWith('/*')) {
        comments++;
        inBlockComment = !trimmed.includes('*/');
      } else if (inBlockComment) {
        comments++;
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
      } else {
        code++;
      }
    }

    return {
      total: lines.length,
      code,
      comments,
      blank,
    };
  }

  /**
   * Extract function definitions
   */
  private extractFunctions(lines: string[]): CppFunction[] {
    const functions: CppFunction[] = [];
    const functionRegex = /^\s*(?:(static|virtual|inline)\s+)?(\w+(?:\s*\*|\s*&)?)\s+(\w+)\s*\([^)]*\)\s*(?:const)?\s*{?/;

    lines.forEach((line, index) => {
      const match = line.match(functionRegex);
      if (match && !line.includes('//') && !line.includes('/*')) {
        const [, modifier, returnType, name] = match;
        
        functions.push({
          name: name || 'unknown',
          line: index + 1,
          returnType: returnType || 'void',
          parameters: [], // Simplified - would need proper parsing
          isStatic: modifier === 'static',
          isVirtual: modifier === 'virtual',
          isConst: line.includes('const'),
          complexity: 1, // Simplified
          bodyLines: 0, // Would need to count actual body lines
        });
      }
    });

    return functions;
  }

  /**
   * Extract class definitions
   */
  private extractClasses(lines: string[]): CppClass[] {
    const classes: CppClass[] = [];
    const classRegex = /^\s*(class|struct)\s+(\w+)(?:\s*:\s*(.+))?\s*{?/;

    lines.forEach((line, index) => {
      const match = line.match(classRegex);
      if (match && !line.includes('//')) {
        const [, type, name, inheritance] = match;
        
        classes.push({
          name: name || 'unknown',
          line: index + 1,
          type: type as 'class' | 'struct',
          baseClasses: inheritance ? inheritance.split(',').map(s => s.trim()) : [],
          methods: [],
          members: [],
          accessLevel: type === 'struct' ? 'public' : 'private',
        });
      }
    });

    return classes;
  }

  /**
   * Extract namespace definitions
   */
  private extractNamespaces(lines: string[]): CppNamespace[] {
    const namespaces: CppNamespace[] = [];
    const namespaceRegex = /^\s*namespace\s+(\w+)\s*{?/;

    lines.forEach((line, index) => {
      const match = line.match(namespaceRegex);
      if (match && !line.includes('//')) {
        namespaces.push({
          name: match[1] || 'unknown',
          line: index + 1,
          nested: false, // Simplified
        });
      }
    });

    return namespaces;
  }

  /**
   * Extract include statements
   */
  private extractIncludes(lines: string[], _filePath: string): CppInclude[] {
    const includes: CppInclude[] = [];
    const includeRegex = /^\s*#include\s*[<"](.*)[>"]$/;

    lines.forEach((line, index) => {
      const match = line.match(includeRegex);
      if (match) {
        const file = match[1];
        const isSystem = line.includes('<');
        
        includes.push({
          file: file || 'unknown',
          line: index + 1,
          type: isSystem ? 'system' : 'local',
          found: false, // Will be resolved later
        });
      }
    });

    return includes;
  }

  /**
   * Extract variable declarations
   */
  private extractVariables(_lines: string[]): CppVariable[] {
    const variables: CppVariable[] = [];
    // Simplified variable extraction
    return variables;
  }

  /**
   * Extract enum definitions
   */
  private extractEnums(lines: string[]): CppEnum[] {
    const enums: CppEnum[] = [];
    const enumRegex = /^\s*enum\s+(class\s+)?(\w+)\s*{?/;

    lines.forEach((line, index) => {
      const match = line.match(enumRegex);
      if (match && !line.includes('//')) {
        enums.push({
          name: match[2] || 'unknown',
          line: index + 1,
          values: [], // Would need to parse enum values
          isClass: !!match[1],
        });
      }
    });

    return enums;
  }

  /**
   * Resolve include path
   */
  private async resolveIncludePath(include: CppInclude, filePath: string): Promise<boolean> {
    try {
      if (include.type === 'system') {
        // System includes are assumed to exist
        return true;
      }

      // Try to resolve local includes
      const dir = dirname(filePath);
      const includePath = join(dir, include.file);
      
      return await this.fileSystemManager.fileExists(includePath);
    } catch {
      return false;
    }
  }

  /**
   * Get modern C++ features for a given standard
   */
  private getModernCppFeatures(cppStandard: string): { name: string; recommendation: string }[] {
    const features = [
      { name: 'auto', recommendation: 'Use auto for type deduction to improve code readability' },
      { name: 'range-based for', recommendation: 'Use range-based for loops for cleaner iteration' },
      { name: 'lambda', recommendation: 'Use lambda expressions for inline function objects' },
      { name: 'smart pointers', recommendation: 'Use std::unique_ptr and std::shared_ptr for automatic memory management' },
      { name: 'move semantics', recommendation: 'Use std::move for efficient resource transfer' },
      { name: 'nullptr', recommendation: 'Use nullptr instead of NULL for null pointers' },
    ];

    if (cppStandard >= 'cpp14') {
      features.push(
        { name: 'generic lambdas', recommendation: 'Use generic lambdas for more flexible code' },
        { name: 'std::make_unique', recommendation: 'Use std::make_unique for safe unique_ptr creation' }
      );
    }

    if (cppStandard >= 'cpp17') {
      features.push(
        { name: 'structured bindings', recommendation: 'Use structured bindings for multiple return values' },
        { name: 'if constexpr', recommendation: 'Use if constexpr for compile-time conditionals' }
      );
    }

    if (cppStandard >= 'cpp20') {
      features.push(
        { name: 'concepts', recommendation: 'Use concepts for better template constraints' },
        { name: 'ranges', recommendation: 'Use ranges library for functional programming style' }
      );
    }

    return features;
  }

  /**
   * Check feature usage in content
   */
  private checkFeatureUsage(content: string, usageMap: Map<string, boolean>): void {
    if (content.includes('auto ')) usageMap.set('auto', true);
    if (content.includes('for (') && content.includes(' : ')) usageMap.set('range-based for', true);
    if (content.includes('[') && content.includes('](')) usageMap.set('lambda', true);
    if (content.includes('std::unique_ptr') || content.includes('std::shared_ptr')) usageMap.set('smart pointers', true);
    if (content.includes('std::move')) usageMap.set('move semantics', true);
    if (content.includes('nullptr')) usageMap.set('nullptr', true);
    if (content.includes('std::make_unique')) usageMap.set('std::make_unique', true);
    if (content.includes('auto [') || content.includes('auto&[')) usageMap.set('structured bindings', true);
    if (content.includes('if constexpr')) usageMap.set('if constexpr', true);
    if (content.includes('concept ')) usageMap.set('concepts', true);
    if (content.includes('std::ranges')) usageMap.set('ranges', true);
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateCyclomaticComplexity(lines: string[]): number {
    let complexity = 1; // Base complexity
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('if ') || trimmed.includes('else if ')) complexity++;
      if (trimmed.includes('while ') || trimmed.includes('for ')) complexity++;
      if (trimmed.includes('case ')) complexity++;
      if (trimmed.includes('catch ')) complexity++;
      if (trimmed.includes('&&') || trimmed.includes('||')) complexity++;
    }

    return complexity;
  }

  /**
   * Calculate cognitive complexity (simplified)
   */
  private calculateCognitiveComplexity(lines: string[]): number {
    // Simplified cognitive complexity calculation
    return this.calculateCyclomaticComplexity(lines) * 1.2;
  }

  /**
   * Calculate Halstead metrics (simplified)
   */
  private calculateHalsteadMetrics(content: string): CodeMetrics['halstead'] {
    // Simplified Halstead metrics
    const operators = content.match(/[+\-*/=<>!&|]/g) || [];
    const operands = content.match(/\b\w+\b/g) || [];
    
    const n1 = new Set(operators).size; // Unique operators
    const n2 = new Set(operands).size;  // Unique operands
    const N1 = operators.length;        // Total operators
    const N2 = operands.length;         // Total operands

    const vocabulary = n1 + n2;
    const length = N1 + N2;
    const volume = length * Math.log2(vocabulary || 1);
    const difficulty = (n1 / 2) * (N2 / (n2 || 1));
    const effort = difficulty * volume;

    return {
      volume: Math.round(volume),
      difficulty: Math.round(difficulty),
      effort: Math.round(effort),
    };
  }
}
