/**
 * CUDA Analysis Tool
 * 
 * Specialized tool for analyzing CUDA C/C++ code including kernels,
 * memory management, performance optimization, and BSGS algorithm analysis.
 */

import { z } from 'zod';
import { extname } from 'path';
import { BaseTool, type ToolExecutionContext, type ToolExecutionResult } from '../BaseTool.js';
import { ConfigManager } from '../../config/ConfigManager.js';
import { FileSystemManager } from '../../utils/FileSystemManager.js';
import { CudaAnalyzer, type CudaAnalysisResult } from '../../analyzers/CudaAnalyzer.js';
import {
  AnalysisError,
  ErrorCode,
} from '../../errors/ErrorTypes.js';
import { logger } from '../../utils/logger.js';

/**
 * CUDA analysis options schema
 */
const CudaAnalysisSchema = z.object({
  path: z.string().describe('Path to CUDA file or directory to analyze'),
  
  // Analysis options
  analyzeKernels: z.boolean().default(true).describe('Analyze CUDA kernels'),
  analyzeMemory: z.boolean().default(true).describe('Analyze memory operations'),
  analyzePerformance: z.boolean().default(true).describe('Analyze performance characteristics'),
  analyzeBsgs: z.boolean().default(true).describe('Analyze BSGS algorithm patterns'),
  
  // CUDA-specific options
  computeCapability: z.string().default('7.5').describe('Target compute capability (e.g., 7.5, 8.0, 8.6)'),
  maxRegisters: z.number().default(255).describe('Maximum registers per thread'),
  sharedMemorySize: z.number().default(49152).describe('Shared memory size per block (bytes)'),
  
  // Performance thresholds
  occupancyThreshold: z.number().min(0).max(100).default(75).describe('Minimum occupancy threshold (%)'),
  coalescingThreshold: z.number().min(0).max(100).default(80).describe('Memory coalescing threshold (%)'),
  
  // Output options
  includeOptimizations: z.boolean().default(true).describe('Include optimization recommendations'),
  verboseOutput: z.boolean().default(false).describe('Include verbose analysis details'),
  
  // File filters
  includeHeaders: z.boolean().default(true).describe('Include .cuh header files'),
  excludePatterns: z.array(z.string()).default([]).describe('File patterns to exclude'),
});

type CudaAnalysisOptions = z.infer<typeof CudaAnalysisSchema>;

/**
 * CUDA analysis report interface
 */
interface CudaAnalysisReport {
  summary: {
    filesAnalyzed: number;
    totalKernels: number;
    totalDeviceFunctions: number;
    memoryOperations: number;
    overallScore: number;
    grade: string;
  };
  
  kernels: {
    count: number;
    averageComplexity: number;
    averageOccupancy: number;
    bsgsKernels: number;
  };
  
  memory: {
    operations: number;
    asyncOperations: number;
    coalescingScore: number;
    issues: number;
  };
  
  performance: {
    occupancyScore: number;
    memoryBandwidthScore: number;
    computeIntensityScore: number;
    bottlenecks: string[];
  };
  
  bsgs?: {
    detected: boolean;
    algorithm: string;
    optimizationScore: number;
    recommendations: string[];
  };
  
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  
  optimizations: {
    memory: number;
    compute: number;
    occupancy: number;
    synchronization: number;
  };
}

/**
 * CUDA Analysis Tool
 */
export class CudaAnalysisTool extends BaseTool {
  public readonly name = 'analyze_cuda';
  public readonly description = 'Comprehensive CUDA C/C++ code analysis including kernels, memory, performance, and BSGS algorithm optimization';
  public readonly inputSchema = CudaAnalysisSchema;

  private fileSystemManager: FileSystemManager;
  private cudaAnalyzer: CudaAnalyzer;

  constructor(configManager: ConfigManager) {
    super(configManager);
    this.fileSystemManager = new FileSystemManager();
    this.cudaAnalyzer = new CudaAnalyzer();
  }

  /**
   * Execute CUDA analysis
   */
  protected async executeInternal(
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    try {
      logger.info('Starting CUDA analysis', { args, context: context.requestId });

      // Validate and parse arguments
      const validatedArgs = CudaAnalysisSchema.parse(args) as CudaAnalysisOptions;
      
      // Find CUDA files to analyze
      const cudaFiles = await this.findCudaFiles(validatedArgs.path, validatedArgs.excludePatterns, validatedArgs.includeHeaders);
      
      if (cudaFiles.length === 0) {
        return this.createResponse(
          '⚠️ No CUDA files found to analyze.\n\nPlease check the path and ensure it contains .cu, .cuh, or CUDA C++ files.',
          [],
          { filesFound: 0, analysisSkipped: true }
        );
      }

      // Perform analysis on each file
      const analysisResults: CudaAnalysisResult[] = [];

      for (const file of cudaFiles) {
        try {
          logger.debug(`Analyzing CUDA file: ${file}`);
          const result = await this.cudaAnalyzer.analyzeFile(file);
          analysisResults.push(result);
        } catch (error) {
          logger.warn(`Failed to analyze CUDA file ${file}`, { error });
          // Continue with other files
        }
      }

      // Generate comprehensive report
      const report = this.generateCudaReport(analysisResults, validatedArgs);
      
      // Format response
      const responseText = validatedArgs.verboseOutput 
        ? this.formatVerboseResponse(report, analysisResults, validatedArgs)
        : this.formatStandardResponse(report, validatedArgs);

      return this.createResponse(
        responseText,
        [],
        {
          filesAnalyzed: analysisResults.length,
          overallScore: report.summary.overallScore,
          grade: report.summary.grade,
          analysisTime: Date.now() - context.startTime.getTime(),
        }
      );

    } catch (error) {
      if (error instanceof AnalysisError) {
        return this.createErrorResponse(error, true);
      }
      
      throw new AnalysisError(
        `CUDA analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.ANALYSIS_FAILED,
        { additionalInfo: { args, context: context.requestId } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Find CUDA files to analyze
   */
  private async findCudaFiles(path: string, excludePatterns: string[], includeHeaders: boolean): Promise<string[]> {
    const cudaExtensions = ['.cu'];
    if (includeHeaders) {
      cudaExtensions.push('.cuh');
    }
    
    // Also include C++ files that might contain CUDA code
    cudaExtensions.push('.cpp', '.cxx', '.cc', '.h', '.hpp', '.hxx');
    
    try {
      const exists = await this.fileSystemManager.fileExists(path);

      if (!exists) {
        return [];
      }

      // Check if it's a file
      try {
        const stats = await this.fileSystemManager.getFileStats(path);
        if (stats && cudaExtensions.includes(extname(path).toLowerCase())) {
          return [path];
        }
      } catch {
        // Might be a directory, continue to directory handling
      }

      // Try to handle as directory
      try {
        const patterns = cudaExtensions.map(ext => `**/*${ext}`);
        const files = await this.fileSystemManager.readFiles(patterns, path);

        const candidateFiles = files
          .filter(file => !this.shouldExcludeFile(file.path, excludePatterns))
          .map(file => file.path);

        // Filter to only files that actually contain CUDA code
        const cudaFiles: string[] = [];
        for (const file of candidateFiles) {
          if (await this.containsCudaCode(file)) {
            cudaFiles.push(file);
          }
        }

        return cudaFiles;
      } catch (error) {
        logger.error(`Failed to read directory ${path}`, { error });
        return [];
      }
    } catch (error) {
      logger.error(`Failed to find CUDA files in ${path}`, { error });
      return [];
    }
  }

  /**
   * Check if file contains CUDA code
   */
  private async containsCudaCode(filePath: string): Promise<boolean> {
    try {
      const content = await this.fileSystemManager.readFileContent(filePath);
      const cudaKeywords = [
        '__global__', '__device__', '__host__', '__shared__',
        'cudaMalloc', 'cudaFree', 'cudaMemcpy', 'cudaLaunchKernel',
        'blockIdx', 'threadIdx', 'blockDim', 'gridDim',
        '<<<', '>>>', '__syncthreads'
      ];
      
      return cudaKeywords.some(keyword => content.includes(keyword));
    } catch (error) {
      logger.warn(`Failed to read file ${filePath}`, { error });
      return false;
    }
  }

  /**
   * Check if file should be excluded
   */
  private shouldExcludeFile(filePath: string, excludePatterns: string[]): boolean {
    return excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    });
  }

  /**
   * Generate comprehensive CUDA report
   */
  private generateCudaReport(
    results: CudaAnalysisResult[],
    _options: CudaAnalysisOptions
  ): CudaAnalysisReport {
    if (results.length === 0) {
      return this.createEmptyReport();
    }

    // Aggregate metrics
    const totalKernels = results.reduce((sum, r) => sum + r.summary.totalKernels, 0);
    const totalDeviceFunctions = results.reduce((sum, r) => sum + r.summary.totalDeviceFunctions, 0);
    const totalMemoryOps = results.reduce((sum, r) => sum + r.summary.memoryTransfers, 0);
    
    // Calculate averages
    const avgOccupancy = results.reduce((sum, r) => sum + r.performance.occupancy.achieved, 0) / results.length;
    const avgMemoryBandwidth = results.reduce((sum, r) => sum + r.performance.memoryBandwidth.utilization, 0) / results.length;
    const avgComputeIntensity = results.reduce((sum, r) => sum + r.performance.computeIntensity.ratio, 0) / results.length;
    
    // Count BSGS kernels
    const bsgsKernels = results.reduce((sum, r) => sum + r.kernels.filter(k => k.isBsgsKernel).length, 0);
    const hasBsgs = results.some(r => r.bsgs?.isImplemented);
    
    // Count issues by severity
    const issues = {
      critical: results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 0),
      high: results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'high').length, 0),
      medium: results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'medium').length, 0),
      low: results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'low').length, 0),
    };
    
    // Count optimizations by type
    const optimizations = {
      memory: results.reduce((sum, r) => sum + r.optimizations.filter(o => o.type === 'memory').length, 0),
      compute: results.reduce((sum, r) => sum + r.optimizations.filter(o => o.type === 'compute').length, 0),
      occupancy: results.reduce((sum, r) => sum + r.optimizations.filter(o => o.type === 'occupancy').length, 0),
      synchronization: results.reduce((sum, r) => sum + r.optimizations.filter(o => o.type === 'synchronization').length, 0),
    };
    
    // Calculate overall score
    const occupancyScore = Math.min(100, avgOccupancy);
    const memoryScore = Math.min(100, avgMemoryBandwidth);
    const computeScore = Math.min(100, avgComputeIntensity * 20); // Scale compute intensity
    const issueScore = Math.max(0, 100 - (issues.critical * 20 + issues.high * 10 + issues.medium * 5 + issues.low * 2));
    
    const overallScore = Math.round((occupancyScore + memoryScore + computeScore + issueScore) / 4);
    const grade = this.calculateGrade(overallScore);

    const report: CudaAnalysisReport = {
      summary: {
        filesAnalyzed: results.length,
        totalKernels,
        totalDeviceFunctions,
        memoryOperations: totalMemoryOps,
        overallScore,
        grade,
      },
      kernels: {
        count: totalKernels,
        averageComplexity: results.reduce((sum, r) => sum + r.kernels.reduce((s, k) => s + k.complexity, 0), 0) / Math.max(1, totalKernels),
        averageOccupancy: avgOccupancy,
        bsgsKernels,
      },
      memory: {
        operations: totalMemoryOps,
        asyncOperations: results.reduce((sum, r) => sum + r.memoryOperations.filter(op => op.isAsync).length, 0),
        coalescingScore: results.reduce((sum, r) => sum + r.kernels.reduce((s, k) => s + k.memoryCoalescing.score, 0), 0) / Math.max(1, totalKernels),
        issues: results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'uncoalesced_access').length, 0),
      },
      performance: {
        occupancyScore: Math.round(avgOccupancy),
        memoryBandwidthScore: Math.round(avgMemoryBandwidth),
        computeIntensityScore: Math.round(avgComputeIntensity * 20),
        bottlenecks: this.aggregateBottlenecks(results),
      },
      issues,
      optimizations,
    };

    // Add BSGS analysis if detected
    if (hasBsgs) {
      const bsgsResults = results.filter(r => r.bsgs?.isImplemented);
      report.bsgs = {
        detected: true,
        algorithm: bsgsResults[0]?.bsgs?.algorithm || 'unknown',
        optimizationScore: Math.round(bsgsResults.reduce((sum, r) => sum + (r.bsgs?.performance.memoryEfficiency || 0), 0) / bsgsResults.length),
        recommendations: this.aggregateBsgsRecommendations(bsgsResults),
      };
    }

    return report;
  }

  /**
   * Calculate grade based on overall score
   */
  private calculateGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    return 'F';
  }

  /**
   * Create empty report
   */
  private createEmptyReport(): CudaAnalysisReport {
    return {
      summary: { filesAnalyzed: 0, totalKernels: 0, totalDeviceFunctions: 0, memoryOperations: 0, overallScore: 0, grade: 'N/A' },
      kernels: { count: 0, averageComplexity: 0, averageOccupancy: 0, bsgsKernels: 0 },
      memory: { operations: 0, asyncOperations: 0, coalescingScore: 0, issues: 0 },
      performance: { occupancyScore: 0, memoryBandwidthScore: 0, computeIntensityScore: 0, bottlenecks: [] },
      issues: { critical: 0, high: 0, medium: 0, low: 0 },
      optimizations: { memory: 0, compute: 0, occupancy: 0, synchronization: 0 },
    };
  }

  /**
   * Aggregate performance bottlenecks
   */
  private aggregateBottlenecks(results: CudaAnalysisResult[]): string[] {
    const bottlenecks = new Set<string>();
    results.forEach(r => {
      r.performance.memoryBandwidth.bottlenecks.forEach(b => bottlenecks.add(b));
      if (r.bsgs?.performance.bottlenecks) {
        r.bsgs.performance.bottlenecks.forEach(b => bottlenecks.add(b));
      }
    });
    return Array.from(bottlenecks);
  }

  /**
   * Aggregate BSGS recommendations
   */
  private aggregateBsgsRecommendations(_results: CudaAnalysisResult[]): string[] {
    const recommendations = new Set<string>();
    _results.forEach((r: CudaAnalysisResult) => {
      if (r.bsgs?.optimizations) {
        r.bsgs.optimizations.forEach((opt: any) => recommendations.add(opt.description));
      }
    });
    return Array.from(recommendations);
  }

  /**
   * Format standard response
   */
  private formatStandardResponse(report: CudaAnalysisReport, options: CudaAnalysisOptions): string {
    let response = `# 🚀 CUDA Analysis Report

## 📊 Summary
- **Files Analyzed**: ${report.summary.filesAnalyzed}
- **CUDA Kernels**: ${report.summary.totalKernels}
- **Device Functions**: ${report.summary.totalDeviceFunctions}
- **Memory Operations**: ${report.summary.memoryOperations}
- **Overall Score**: ${report.summary.overallScore}/100 (Grade: ${report.summary.grade})
- **Compute Capability**: ${options.computeCapability}

## 🔧 Kernel Analysis
- **Total Kernels**: ${report.kernels.count}
- **Average Complexity**: ${report.kernels.averageComplexity.toFixed(1)}
- **Average Occupancy**: ${report.kernels.averageOccupancy.toFixed(1)}%
- **BSGS Kernels**: ${report.kernels.bsgsKernels}

## 💾 Memory Analysis
- **Memory Operations**: ${report.memory.operations}
- **Async Operations**: ${report.memory.asyncOperations}
- **Coalescing Score**: ${report.memory.coalescingScore.toFixed(1)}/100
- **Memory Issues**: ${report.memory.issues}

## ⚡ Performance Metrics
- **Occupancy Score**: ${report.performance.occupancyScore}/100
- **Memory Bandwidth**: ${report.performance.memoryBandwidthScore}/100
- **Compute Intensity**: ${report.performance.computeIntensityScore}/100

${report.performance.bottlenecks.length > 0 ? `
### 🚧 Performance Bottlenecks
${report.performance.bottlenecks.map(b => `- ${b}`).join('\n')}
` : ''}

## 🐛 Issues Found
- **Critical**: ${report.issues.critical}
- **High**: ${report.issues.high}
- **Medium**: ${report.issues.medium}
- **Low**: ${report.issues.low}

## 🔧 Optimization Opportunities
- **Memory**: ${report.optimizations.memory}
- **Compute**: ${report.optimizations.compute}
- **Occupancy**: ${report.optimizations.occupancy}
- **Synchronization**: ${report.optimizations.synchronization}`;

    // Add BSGS analysis if detected
    if (report.bsgs?.detected) {
      response += `

## 🧮 BSGS Algorithm Analysis
- **Algorithm Detected**: ${report.bsgs.algorithm}
- **Optimization Score**: ${report.bsgs.optimizationScore}/100
- **BSGS Kernels Found**: ${report.kernels.bsgsKernels}

### 💡 BSGS Optimization Recommendations
${report.bsgs.recommendations.map(rec => `- ${rec}`).join('\n')}`;
    }

    response += `

---
*Analysis completed using CUDA Analyzer with specialized BSGS pattern detection*`;

    return response;
  }

  /**
   * Format verbose response (placeholder)
   */
  private formatVerboseResponse(
    report: CudaAnalysisReport,
    _results: CudaAnalysisResult[],
    options: CudaAnalysisOptions
  ): string {
    return this.formatStandardResponse(report, options) + '\n\n*Verbose output not yet implemented*';
  }
}
