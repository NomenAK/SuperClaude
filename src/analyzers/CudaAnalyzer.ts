/**
 * CUDA Code Analyzer
 * 
 * Specialized analyzer for CUDA C/C++ code including kernel analysis,
 * memory management, performance optimization, and BSGS algorithm support.
 */

// import { readFile } from 'fs/promises'; // Unused import
import { FileSystemManager } from '../utils/FileSystemManager.js';
import { logger } from '../utils/logger.js';
import {
  AnalysisError,
  ErrorCode,
} from '../errors/ErrorTypes.js';

/**
 * CUDA analysis result interface
 */
export interface CudaAnalysisResult {
  summary: {
    totalKernels: number;
    totalDeviceFunctions: number;
    memoryTransfers: number;
    sharedMemoryUsage: number;
    registerUsage: number;
  };
  
  kernels: CudaKernel[];
  deviceFunctions: CudaDeviceFunction[];
  memoryOperations: CudaMemoryOperation[];
  optimizations: CudaOptimization[];
  
  // BSGS-specific analysis
  bsgs?: BsgsAnalysis;
  
  // Performance metrics
  performance: {
    occupancy: OccupancyAnalysis;
    memoryBandwidth: MemoryBandwidthAnalysis;
    computeIntensity: ComputeIntensityAnalysis;
  };
  
  // Common CUDA issues
  issues: CudaIssue[];
  recommendations: string[];
}

export interface CudaKernel {
  name: string;
  line: number;
  column: number;
  
  // Launch configuration
  gridDim: LaunchDimension;
  blockDim: LaunchDimension;
  sharedMemory: number;
  stream?: string;
  
  // Parameters
  parameters: CudaParameter[];
  
  // Analysis
  complexity: number;
  memoryAccess: MemoryAccessPattern[];
  syncPoints: SynchronizationPoint[];
  
  // Performance characteristics
  estimatedOccupancy: number;
  registerPressure: number;
  memoryCoalescing: CoalescingAnalysis;
  
  // BSGS specific
  isBsgsKernel: boolean;
  bsgsCharacteristics?: BsgsKernelCharacteristics;
}

export interface CudaDeviceFunction {
  name: string;
  line: number;
  column: number;
  isInline: boolean;
  parameters: CudaParameter[];
  calledBy: string[];
}

export interface CudaParameter {
  name: string;
  type: string;
  isPointer: boolean;
  isConst: boolean;
  isRestrict: boolean;
  memorySpace: 'global' | 'shared' | 'constant' | 'texture' | 'local' | 'register';
}

export interface LaunchDimension {
  x: string;
  y?: string;
  z?: string;
  isDynamic: boolean;
}

export interface CudaMemoryOperation {
  type: 'cudaMalloc' | 'cudaFree' | 'cudaMemcpy' | 'cudaMemcpyAsync' | 'cudaMemset';
  line: number;
  column: number;
  size?: string;
  direction?: 'H2D' | 'D2H' | 'D2D';
  isAsync: boolean;
  stream?: string;
}

export interface MemoryAccessPattern {
  type: 'coalesced' | 'strided' | 'random' | 'broadcast';
  line: number;
  variable: string;
  efficiency: number; // 0-100
}

export interface SynchronizationPoint {
  type: '__syncthreads' | '__syncwarp' | 'cudaDeviceSynchronize' | 'cudaStreamSynchronize';
  line: number;
  column: number;
  scope: 'block' | 'warp' | 'device' | 'stream';
}

export interface CoalescingAnalysis {
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

export interface OccupancyAnalysis {
  theoretical: number;
  achieved: number;
  limitingFactor: 'registers' | 'shared_memory' | 'blocks' | 'warps';
  recommendations: string[];
}

export interface MemoryBandwidthAnalysis {
  utilization: number; // 0-100
  bottlenecks: string[];
  recommendations: string[];
}

export interface ComputeIntensityAnalysis {
  ratio: number; // FLOPs per byte
  classification: 'memory_bound' | 'compute_bound' | 'balanced';
  recommendations: string[];
}

export interface CudaOptimization {
  type: 'memory' | 'compute' | 'occupancy' | 'synchronization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  locations: number[];
}

export interface CudaIssue {
  type: 'race_condition' | 'deadlock' | 'memory_leak' | 'uncoalesced_access' | 'bank_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  column: number;
  description: string;
  fix: string;
}

// BSGS-specific interfaces
export interface BsgsAnalysis {
  isImplemented: boolean;
  algorithm: 'baby_step_giant_step' | 'pollard_rho' | 'pohlig_hellman' | 'other';
  characteristics: BsgsCharacteristics;
  optimizations: BsgsOptimization[];
  performance: BsgsPerformance;
}

export interface BsgsCharacteristics {
  babySteps: number;
  giantSteps: number;
  memoryUsage: string;
  parallelization: 'thread_level' | 'block_level' | 'grid_level' | 'none';
  dataStructure: 'hash_table' | 'sorted_array' | 'binary_tree' | 'other';
}

export interface BsgsKernelCharacteristics {
  phase: 'baby_steps' | 'giant_steps' | 'collision_detection' | 'preprocessing';
  memoryPattern: 'sequential' | 'random' | 'strided';
  computeIntensity: 'low' | 'medium' | 'high';
  synchronizationNeeds: 'none' | 'block' | 'grid';
}

export interface BsgsOptimization {
  type: 'memory_layout' | 'parallelization' | 'algorithm' | 'data_structure';
  description: string;
  benefit: string;
  implementation: string;
}

export interface BsgsPerformance {
  estimatedSpeedup: number;
  memoryEfficiency: number;
  scalability: 'poor' | 'fair' | 'good' | 'excellent';
  bottlenecks: string[];
}

/**
 * CUDA Code Analyzer
 */
export class CudaAnalyzer {
  private fileSystemManager: FileSystemManager;

  constructor() {
    this.fileSystemManager = new FileSystemManager();
  }

  /**
   * Analyze CUDA file
   */
  async analyzeFile(filePath: string): Promise<CudaAnalysisResult> {
    try {
      logger.info(`Starting CUDA analysis for: ${filePath}`);
      
      const content = await this.fileSystemManager.readFileContent(filePath);
      const lines = content.split('\n');
      
      // Initialize result
      const result: CudaAnalysisResult = {
        summary: {
          totalKernels: 0,
          totalDeviceFunctions: 0,
          memoryTransfers: 0,
          sharedMemoryUsage: 0,
          registerUsage: 0,
        },
        kernels: [],
        deviceFunctions: [],
        memoryOperations: [],
        optimizations: [],
        performance: {
          occupancy: { theoretical: 0, achieved: 0, limitingFactor: 'blocks', recommendations: [] },
          memoryBandwidth: { utilization: 0, bottlenecks: [], recommendations: [] },
          computeIntensity: { ratio: 0, classification: 'balanced', recommendations: [] },
        },
        issues: [],
        recommendations: [],
      };

      // Analyze different aspects
      await this.analyzeKernels(lines, result);
      await this.analyzeDeviceFunctions(lines, result);
      await this.analyzeMemoryOperations(lines, result);
      await this.analyzeBsgsPatterns(lines, result);
      await this.analyzePerformance(lines, result);
      await this.detectIssues(lines, result);
      await this.generateOptimizations(result);

      // Update summary
      result.summary.totalKernels = result.kernels.length;
      result.summary.totalDeviceFunctions = result.deviceFunctions.length;
      result.summary.memoryTransfers = result.memoryOperations.length;

      logger.info(`CUDA analysis completed for: ${filePath}`);
      return result;
      
    } catch (error) {
      throw new AnalysisError(
        `CUDA analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.ANALYSIS_FAILED,
        { additionalInfo: { filePath } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze CUDA kernels
   */
  private async analyzeKernels(lines: string[], result: CudaAnalysisResult): Promise<void> {
    const kernelRegex = /__global__\s+\w+\s+(\w+)\s*\([^)]*\)/g;
    const launchRegex = /(\w+)<<<([^>]+)>>>/g;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Find kernel definitions
      const kernelMatch = kernelRegex.exec(trimmed);
      if (kernelMatch) {
        const kernel: CudaKernel = {
          name: kernelMatch[1] || 'unknown_kernel',
          line: index + 1,
          column: line.indexOf(kernelMatch[0]),
          gridDim: { x: '0', isDynamic: false },
          blockDim: { x: '0', isDynamic: false },
          sharedMemory: 0,
          parameters: this.parseKernelParameters(kernelMatch[0]),
          complexity: 0,
          memoryAccess: [],
          syncPoints: [],
          estimatedOccupancy: 0,
          registerPressure: 0,
          memoryCoalescing: { score: 0, issues: [], recommendations: [] },
          isBsgsKernel: this.detectBsgsKernel(kernelMatch[1] || 'unknown', lines),
        };

        if (kernel.isBsgsKernel) {
          kernel.bsgsCharacteristics = this.analyzeBsgsKernel(kernelMatch[1] || 'unknown', lines);
        }
        
        result.kernels.push(kernel);
      }
      
      // Find kernel launches
      const launchMatch = launchRegex.exec(trimmed);
      if (launchMatch) {
        const kernelName = launchMatch[1] || 'unknown';
        const launchConfig = launchMatch[2] || '';

        // Find corresponding kernel and update launch configuration
        const kernel = result.kernels.find(k => k.name === kernelName);
        if (kernel) {
          this.parseLaunchConfiguration(launchConfig, kernel);
        }
      }
    });
  }

  /**
   * Analyze device functions
   */
  private async analyzeDeviceFunctions(lines: string[], result: CudaAnalysisResult): Promise<void> {
    const deviceFuncRegex = /__device__\s+(?:__inline__)?\s*\w+\s+(\w+)\s*\([^)]*\)/g;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const match = deviceFuncRegex.exec(trimmed);
      
      if (match) {
        const deviceFunc: CudaDeviceFunction = {
          name: match[1] || 'unknown_device_func',
          line: index + 1,
          column: line.indexOf(match[0]),
          isInline: trimmed.includes('__inline__'),
          parameters: this.parseKernelParameters(match[0]),
          calledBy: [],
        };
        
        result.deviceFunctions.push(deviceFunc);
      }
    });
  }

  /**
   * Analyze memory operations
   */
  private async analyzeMemoryOperations(lines: string[], result: CudaAnalysisResult): Promise<void> {
    const memoryOps = [
      'cudaMalloc', 'cudaFree', 'cudaMemcpy', 'cudaMemcpyAsync', 'cudaMemset'
    ];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      memoryOps.forEach(op => {
        if (trimmed.includes(op)) {
          const memOp: CudaMemoryOperation = {
            type: op as any,
            line: index + 1,
            column: line.indexOf(op),
            isAsync: op.includes('Async'),
          };
          
          // Parse additional details based on operation type
          if (op === 'cudaMemcpy' || op === 'cudaMemcpyAsync') {
            memOp.direction = this.parseMemcpyDirection(trimmed);
            memOp.size = this.parseMemcpySize(trimmed);
          }
          
          result.memoryOperations.push(memOp);
        }
      });
    });
  }

  /**
   * Analyze BSGS patterns
   */
  private async analyzeBsgsPatterns(lines: string[], result: CudaAnalysisResult): Promise<void> {
    const bsgsKeywords = [
      'baby_step', 'giant_step', 'bsgs', 'discrete_log', 'collision',
      'hash_table', 'lookup_table', 'precompute', 'sqrt'
    ];
    
    let bsgsScore = 0;
    const bsgsLines: number[] = [];
    
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      bsgsKeywords.forEach(keyword => {
        if (lowerLine.includes(keyword)) {
          bsgsScore++;
          bsgsLines.push(index + 1);
        }
      });
    });
    
    if (bsgsScore > 3) { // Threshold for BSGS detection
      result.bsgs = {
        isImplemented: true,
        algorithm: this.detectBsgsAlgorithm(lines),
        characteristics: this.analyzeBsgsCharacteristics(lines),
        optimizations: this.generateBsgsOptimizations(lines),
        performance: this.analyzeBsgsPerformance(lines),
      };
    }
  }

  /**
   * Analyze performance characteristics
   */
  private async analyzePerformance(lines: string[], result: CudaAnalysisResult): Promise<void> {
    // Analyze occupancy
    result.performance.occupancy = this.analyzeOccupancy(result.kernels);
    
    // Analyze memory bandwidth
    result.performance.memoryBandwidth = this.analyzeMemoryBandwidth(result.memoryOperations);
    
    // Analyze compute intensity
    result.performance.computeIntensity = this.analyzeComputeIntensity(lines);
  }

  /**
   * Detect common CUDA issues
   */
  private async detectIssues(lines: string[], result: CudaAnalysisResult): Promise<void> {
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check for race conditions
      if (trimmed.includes('__shared__') && !trimmed.includes('__syncthreads')) {
        result.issues.push({
          type: 'race_condition',
          severity: 'high',
          line: index + 1,
          column: 0,
          description: 'Potential race condition with shared memory access',
          fix: 'Add __syncthreads() after shared memory writes',
        });
      }
      
      // Check for uncoalesced memory access
      if (this.detectUncoalescedAccess(trimmed)) {
        result.issues.push({
          type: 'uncoalesced_access',
          severity: 'medium',
          line: index + 1,
          column: 0,
          description: 'Potentially uncoalesced global memory access',
          fix: 'Ensure contiguous memory access patterns',
        });
      }
    });
  }

  /**
   * Generate optimization recommendations
   */
  private async generateOptimizations(result: CudaAnalysisResult): Promise<void> {
    // Memory optimizations
    if (result.memoryOperations.length > 10) {
      result.optimizations.push({
        type: 'memory',
        priority: 'high',
        description: 'Consider using unified memory or memory pools',
        benefit: 'Reduced memory allocation overhead',
        effort: 'medium',
        locations: result.memoryOperations.map(op => op.line),
      });
    }
    
    // Occupancy optimizations
    const lowOccupancyKernels = result.kernels.filter(k => k.estimatedOccupancy < 50);
    if (lowOccupancyKernels.length > 0) {
      result.optimizations.push({
        type: 'occupancy',
        priority: 'high',
        description: 'Optimize kernel launch configuration for better occupancy',
        benefit: 'Improved GPU utilization',
        effort: 'low',
        locations: lowOccupancyKernels.map(k => k.line),
      });
    }
  }

  // Helper methods
  private parseKernelParameters(kernelSignature: string): CudaParameter[] {
    // Extract parameters from kernel signature
    const paramMatch = kernelSignature.match(/\(([^)]*)\)/);
    if (!paramMatch || !paramMatch[1]) return [];

    const paramStr = paramMatch[1].trim();
    if (!paramStr) return [];

    const params = paramStr.split(',').map(p => p.trim());
    return params.map(param => {
      const parts = param.split(/\s+/);
      const name = parts[parts.length - 1] || 'unknown';
      const type = parts.slice(0, -1).join(' ') || 'unknown';

      return {
        name,
        type,
        isPointer: type.includes('*'),
        isConst: type.includes('const'),
        isRestrict: type.includes('__restrict__'),
        memorySpace: type.includes('__shared__') ? 'shared' as const : 'global' as const,
      };
    });
  }

  private parseLaunchConfiguration(config: string, kernel: CudaKernel): void {
    const parts = config.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      kernel.gridDim = { x: parts[0] || '1', isDynamic: (parts[0] || '').includes('(') };
      kernel.blockDim = { x: parts[1] || '1', isDynamic: (parts[1] || '').includes('(') };
    }
  }

  private parseMemcpyDirection(line: string): 'H2D' | 'D2H' | 'D2D' {
    if (line.includes('cudaMemcpyHostToDevice')) return 'H2D';
    if (line.includes('cudaMemcpyDeviceToHost')) return 'D2H';
    if (line.includes('cudaMemcpyDeviceToDevice')) return 'D2D';
    return 'H2D'; // default
  }

  private parseMemcpySize(line: string): string {
    // Extract size parameter from cudaMemcpy call
    const match = line.match(/cudaMemcpy[^(]*\([^,]*,[^,]*,([^,]*),/);
    return match && match[1] ? match[1].trim() : 'unknown';
  }

  private detectBsgsKernel(kernelName: string, lines: string[]): boolean {
    const bsgsPatterns = ['bsgs', 'baby', 'giant', 'step', 'discrete_log'];
    const kernelNameLower = kernelName.toLowerCase();
    const codeContent = lines.join('\n').toLowerCase();

    return bsgsPatterns.some(pattern =>
      kernelNameLower.includes(pattern) || codeContent.includes(pattern)
    );
  }

  private analyzeBsgsKernel(kernelName: string, lines: string[]): BsgsKernelCharacteristics {
    const content = lines.join('\n').toLowerCase();
    const kernelLower = kernelName.toLowerCase();

    // Determine phase based on kernel name and content
    let phase: 'baby_steps' | 'giant_steps' | 'collision_detection' | 'preprocessing' = 'preprocessing';
    if (kernelLower.includes('baby') || content.includes('baby')) phase = 'baby_steps';
    else if (kernelLower.includes('giant') || content.includes('giant')) phase = 'giant_steps';
    else if (kernelLower.includes('collision') || content.includes('collision')) phase = 'collision_detection';

    // Analyze memory pattern
    let memoryPattern: 'sequential' | 'random' | 'strided' = 'random';
    if (content.includes('sequential') || content.includes('coalesced')) memoryPattern = 'sequential';
    else if (content.includes('stride')) memoryPattern = 'strided';

    // Determine compute intensity
    let computeIntensity: 'low' | 'medium' | 'high' = 'medium';
    const mathOps = (content.match(/\*|\/|\+|\-|pow|sqrt|exp/g) || []).length;
    if (mathOps > 20) computeIntensity = 'high';
    else if (mathOps < 5) computeIntensity = 'low';

    // Analyze synchronization needs
    let synchronizationNeeds: 'none' | 'block' | 'grid' = 'none';
    if (content.includes('__syncthreads')) synchronizationNeeds = 'block';
    else if (content.includes('cudadevicesynchronize')) synchronizationNeeds = 'grid';

    return {
      phase,
      memoryPattern,
      computeIntensity,
      synchronizationNeeds,
    };
  }

  private detectBsgsAlgorithm(lines: string[]): 'baby_step_giant_step' | 'pollard_rho' | 'pohlig_hellman' | 'other' {
    // Analyze code patterns to determine specific algorithm
    const content = lines.join('\n').toLowerCase();

    if (content.includes('baby') && content.includes('giant')) {
      return 'baby_step_giant_step';
    } else if (content.includes('pollard') || content.includes('rho')) {
      return 'pollard_rho';
    } else if (content.includes('pohlig') || content.includes('hellman')) {
      return 'pohlig_hellman';
    }

    return 'other';
  }

  private analyzeBsgsCharacteristics(lines: string[]): BsgsCharacteristics {
    const content = lines.join('\n').toLowerCase();

    // Extract baby steps and giant steps counts
    let babySteps = 0;
    let giantSteps = 0;

    const babyMatch = content.match(/baby.*steps?\s*[=:]\s*(\d+)/);
    const giantMatch = content.match(/giant.*steps?\s*[=:]\s*(\d+)/);

    if (babyMatch && babyMatch[1]) babySteps = parseInt(babyMatch[1]);
    if (giantMatch && giantMatch[1]) giantSteps = parseInt(giantMatch[1]);

    // Detect parallelization level
    let parallelization: 'thread_level' | 'block_level' | 'grid_level' | 'none' = 'none';
    if (content.includes('threadidx')) parallelization = 'thread_level';
    if (content.includes('blockidx')) parallelization = 'block_level';
    if (content.includes('griddim')) parallelization = 'grid_level';

    // Detect data structure
    let dataStructure: 'hash_table' | 'sorted_array' | 'binary_tree' | 'other' = 'other';
    if (content.includes('hash') || content.includes('unordered_map')) dataStructure = 'hash_table';
    if (content.includes('sort') || content.includes('binary_search')) dataStructure = 'sorted_array';
    if (content.includes('tree') || content.includes('bst')) dataStructure = 'binary_tree';

    return {
      babySteps,
      giantSteps,
      memoryUsage: `${Math.max(babySteps, giantSteps) * 8} bytes (estimated)`,
      parallelization,
      dataStructure,
    };
  }

  private generateBsgsOptimizations(lines: string[]): BsgsOptimization[] {
    const content = lines.join('\n').toLowerCase();
    const optimizations: BsgsOptimization[] = [];

    // Memory layout optimization
    if (!content.includes('coalesced') && content.includes('global')) {
      optimizations.push({
        type: 'memory_layout',
        description: 'Use coalesced memory access for baby steps table',
        benefit: 'Improved memory bandwidth utilization by 2-4x',
        implementation: 'Reorganize data structure for sequential access patterns',
      });
    }

    // Parallelization optimization
    if (!content.includes('shared') && content.includes('collision')) {
      optimizations.push({
        type: 'parallelization',
        description: 'Implement parallel collision detection using shared memory',
        benefit: 'Reduced computation time by utilizing block-level parallelism',
        implementation: 'Use __shared__ memory for collision detection and __syncthreads()',
      });
    }

    // Algorithm optimization
    if (content.includes('linear') && !content.includes('binary')) {
      optimizations.push({
        type: 'algorithm',
        description: 'Replace linear search with binary search',
        benefit: 'Logarithmic search complexity instead of linear',
        implementation: 'Sort baby steps table and use binary search for collision detection',
      });
    }

    // Data structure optimization
    if (!content.includes('texture') && content.includes('lookup')) {
      optimizations.push({
        type: 'data_structure',
        description: 'Use texture memory for read-only lookup tables',
        benefit: 'Better cache performance and reduced memory latency',
        implementation: 'Bind lookup tables to texture memory with cudaBindTexture',
      });
    }

    return optimizations;
  }

  private analyzeBsgsPerformance(lines: string[]): BsgsPerformance {
    const content = lines.join('\n').toLowerCase();
    const bottlenecks: string[] = [];

    // Analyze potential bottlenecks
    if (content.includes('global') && !content.includes('coalesced')) {
      bottlenecks.push('Uncoalesced global memory access');
    }
    if (content.includes('hash') && content.includes('collision')) {
      bottlenecks.push('Hash table collisions');
    }
    if (content.includes('atomic') && !content.includes('shared')) {
      bottlenecks.push('Atomic operations on global memory');
    }
    if (!content.includes('async') && content.includes('memcpy')) {
      bottlenecks.push('Synchronous memory transfers');
    }

    // Estimate performance characteristics
    let estimatedSpeedup = 1.0;
    let memoryEfficiency = 50;
    let scalability: 'poor' | 'fair' | 'good' | 'excellent' = 'fair';

    // Calculate speedup based on parallelization
    if (content.includes('threadidx')) estimatedSpeedup *= 32; // Warp-level parallelism
    if (content.includes('blockidx')) estimatedSpeedup *= 4;   // Block-level parallelism
    if (content.includes('shared')) estimatedSpeedup *= 1.5;   // Shared memory usage

    // Calculate memory efficiency
    if (content.includes('coalesced')) memoryEfficiency += 30;
    if (content.includes('shared')) memoryEfficiency += 20;
    if (content.includes('texture')) memoryEfficiency += 15;

    memoryEfficiency = Math.min(100, memoryEfficiency);

    // Determine scalability
    if (estimatedSpeedup > 50 && memoryEfficiency > 80) scalability = 'excellent';
    else if (estimatedSpeedup > 20 && memoryEfficiency > 60) scalability = 'good';
    else if (estimatedSpeedup > 5 && memoryEfficiency > 40) scalability = 'fair';
    else scalability = 'poor';

    return {
      estimatedSpeedup: Math.round(estimatedSpeedup * 10) / 10,
      memoryEfficiency,
      scalability,
      bottlenecks,
    };
  }

  private analyzeOccupancy(kernels: CudaKernel[]): OccupancyAnalysis {
    if (kernels.length === 0) {
      return {
        theoretical: 0,
        achieved: 0,
        limitingFactor: 'blocks',
        recommendations: ['No kernels found to analyze'],
      };
    }

    let totalOccupancy = 0;
    let limitingFactor: 'registers' | 'shared_memory' | 'blocks' | 'warps' = 'blocks';
    const recommendations: string[] = [];

    for (const kernel of kernels) {
      // Estimate occupancy based on launch configuration
      const blockSize = parseInt(kernel.blockDim.x) || 256;
      // const warpsPerBlock = Math.ceil(blockSize / 32); // For future use

      // Simplified occupancy calculation
      let occupancy = 100;

      // Register pressure (estimated)
      if (kernel.registerPressure > 32) {
        occupancy *= 0.5;
        limitingFactor = 'registers';
        recommendations.push(`Reduce register usage in ${kernel.name} (estimated: ${kernel.registerPressure})`);
      }

      // Shared memory usage
      if (kernel.sharedMemory > 32768) { // 32KB typical limit
        occupancy *= 0.7;
        limitingFactor = 'shared_memory';
        recommendations.push(`Optimize shared memory usage in ${kernel.name} (${kernel.sharedMemory} bytes)`);
      }

      // Block size optimization
      if (blockSize < 128 || blockSize > 512) {
        occupancy *= 0.8;
        recommendations.push(`Optimize block size for ${kernel.name} (current: ${blockSize})`);
      }

      totalOccupancy += occupancy;
    }

    const avgOccupancy = totalOccupancy / kernels.length;

    // Add general recommendations
    if (avgOccupancy < 50) {
      recommendations.push('Consider using CUDA Occupancy Calculator for optimization');
      recommendations.push('Profile with nvprof or Nsight Compute for detailed analysis');
    }

    return {
      theoretical: 100,
      achieved: Math.round(avgOccupancy),
      limitingFactor,
      recommendations: [...new Set(recommendations)], // Remove duplicates
    };
  }

  private analyzeMemoryBandwidth(memOps: CudaMemoryOperation[]): MemoryBandwidthAnalysis {
    if (memOps.length === 0) {
      return {
        utilization: 0,
        bottlenecks: ['No memory operations found'],
        recommendations: ['Add memory operations analysis'],
      };
    }

    const bottlenecks: string[] = [];
    const recommendations: string[] = [];
    let utilization = 80; // Start with baseline

    // Analyze memory operations
    const asyncOps = memOps.filter(op => op.isAsync).length;
    const syncOps = memOps.length - asyncOps;

    if (syncOps > asyncOps) {
      bottlenecks.push('Excessive synchronous memory transfers');
      recommendations.push('Use asynchronous memory transfers (cudaMemcpyAsync)');
      utilization -= 20;
    }

    // Check for small transfers
    const smallTransfers = memOps.filter(op =>
      op.size && (op.size.includes('sizeof') || parseInt(op.size) < 1024)
    ).length;

    if (smallTransfers > memOps.length * 0.5) {
      bottlenecks.push('Many small memory transfers');
      recommendations.push('Batch small transfers into larger operations');
      utilization -= 15;
    }

    // Check for H2D/D2H patterns
    const h2dOps = memOps.filter(op => op.direction === 'H2D').length;
    const d2hOps = memOps.filter(op => op.direction === 'D2H').length;

    if (h2dOps > 0 && d2hOps > 0) {
      recommendations.push('Consider using unified memory for bidirectional transfers');
    }

    // Memory access pattern analysis (simplified)
    if (memOps.some(op => op.type === 'cudaMemcpy' && !op.isAsync)) {
      bottlenecks.push('Blocking memory transfers');
      recommendations.push('Use streams to overlap computation and memory transfers');
      utilization -= 10;
    }

    utilization = Math.max(0, Math.min(100, utilization));

    return {
      utilization,
      bottlenecks,
      recommendations,
    };
  }

  private analyzeComputeIntensity(lines: string[]): ComputeIntensityAnalysis {
    const content = lines.join('\n').toLowerCase();

    // Count arithmetic operations (simplified)
    const arithmeticOps = (content.match(/[+\-*/]/g) || []).length;
    const mathFunctions = (content.match(/\b(sin|cos|tan|exp|log|sqrt|pow)\b/g) || []).length;
    const totalFlops = arithmeticOps + mathFunctions * 10; // Math functions are more expensive

    // Count memory operations
    const memoryOps = (content.match(/\[|\]|cudamemcpy|global|shared/g) || []).length;
    const bytesPerOp = 4; // Assume 4-byte operations
    const totalBytes = memoryOps * bytesPerOp;

    // Calculate compute intensity (FLOPs per byte)
    const ratio = totalBytes > 0 ? totalFlops / totalBytes : 0;

    let classification: 'memory_bound' | 'compute_bound' | 'balanced';
    const recommendations: string[] = [];

    if (ratio < 1.0) {
      classification = 'memory_bound';
      recommendations.push('Increase arithmetic intensity by fusing operations');
      recommendations.push('Use shared memory to reduce global memory accesses');
      recommendations.push('Consider loop unrolling to increase compute per memory access');
    } else if (ratio > 4.0) {
      classification = 'compute_bound';
      recommendations.push('Optimize arithmetic operations');
      recommendations.push('Use faster math functions (__sinf, __cosf, etc.)');
      recommendations.push('Consider reducing precision if acceptable');
    } else {
      classification = 'balanced';
      recommendations.push('Good balance between compute and memory operations');
      recommendations.push('Focus on occupancy optimization');
    }

    // Add specific BSGS recommendations
    if (content.includes('bsgs') || content.includes('baby') || content.includes('giant')) {
      if (classification === 'memory_bound') {
        recommendations.push('BSGS: Use shared memory for baby steps table');
        recommendations.push('BSGS: Implement collision detection in shared memory');
      }
    }

    return {
      ratio: Math.round(ratio * 100) / 100,
      classification,
      recommendations,
    };
  }

  private detectUncoalescedAccess(line: string): boolean {
    // Simplified detection of potentially uncoalesced access
    return line.includes('[') && (line.includes('*') || line.includes('+'));
  }
}
