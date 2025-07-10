/**
 * Enhanced C++ Analyzer with Tree-sitter AST Support
 * 
 * Provides comprehensive C++ code analysis using Tree-sitter for accurate
 * syntax parsing, semantic analysis, and advanced code understanding.
 */

import Parser from 'tree-sitter';
import Cpp from 'tree-sitter-cpp';
// import { readFile } from 'fs/promises'; // Unused import
// import { join, dirname, basename, extname } from 'path'; // Unused imports
import { FileSystemManager } from '../utils/FileSystemManager.js';
import { logger } from '../utils/logger.js';
import {
  AnalysisError,
  ErrorCode,
} from '../errors/ErrorTypes.js';

/**
 * Enhanced C++ analysis result with AST-based insights
 */
export interface EnhancedCppAnalysisResult {
  // Basic metrics
  metrics: {
    totalLines: number;
    codeLines: number;
    commentLines: number;
    blankLines: number;
    complexity: ComplexityMetrics;
  };
  
  // AST-based structural analysis
  structure: {
    namespaces: CppNamespace[];
    classes: CppClass[];
    functions: CppFunction[];
    variables: CppVariable[];
    enums: CppEnum[];
    templates: CppTemplate[];
    macros: CppMacro[];
  };
  
  // Dependencies and includes
  dependencies: {
    systemIncludes: string[];
    userIncludes: string[];
    dependencyGraph: DependencyNode[];
    circularDependencies: string[][];
  };
  
  // Modern C++ features analysis
  modernCpp: {
    cppStandard: string;
    featuresUsed: ModernCppFeature[];
    recommendations: string[];
    score: number;
  };
  
  // Performance analysis
  performance: {
    hotspots: PerformanceHotspot[];
    optimizations: OptimizationSuggestion[];
    score: number;
  };
  
  // Memory management analysis
  memory: {
    issues: MemoryIssue[];
    smartPointerUsage: SmartPointerAnalysis;
    raii: RaiiAnalysis;
    score: number;
  };
  
  // Security analysis
  security: {
    vulnerabilities: SecurityVulnerability[];
    recommendations: string[];
    score: number;
  };
  
  // CUDA/GPU specific analysis (if applicable)
  cuda?: {
    kernels: CudaKernel[];
    memoryTransfers: CudaMemoryTransfer[];
    optimizations: CudaOptimization[];
    score: number;
  };
}

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  halstead: HalsteadMetrics;
  maintainabilityIndex: number;
}

export interface HalsteadMetrics {
  vocabulary: number;
  length: number;
  volume: number;
  difficulty: number;
  effort: number;
  timeToProgram: number;
  bugsDelivered: number;
}

export interface CppNamespace {
  name: string;
  line: number;
  column: number;
  nested: boolean;
  members: string[];
}

export interface CppClass {
  name: string;
  line: number;
  column: number;
  type: 'class' | 'struct' | 'union';
  inheritance: string[];
  members: ClassMember[];
  isTemplate: boolean;
  templateParameters?: string[];
  accessSpecifiers: AccessSpecifier[];
}

export interface ClassMember {
  name: string;
  type: string;
  memberType: 'field' | 'method' | 'constructor' | 'destructor';
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isVirtual: boolean;
  isConst: boolean;
  line: number;
}

export interface AccessSpecifier {
  type: 'public' | 'private' | 'protected';
  line: number;
}

export interface CppFunction {
  name: string;
  line: number;
  column: number;
  returnType: string;
  parameters: FunctionParameter[];
  isStatic: boolean;
  isVirtual: boolean;
  isConst: boolean;
  isNoexcept: boolean;
  isTemplate: boolean;
  templateParameters?: string[];
  complexity: number;
  bodyLines: number;
}

export interface FunctionParameter {
  name: string;
  type: string;
  defaultValue?: string;
  isConst: boolean;
  isReference: boolean;
  isPointer: boolean;
}

export interface CppVariable {
  name: string;
  type: string;
  line: number;
  column: number;
  isGlobal: boolean;
  isStatic: boolean;
  isConst: boolean;
  isConstexpr: boolean;
  initialValue?: string;
}

export interface CppEnum {
  name: string;
  line: number;
  column: number;
  isScoped: boolean;
  underlyingType?: string;
  values: EnumValue[];
}

export interface EnumValue {
  name: string;
  value?: string;
  line: number;
}

export interface CppTemplate {
  name: string;
  line: number;
  column: number;
  type: 'function' | 'class' | 'variable' | 'alias';
  parameters: TemplateParameter[];
  specializations: string[];
}

export interface TemplateParameter {
  name: string;
  type: 'typename' | 'class' | 'auto' | 'value';
  defaultValue?: string;
}

export interface CppMacro {
  name: string;
  line: number;
  column: number;
  parameters?: string[];
  body: string;
  isFunctionLike: boolean;
}

export interface DependencyNode {
  file: string;
  includes: string[];
  includedBy: string[];
  depth: number;
}

export interface ModernCppFeature {
  name: string;
  standard: string;
  used: boolean;
  locations: FeatureLocation[];
  recommendation?: string;
}

export interface FeatureLocation {
  line: number;
  column: number;
  context: string;
}

export interface PerformanceHotspot {
  type: 'loop' | 'recursion' | 'allocation' | 'io' | 'string_ops';
  line: number;
  column: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  estimatedImpact: string;
}

export interface OptimizationSuggestion {
  type: string;
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  locations: number[];
}

export interface MemoryIssue {
  type: 'leak' | 'double_free' | 'use_after_free' | 'buffer_overflow' | 'uninitialized';
  line: number;
  column: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fix: string;
}

export interface SmartPointerAnalysis {
  uniquePtr: number;
  sharedPtr: number;
  weakPtr: number;
  rawPointers: number;
  recommendations: string[];
}

export interface RaiiAnalysis {
  score: number;
  violations: RaiiViolation[];
  recommendations: string[];
}

export interface RaiiViolation {
  line: number;
  type: string;
  description: string;
  fix: string;
}

export interface SecurityVulnerability {
  type: string;
  line: number;
  column: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  cwe?: string;
  fix: string;
}

// CUDA-specific interfaces
export interface CudaKernel {
  name: string;
  line: number;
  gridDim: string;
  blockDim: string;
  sharedMemory?: number;
  parameters: FunctionParameter[];
  optimizations: string[];
}

export interface CudaMemoryTransfer {
  type: 'host_to_device' | 'device_to_host' | 'device_to_device';
  line: number;
  size: string;
  isAsync: boolean;
  stream?: string;
}

export interface CudaOptimization {
  type: string;
  description: string;
  benefit: string;
  locations: number[];
}

/**
 * Enhanced C++ Analyzer using Tree-sitter
 */
export class EnhancedCppAnalyzer {
  private parser: Parser;
  private fileSystemManager: FileSystemManager;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Cpp);
    this.fileSystemManager = new FileSystemManager();
  }

  /**
   * Perform comprehensive C++ analysis
   */
  async analyzeFile(filePath: string, options: {
    cppStandard?: string;
    includeCuda?: boolean;
    includePerformance?: boolean;
    includeMemory?: boolean;
    includeSecurity?: boolean;
  } = {}): Promise<EnhancedCppAnalysisResult> {
    try {
      logger.info(`Starting enhanced C++ analysis for: ${filePath}`);
      
      const content = await this.fileSystemManager.readFileContent(filePath);
      const tree = this.parser.parse(content);
      
      const result: EnhancedCppAnalysisResult = {
        metrics: await this.analyzeMetrics(tree, content),
        structure: await this.analyzeStructure(tree, content),
        dependencies: await this.analyzeDependencies(tree, content, filePath),
        modernCpp: await this.analyzeModernCpp(tree, content, options.cppStandard || 'cpp17'),
        performance: options.includePerformance ? await this.analyzePerformance(tree, content) : { hotspots: [], optimizations: [], score: 0 },
        memory: options.includeMemory ? await this.analyzeMemory(tree, content) : { issues: [], smartPointerUsage: { uniquePtr: 0, sharedPtr: 0, weakPtr: 0, rawPointers: 0, recommendations: [] }, raii: { score: 0, violations: [], recommendations: [] }, score: 0 },
        security: options.includeSecurity ? await this.analyzeSecurity(tree, content) : { vulnerabilities: [], recommendations: [], score: 0 },
      };
      
      // Add CUDA analysis if requested and CUDA code detected
      if (options.includeCuda && this.detectCudaCode(content)) {
        result.cuda = await this.analyzeCuda(tree, content);
      }
      
      logger.info(`Enhanced C++ analysis completed for: ${filePath}`);
      return result;
      
    } catch (error) {
      throw new AnalysisError(
        `Enhanced C++ analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.ANALYSIS_FAILED,
        { additionalInfo: { filePath, options } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze code metrics using AST
   */
  private async analyzeMetrics(tree: Parser.Tree, content: string): Promise<{ totalLines: number; codeLines: number; commentLines: number; blankLines: number; complexity: ComplexityMetrics }> {
    const lines = content.split('\n');
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') {
        blankLines++;
      } else if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLines++;
      } else {
        codeLines++;
      }
    }
    
    const complexity = this.calculateComplexity(tree);

    return {
      totalLines: lines.length,
      codeLines,
      commentLines,
      blankLines,
      complexity,
    };
  }

  /**
   * Calculate complexity metrics from AST
   */
  private calculateComplexity(tree: Parser.Tree): ComplexityMetrics {
    // This is a simplified implementation
    // In a real implementation, we would traverse the AST to calculate accurate metrics
    
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(tree);
    const cognitiveComplexity = this.calculateCognitiveComplexity(tree);
    const halstead = this.calculateHalsteadMetrics(tree);
    const maintainabilityIndex = this.calculateMaintainabilityIndex(cyclomaticComplexity, halstead);
    
    return {
      cyclomatic: cyclomaticComplexity,
      cognitive: cognitiveComplexity,
      halstead,
      maintainabilityIndex,
    };
  }

  /**
   * Calculate cyclomatic complexity from AST
   */
  private calculateCyclomaticComplexity(tree: Parser.Tree): number {
    let complexity = 1; // Base complexity

    // Traverse the AST to count decision points
    const traverse = (node: Parser.SyntaxNode) => {
      switch (node.type) {
        case 'if_statement':
        case 'while_statement':
        case 'for_statement':
        case 'do_statement':
        case 'switch_statement':
        case 'case_statement':
        case 'conditional_expression':
          complexity++;
          break;
        case 'logical_and_expression':
        case 'logical_or_expression':
          complexity++;
          break;
      }

      // Recursively traverse child nodes
      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    traverse(tree.rootNode);
    return complexity;
  }

  /**
   * Calculate cognitive complexity
   */
  private calculateCognitiveComplexity(tree: Parser.Tree): number {
    let complexity = 0;

    const traverse = (node: Parser.SyntaxNode, currentNesting: number) => {
      let increment = 0;
      let newNesting = currentNesting;

      switch (node.type) {
        case 'if_statement':
        case 'while_statement':
        case 'for_statement':
        case 'do_statement':
          increment = 1 + currentNesting;
          newNesting = currentNesting + 1;
          break;
        case 'switch_statement':
          increment = 1 + currentNesting;
          newNesting = currentNesting + 1;
          break;
        case 'case_statement':
          increment = 1;
          break;
        case 'conditional_expression':
          increment = 1 + currentNesting;
          break;
        case 'logical_and_expression':
        case 'logical_or_expression':
          increment = 1;
          break;
        case 'catch_clause':
          increment = 1 + currentNesting;
          newNesting = currentNesting + 1;
          break;
        case 'lambda_expression':
          increment = 1;
          newNesting = currentNesting + 1;
          break;
      }

      complexity += increment;

      // Recursively traverse child nodes
      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!, newNesting);
      }
    };

    traverse(tree.rootNode, 0);
    return complexity;
  }

  /**
   * Calculate Halstead metrics
   */
  private calculateHalsteadMetrics(tree: Parser.Tree): HalsteadMetrics {
    const operators = new Set<string>();
    const operands = new Set<string>();
    let operatorCount = 0;
    let operandCount = 0;

    const operatorTypes = new Set([
      '+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=',
      '&&', '||', '!', '&', '|', '^', '~', '<<', '>>', '++', '--',
      '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=',
      'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'default',
      'return', 'break', 'continue', 'goto', 'try', 'catch', 'throw'
    ]);

    const traverse = (node: Parser.SyntaxNode) => {
      const nodeText = node.text;

      // Count operators
      if (operatorTypes.has(node.type) || operatorTypes.has(nodeText)) {
        operators.add(nodeText);
        operatorCount++;
      }
      // Count operands (identifiers, literals)
      else if (node.type === 'identifier' ||
               node.type === 'number_literal' ||
               node.type === 'string_literal' ||
               node.type === 'character_literal') {
        operands.add(nodeText);
        operandCount++;
      }

      // Recursively traverse child nodes
      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    traverse(tree.rootNode);

    const n1 = operators.size; // Unique operators
    const n2 = operands.size;  // Unique operands
    const N1 = operatorCount;  // Total operators
    const N2 = operandCount;   // Total operands

    const vocabulary = n1 + n2;
    const length = N1 + N2;
    const volume = length * Math.log2(vocabulary || 1);
    const difficulty = (n1 / 2) * (N2 / (n2 || 1));
    const effort = difficulty * volume;
    const timeToProgram = effort / 18; // Seconds
    const bugsDelivered = volume / 3000;

    return {
      vocabulary,
      length,
      volume: Math.round(volume * 100) / 100,
      difficulty: Math.round(difficulty * 100) / 100,
      effort: Math.round(effort * 100) / 100,
      timeToProgram: Math.round(timeToProgram * 100) / 100,
      bugsDelivered: Math.round(bugsDelivered * 1000) / 1000,
    };
  }

  /**
   * Calculate maintainability index
   */
  private calculateMaintainabilityIndex(cyclomaticComplexity: number, halstead: HalsteadMetrics, linesOfCode: number = 100): number {
    // Maintainability Index = 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code)
    const halsteadVolume = halstead.volume || 1;
    const logVolume = Math.log(halsteadVolume);
    const logLoc = Math.log(linesOfCode || 1);

    const maintainabilityIndex = 171 - 5.2 * logVolume - 0.23 * cyclomaticComplexity - 16.2 * logLoc;

    // Normalize to 0-100 scale
    return Math.max(0, Math.min(100, maintainabilityIndex));
  }

  /**
   * Detect CUDA code in content
   */
  private detectCudaCode(content: string): boolean {
    const cudaKeywords = [
      '__global__', '__device__', '__host__',
      'cudaMalloc', 'cudaFree', 'cudaMemcpy',
      'blockIdx', 'threadIdx', 'blockDim', 'gridDim',
      '<<<', '>>>'
    ];
    
    return cudaKeywords.some(keyword => content.includes(keyword));
  }

  // Structural analysis methods
  private async analyzeStructure(tree: Parser.Tree, _content: string): Promise<any> {
    const structure = {
      namespaces: [] as CppNamespace[],
      classes: [] as CppClass[],
      functions: [] as CppFunction[],
      variables: [] as CppVariable[],
      enums: [] as CppEnum[],
      templates: [] as CppTemplate[],
      macros: [] as CppMacro[],
    };

    const traverse = (node: Parser.SyntaxNode) => {
      switch (node.type) {
        case 'namespace_definition':
          structure.namespaces.push(this.extractNamespace(node));
          break;
        case 'class_specifier':
        case 'struct_specifier':
          structure.classes.push(this.extractClass(node));
          break;
        case 'function_definition':
        case 'function_declarator':
          structure.functions.push(this.extractFunction(node));
          break;
        case 'declaration':
          const variable = this.extractVariable(node);
          if (variable) structure.variables.push(variable);
          break;
        case 'enum_specifier':
          structure.enums.push(this.extractEnum(node));
          break;
        case 'template_declaration':
          structure.templates.push(this.extractTemplate(node));
          break;
        case 'preproc_def':
        case 'preproc_function_def':
          structure.macros.push(this.extractMacro(node));
          break;
      }

      // Recursively traverse child nodes
      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    traverse(tree.rootNode);
    return structure;
  }

  private async analyzeDependencies(tree: Parser.Tree, _content: string, filePath: string): Promise<any> {
    const systemIncludes: string[] = [];
    const userIncludes: string[] = [];

    const traverse = (node: Parser.SyntaxNode) => {
      if (node.type === 'preproc_include') {
        const includeText = node.text;
        const match = includeText.match(/#include\s*[<"](.*)[>"]/);
        if (match && match[1]) {
          const includePath = match[1];
          if (includeText.includes('<')) {
            systemIncludes.push(includePath);
          } else {
            userIncludes.push(includePath);
          }
        }
      }

      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    traverse(tree.rootNode);

    return {
      systemIncludes,
      userIncludes,
      dependencyGraph: [{ file: filePath, includes: [...systemIncludes, ...userIncludes], includedBy: [], depth: 0 }],
      circularDependencies: [], // Would require cross-file analysis
    };
  }

  private async analyzeModernCpp(_tree: Parser.Tree, _content: string, cppStandard: string): Promise<any> {
    // Implementation would detect modern C++ features usage
    return {
      cppStandard,
      featuresUsed: [],
      recommendations: [],
      score: 0,
    };
  }

  private async analyzePerformance(_tree: Parser.Tree, _content: string): Promise<any> {
    // Implementation would identify performance hotspots
    return {
      hotspots: [],
      optimizations: [],
      score: 0,
    };
  }

  private async analyzeMemory(_tree: Parser.Tree, _content: string): Promise<any> {
    // Implementation would analyze memory management patterns
    return {
      issues: [],
      smartPointerUsage: {
        uniquePtr: 0,
        sharedPtr: 0,
        weakPtr: 0,
        rawPointers: 0,
        recommendations: [],
      },
      raii: {
        score: 0,
        violations: [],
        recommendations: [],
      },
      score: 0,
    };
  }

  private async analyzeSecurity(_tree: Parser.Tree, _content: string): Promise<any> {
    // Implementation would identify security vulnerabilities
    return {
      vulnerabilities: [],
      recommendations: [],
      score: 0,
    };
  }

  private async analyzeCuda(_tree: Parser.Tree, _content: string): Promise<any> {
    // Implementation would analyze CUDA-specific patterns
    return {
      kernels: [],
      memoryTransfers: [],
      optimizations: [],
      score: 0,
    };
  }

  // Extraction methods for structural analysis
  private extractNamespace(node: Parser.SyntaxNode): CppNamespace {
    const nameNode = node.childForFieldName('name');
    return {
      name: nameNode?.text || 'anonymous',
      line: node.startPosition.row + 1,
      column: node.startPosition.column,
      nested: false, // Would need parent analysis
      members: [], // Would need member analysis
    };
  }

  private extractClass(node: Parser.SyntaxNode): CppClass {
    const nameNode = node.childForFieldName('name');
    return {
      name: nameNode?.text || 'anonymous',
      line: node.startPosition.row + 1,
      column: node.startPosition.column,
      type: node.type === 'struct_specifier' ? 'struct' : 'class',
      inheritance: [], // Would need inheritance analysis
      members: [], // Would need member analysis
      isTemplate: false, // Would need template analysis
      accessSpecifiers: [], // Would need access specifier analysis
    };
  }

  private extractFunction(node: Parser.SyntaxNode): CppFunction {
    const nameNode = node.childForFieldName('declarator')?.childForFieldName('declarator');
    return {
      name: nameNode?.text || 'anonymous',
      line: node.startPosition.row + 1,
      column: node.startPosition.column,
      returnType: 'unknown', // Would need type analysis
      parameters: [], // Would need parameter analysis
      isStatic: false, // Would need modifier analysis
      isVirtual: false,
      isConst: false,
      isNoexcept: false,
      isTemplate: false,
      complexity: 1, // Would calculate from body
      bodyLines: node.endPosition.row - node.startPosition.row,
    };
  }

  private extractVariable(node: Parser.SyntaxNode): CppVariable | null {
    // Simplified variable extraction
    const declarator = node.childForFieldName('declarator');
    if (!declarator) return null;

    return {
      name: declarator.text || 'unknown',
      type: 'unknown', // Would need type analysis
      line: node.startPosition.row + 1,
      column: node.startPosition.column,
      isGlobal: false, // Would need scope analysis
      isStatic: false,
      isConst: false,
      isConstexpr: false,
    };
  }

  private extractEnum(node: Parser.SyntaxNode): CppEnum {
    const nameNode = node.childForFieldName('name');
    return {
      name: nameNode?.text || 'anonymous',
      line: node.startPosition.row + 1,
      column: node.startPosition.column,
      isScoped: false, // Would need analysis
      values: [], // Would need value analysis
    };
  }

  private extractTemplate(node: Parser.SyntaxNode): CppTemplate {
    return {
      name: 'template', // Would need name analysis
      line: node.startPosition.row + 1,
      column: node.startPosition.column,
      type: 'function', // Would need type analysis
      parameters: [], // Would need parameter analysis
      specializations: [], // Would need specialization analysis
    };
  }

  private extractMacro(node: Parser.SyntaxNode): CppMacro {
    const nameNode = node.childForFieldName('name');
    return {
      name: nameNode?.text || 'unknown',
      line: node.startPosition.row + 1,
      column: node.startPosition.column,
      body: node.text,
      isFunctionLike: node.type === 'preproc_function_def',
    };
  }
}
