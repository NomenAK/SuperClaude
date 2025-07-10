#!/usr/bin/env node

/**
 * Test script for enhanced C++/CUDA analysis functionality
 * 
 * This script tests the new C++ analysis tools to ensure they work correctly
 * with the Tree-sitter integration and CUDA analysis capabilities.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configurations
const tests = [
  {
    name: 'Enhanced C++ Analysis',
    tool: 'analyze_cpp_enhanced',
    args: {
      path: './examples/cuda_bsgs_example.cu',
      cppStandard: 'cpp17',
      performanceAnalysis: true,
      memoryAnalysis: true,
      securityAnalysis: true,
      cudaAnalysis: true
    }
  },
  {
    name: 'CUDA Analysis',
    tool: 'analyze_cuda',
    args: {
      path: './examples/cuda_bsgs_example.cu',
      computeCapability: '8.0',
      analyzeBsgs: true,
      analyzePerformance: true,
      occupancyThreshold: 75
    }
  },
  {
    name: 'Basic C++ Analysis (Legacy)',
    tool: 'analyze_cpp',
    args: {
      path: './examples/cuda_bsgs_example.cu',
      cppStandard: 'cpp17',
      performanceAnalysis: true
    }
  }
];

/**
 * Run a single test
 */
async function runTest(test) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`📋 Tool: ${test.tool}`);
  console.log(`⚙️  Args:`, JSON.stringify(test.args, null, 2));
  
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${test.name} completed successfully`);
        if (stdout) {
          console.log('📤 Output:', stdout.substring(0, 200) + '...');
        }
        resolve({ success: true, stdout, stderr });
      } else {
        console.log(`❌ ${test.name} failed with code ${code}`);
        if (stderr) {
          console.log('🚨 Error:', stderr);
        }
        resolve({ success: false, stdout, stderr, code });
      }
    });
    
    child.on('error', (error) => {
      console.log(`💥 ${test.name} crashed:`, error.message);
      reject(error);
    });
    
    // Send MCP request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: test.tool,
        arguments: test.args
      }
    };
    
    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();
    
    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      resolve({ success: false, timeout: true });
    }, 30000);
  });
}

/**
 * Check if dependencies are installed
 */
function checkDependencies() {
  console.log('🔍 Checking dependencies...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['tree-sitter', 'tree-sitter-cpp'];
  
  const missing = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missing.length > 0) {
    console.log('❌ Missing dependencies:', missing.join(', '));
    console.log('💡 Run: npm install');
    return false;
  }
  
  console.log('✅ All dependencies present');
  return true;
}

/**
 * Check if project is built
 */
function checkBuild() {
  console.log('🔍 Checking build...');
  
  if (!fs.existsSync('dist/index.js')) {
    console.log('❌ Project not built');
    console.log('💡 Run: npm run build');
    return false;
  }
  
  console.log('✅ Project is built');
  return true;
}

/**
 * Create test file if it doesn't exist
 */
function ensureTestFile() {
  const testFile = './examples/cuda_bsgs_example.cu';
  
  if (!fs.existsSync(testFile)) {
    console.log('⚠️  Test file not found, creating minimal example...');
    
    const minimalCuda = `
#include <cuda_runtime.h>

__global__ void baby_step_kernel(int* data, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        data[idx] = idx * idx; // Simple baby step computation
    }
}

__global__ void giant_step_kernel(int* data, int n, int step_size) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        data[idx] += step_size; // Giant step computation
    }
}

int main() {
    const int N = 1024;
    int* d_data;
    
    cudaMalloc(&d_data, N * sizeof(int));
    
    // Launch baby steps
    baby_step_kernel<<<(N+255)/256, 256>>>(d_data, N);
    
    // Launch giant steps
    giant_step_kernel<<<(N+255)/256, 256>>>(d_data, N, 100);
    
    cudaFree(d_data);
    return 0;
}
`;
    
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, minimalCuda);
    console.log('✅ Created test file:', testFile);
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 SuperAugment C++/CUDA Analysis Test Suite');
  console.log('='.repeat(50));
  
  // Pre-flight checks
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  if (!checkBuild()) {
    process.exit(1);
  }
  
  ensureTestFile();
  
  // Run tests
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await runTest(test);
      results.push({ ...test, ...result });
    } catch (error) {
      console.log(`💥 Test ${test.name} crashed:`, error.message);
      results.push({ ...test, success: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n📈 Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n💡 Troubleshooting:');
    console.log('1. Ensure all dependencies are installed: npm install');
    console.log('2. Build the project: npm run build');
    console.log('3. Check that Tree-sitter compiled correctly');
    console.log('4. Verify CUDA example file exists');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Enhanced C++/CUDA analysis is working correctly.');
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

// Run the tests
main().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
