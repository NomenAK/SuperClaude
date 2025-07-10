/**
 * CppAnalyzer Unit Tests
 * 
 * Comprehensive tests for the CppAnalyzer class to ensure robust
 * C++ code analysis functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CppAnalyzer } from '../CppAnalyzer.js';
import { FileSystemManager } from '../../utils/FileSystemManager.js';
import { AnalysisError } from '../../errors/ErrorTypes.js';
import { 
  TestEnvironment, 
  TestDataGenerator, 
  MockFactory,
  TestAssertions,
  PerformanceTestUtils 
} from '../../test-utils/TestHelpers.js';

describe('CppAnalyzer', () => {
  let analyzer: CppAnalyzer;
  let mockFileSystemManager: jest.Mocked<FileSystemManager>;

  beforeEach(() => {
    TestEnvironment.setup();
    mockFileSystemManager = MockFactory.createMockFileSystemManager({
      'test.cpp': TestDataGenerator.createSampleCppCode(),
      'simple.cpp': `
#include <iostream>
int main() {
    std::cout << "Hello World" << std::endl;
    return 0;
}
      `.trim(),
      'complex.cpp': `
#include <vector>
#include <string>
#include <memory>

class DataProcessor {
private:
    std::vector<std::string> data;
    std::unique_ptr<int> counter;

public:
    DataProcessor() : counter(std::make_unique<int>(0)) {}
    
    void addData(const std::string& item) {
        data.push_back(item);
        (*counter)++;
    }
    
    size_t getCount() const {
        return data.size();
    }
};

int main() {
    DataProcessor processor;
    processor.addData("test");
    return 0;
}
      `.trim(),
      'unsafe.cpp': `
#include <cstring>
#include <cstdio>

int main() {
    char buffer[100];
    char* ptr = new int[1000];
    strcpy(buffer, "unsafe");
    gets(buffer);
    printf(buffer);
    return 0;
}
      `.trim(),
    });
    
    analyzer = new CppAnalyzer(mockFileSystemManager);
  });

  afterEach(() => {
    TestEnvironment.teardown();
  });

  describe('Syntax Analysis', () => {
    it('should analyze basic C++ syntax correctly', async () => {
      const result = await analyzer.analyzeSyntax('simple.cpp', 'cpp17');

      expect(result).toBeDefined();
      expect(result.lineCount.total).toBeGreaterThan(0);
      expect(result.lineCount.code).toBeGreaterThan(0);
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('main');
      expect(result.includes).toHaveLength(1);
      expect(result.includes[0].file).toBe('iostream');
    });

    it('should extract functions correctly', async () => {
      const result = await analyzer.analyzeSyntax('test.cpp', 'cpp17');

      const functions = result.functions;
      expect(functions.length).toBeGreaterThan(0);
      
      const addFunction = functions.find(f => f.name === 'add');
      expect(addFunction).toBeDefined();
      expect(addFunction?.returnType).toBe('double');
      expect(addFunction?.isStatic).toBe(false);
      expect(addFunction?.isVirtual).toBe(false);
    });

    it('should extract classes correctly', async () => {
      const result = await analyzer.analyzeSyntax('test.cpp', 'cpp17');

      const classes = result.classes;
      expect(classes.length).toBeGreaterThan(0);
      
      const calculatorClass = classes.find(c => c.name === 'Calculator');
      expect(calculatorClass).toBeDefined();
      expect(calculatorClass?.type).toBe('class');
      expect(calculatorClass?.accessLevel).toBe('private');
    });

    it('should extract includes correctly', async () => {
      const result = await analyzer.analyzeSyntax('test.cpp', 'cpp17');

      const includes = result.includes;
      expect(includes.length).toBeGreaterThan(0);
      
      const iostreamInclude = includes.find(i => i.file === 'iostream');
      expect(iostreamInclude).toBeDefined();
      expect(iostreamInclude?.type).toBe('system');
    });

    it('should count lines correctly', async () => {
      const result = await analyzer.analyzeSyntax('simple.cpp', 'cpp17');

      expect(result.lineCount.total).toBeGreaterThan(0);
      expect(result.lineCount.code).toBeGreaterThan(0);
      expect(result.lineCount.blank).toBeGreaterThanOrEqual(0);
      expect(result.lineCount.comments).toBeGreaterThanOrEqual(0);
      
      // Total should equal sum of parts
      const sum = result.lineCount.code + result.lineCount.blank + result.lineCount.comments;
      expect(result.lineCount.total).toBe(sum);
    });

    it('should handle syntax analysis errors gracefully', async () => {
      mockFileSystemManager.readFileContent.mockRejectedValueOnce(new Error('File not found'));

      await TestAssertions.assertRejects(
        analyzer.analyzeSyntax('nonexistent.cpp', 'cpp17'),
        AnalysisError
      );
    });
  });

  describe('Dependency Analysis', () => {
    it('should analyze dependencies correctly', async () => {
      const result = await analyzer.analyzeDependencies('test.cpp', 3);

      expect(result).toBeDefined();
      expect(result.includes).toHaveLength(3); // iostream, vector, string
      expect(result.missingIncludes).toHaveLength(0); // All system includes should be found
    });

    it('should detect missing local includes', async () => {
      mockFileSystemManager.fileExists.mockResolvedValue(false);
      
      const result = await analyzer.analyzeDependencies('test.cpp', 3);

      // Local includes should be marked as missing
      const localIncludes = result.includes.filter(inc => inc.type === 'local');
      expect(result.missingIncludes.length).toBe(localIncludes.length);
    });

    it('should handle dependency analysis errors', async () => {
      mockFileSystemManager.readFileContent.mockRejectedValueOnce(new Error('Read error'));

      await TestAssertions.assertRejects(
        analyzer.analyzeDependencies('error.cpp', 3),
        AnalysisError
      );
    });
  });

  describe('Modern C++ Features Analysis', () => {
    it('should detect modern C++ features', async () => {
      const files = ['complex.cpp'];
      const result = await analyzer.analyzeModernCppFeatures(files, 'cpp17');

      expect(result).toBeDefined();
      expect(result.features).toHaveLength(6); // Basic C++11 features
      
      const smartPointersFeature = result.features.find(f => f.name === 'smart pointers');
      expect(smartPointersFeature).toBeDefined();
      expect(smartPointersFeature?.used).toBe(true);
    });

    it('should provide recommendations for unused features', async () => {
      const files = ['simple.cpp'];
      const result = await analyzer.analyzeModernCppFeatures(files, 'cpp17');

      expect(result.improvements.length).toBeGreaterThan(0);
      expect(result.improvements).toContain('Use auto for type deduction to improve code readability');
    });

    it('should handle different C++ standards', async () => {
      const files = ['complex.cpp'];
      
      const cpp11Result = await analyzer.analyzeModernCppFeatures(files, 'cpp11');
      const cpp20Result = await analyzer.analyzeModernCppFeatures(files, 'cpp20');

      expect(cpp20Result.features.length).toBeGreaterThan(cpp11Result.features.length);
    });

    it('should handle file read errors gracefully', async () => {
      mockFileSystemManager.readFileContent.mockRejectedValueOnce(new Error('Read error'));
      
      const files = ['error.cpp', 'simple.cpp'];
      const result = await analyzer.analyzeModernCppFeatures(files, 'cpp17');

      // Should continue with other files despite error
      expect(result).toBeDefined();
      expect(result.features).toBeDefined();
    });
  });

  describe('Performance Analysis', () => {
    it('should detect performance issues', async () => {
      const performanceIssueCode = `
std::string result = str1 + str2 + str3;
std::vector<int> vec;
for (int i = 0; i < vec.size(); i++) {
    // inefficient loop
}
      `.trim();

      mockFileSystemManager.readFileContent.mockResolvedValueOnce(performanceIssueCode);
      
      const result = await analyzer.analyzePerformance('perf.cpp');

      expect(result.hotspots.length).toBeGreaterThan(0);
      
      const stringConcatIssue = result.hotspots.find(h => h.issue.includes('string concatenation'));
      expect(stringConcatIssue).toBeDefined();
      
      const loopIssue = result.hotspots.find(h => h.issue.includes('loop condition'));
      expect(loopIssue).toBeDefined();
    });

    it('should provide optimization suggestions', async () => {
      const vectorCode = `
#include <vector>
#include <map>
std::vector<int> vec;
std::map<int, std::string> myMap;
      `.trim();

      mockFileSystemManager.readFileContent.mockResolvedValueOnce(vectorCode);
      
      const result = await analyzer.analyzePerformance('opt.cpp');

      expect(result.optimizations).toContain('Consider using std::vector::reserve() when the size is known in advance');
      expect(result.optimizations).toContain('Consider using std::unordered_map for better average performance');
    });

    it('should handle performance analysis errors', async () => {
      mockFileSystemManager.readFileContent.mockRejectedValueOnce(new Error('Read error'));

      await TestAssertions.assertRejects(
        analyzer.analyzePerformance('error.cpp'),
        AnalysisError
      );
    });
  });

  describe('Memory Analysis', () => {
    it('should detect memory issues', async () => {
      const result = await analyzer.analyzeMemory('unsafe.cpp');

      expect(result.issues.length).toBeGreaterThan(0);
      
      const rawPointerIssue = result.issues.find(i => i.type === 'raw_pointer');
      expect(rawPointerIssue).toBeDefined();
      
      const memoryLeakIssue = result.issues.find(i => i.type === 'memory_leak');
      expect(memoryLeakIssue).toBeDefined();
    });

    it('should provide memory management recommendations', async () => {
      const result = await analyzer.analyzeMemory('unsafe.cpp');

      expect(result.recommendations).toContain('Consider using RAII (Resource Acquisition Is Initialization) pattern');
      expect(result.recommendations).toContain('Use smart pointers to automatically manage memory');
    });

    it('should handle C-style memory management', async () => {
      const cStyleCode = `
#include <cstdlib>
void* ptr = malloc(100);
free(ptr);
      `.trim();

      mockFileSystemManager.readFileContent.mockResolvedValueOnce(cStyleCode);
      
      const result = await analyzer.analyzeMemory('c_style.cpp');

      expect(result.recommendations).toContain('Prefer C++ memory management (new/delete) over C-style malloc/free');
    });
  });

  describe('Security Analysis', () => {
    it('should detect security vulnerabilities', async () => {
      const result = await analyzer.analyzeSecurity('unsafe.cpp');

      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      
      const strcpyVuln = result.vulnerabilities.find(v => v.description.includes('strcpy'));
      expect(strcpyVuln).toBeDefined();
      expect(strcpyVuln?.severity).toBe('high');
      
      const getsVuln = result.vulnerabilities.find(v => v.description.includes('gets'));
      expect(getsVuln).toBeDefined();
      expect(getsVuln?.severity).toBe('critical');
      
      const printfVuln = result.vulnerabilities.find(v => v.type === 'format_string');
      expect(printfVuln).toBeDefined();
    });

    it('should provide security recommendations', async () => {
      const result = await analyzer.analyzeSecurity('unsafe.cpp');

      expect(result.recommendations).toContain('Review and replace unsafe C functions with secure alternatives');
      expect(result.recommendations).toContain('Use static analysis tools for comprehensive security scanning');
    });

    it('should handle secure code without issues', async () => {
      const result = await analyzer.analyzeSecurity('complex.cpp');

      // Modern C++ code should have fewer security issues
      const criticalVulns = result.vulnerabilities.filter(v => v.severity === 'critical');
      expect(criticalVulns).toHaveLength(0);
    });
  });

  describe('Code Metrics', () => {
    it('should calculate code metrics correctly', async () => {
      const result = await analyzer.calculateMetrics('test.cpp');

      expect(result).toBeDefined();
      expect(result.cyclomatic).toBeGreaterThan(0);
      expect(result.cognitive).toBeGreaterThan(0);
      expect(result.halstead.volume).toBeGreaterThan(0);
      expect(result.halstead.difficulty).toBeGreaterThan(0);
      expect(result.halstead.effort).toBeGreaterThan(0);
    });

    it('should handle simple code with basic metrics', async () => {
      const result = await analyzer.calculateMetrics('simple.cpp');

      // Simple code should have low complexity
      expect(result.cyclomatic).toBeLessThan(5);
      expect(result.cognitive).toBeLessThan(10);
    });

    it('should handle metrics calculation errors', async () => {
      mockFileSystemManager.readFileContent.mockRejectedValueOnce(new Error('Read error'));

      await TestAssertions.assertRejects(
        analyzer.calculateMetrics('error.cpp'),
        AnalysisError
      );
    });
  });

  describe('Performance Tests', () => {
    it('should analyze syntax within reasonable time', async () => {
      await PerformanceTestUtils.assertExecutionTime(
        () => analyzer.analyzeSyntax('test.cpp', 'cpp17'),
        1000 // 1 second max
      );
    });

    it('should handle large files efficiently', async () => {
      // Create a large C++ file content
      const largeContent = Array(1000).fill(TestDataGenerator.createSampleCppCode()).join('\n');
      mockFileSystemManager.readFileContent.mockResolvedValueOnce(largeContent);

      const { duration } = await PerformanceTestUtils.measureExecutionTime(
        () => analyzer.analyzeSyntax('large.cpp', 'cpp17')
      );

      // Should complete within reasonable time even for large files
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });

  describe('Integration Tests', () => {
    it('should perform complete analysis workflow', async () => {
      const filePath = 'test.cpp';
      const cppStandard = 'cpp17';

      // Run all analysis types
      const syntaxResult = await analyzer.analyzeSyntax(filePath, cppStandard);
      const dependencyResult = await analyzer.analyzeDependencies(filePath, 3);
      const performanceResult = await analyzer.analyzePerformance(filePath);
      const memoryResult = await analyzer.analyzeMemory(filePath);
      const securityResult = await analyzer.analyzeSecurity(filePath);
      const metricsResult = await analyzer.calculateMetrics(filePath);

      // Verify all results are valid
      expect(syntaxResult).toBeDefined();
      expect(dependencyResult).toBeDefined();
      expect(performanceResult).toBeDefined();
      expect(memoryResult).toBeDefined();
      expect(securityResult).toBeDefined();
      expect(metricsResult).toBeDefined();

      // Verify consistency
      expect(syntaxResult.includes.length).toBe(dependencyResult.includes.length);
    });

    it('should handle multiple files analysis', async () => {
      const files = ['test.cpp', 'simple.cpp', 'complex.cpp'];
      const result = await analyzer.analyzeModernCppFeatures(files, 'cpp17');

      expect(result).toBeDefined();
      expect(result.features).toBeDefined();
      expect(result.improvements).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files', async () => {
      mockFileSystemManager.readFileContent.mockResolvedValueOnce('');
      
      const result = await analyzer.analyzeSyntax('empty.cpp', 'cpp17');

      expect(result.lineCount.total).toBe(1); // Empty string splits to one empty line
      expect(result.functions).toHaveLength(0);
      expect(result.classes).toHaveLength(0);
      expect(result.includes).toHaveLength(0);
    });

    it('should handle files with only comments', async () => {
      const commentOnlyCode = `
// This is a comment
/* This is a block comment */
// Another comment
      `.trim();

      mockFileSystemManager.readFileContent.mockResolvedValueOnce(commentOnlyCode);
      
      const result = await analyzer.analyzeSyntax('comments.cpp', 'cpp17');

      expect(result.lineCount.comments).toBeGreaterThan(0);
      expect(result.lineCount.code).toBe(0);
    });

    it('should handle malformed C++ code gracefully', async () => {
      const malformedCode = `
class Incomplete {
  // Missing closing brace
int main( {
  return 0
// Missing semicolon and closing brace
      `.trim();

      mockFileSystemManager.readFileContent.mockResolvedValueOnce(malformedCode);
      
      // Should not throw, but may have incomplete analysis
      const result = await analyzer.analyzeSyntax('malformed.cpp', 'cpp17');
      expect(result).toBeDefined();
    });
  });
});
