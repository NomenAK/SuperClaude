import { readFile, readdir, stat, access, writeFile, mkdir } from 'fs/promises';
import { join, relative, extname, basename, dirname, normalize } from 'path';
import { glob } from 'glob';
import { logger } from './logger.js';
import { FileCache, type CacheStats } from './FileCache.js';
import {
  FileSystemError,
  ErrorCode,
} from '../errors/ErrorTypes.js';

export interface FileInfo {
  path: string;
  relativePath: string;
  size: number;
  isDirectory: boolean;
  extension: string;
  content?: string;
}

export interface ProjectStructure {
  rootPath: string;
  files: FileInfo[];
  directories: string[];
  packageJson?: any;
  framework?: string | undefined;
  language?: string | undefined;
}

/**
 * Enhanced file system manager with caching, security, and performance optimizations
 */
export class FileSystemManager {
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private fileCache: FileCache;
  private securityEnabled = true;
  private performanceMonitoring = true;
  private allowedExtensions = new Set([
    '.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h',
    '.css', '.scss', '.sass', '.less', '.html', '.xml', '.json', '.yaml', '.yml', '.md',
    '.sql', '.sh', '.bat', '.ps1', '.dockerfile', '.gitignore', '.env'
  ]);

  constructor(options: {
    maxFileSize?: number;
    enableCache?: boolean;
    enableSecurity?: boolean;
    enablePerformanceMonitoring?: boolean;
    cacheOptions?: any;
  } = {}) {
    this.maxFileSize = options.maxFileSize || this.maxFileSize;
    this.securityEnabled = options.enableSecurity ?? true;
    this.performanceMonitoring = options.enablePerformanceMonitoring ?? true;
    
    // Initialize file cache if enabled
    if (options.enableCache !== false) {
      this.fileCache = new FileCache(options.cacheOptions);
      logger.info('File system manager initialized with caching enabled');
    } else {
      // Create a no-op cache for consistency
      this.fileCache = new FileCache({ maxMemoryUsage: 0, maxEntries: 0 });
      logger.info('File system manager initialized without caching');
    }
  }

  /**
   * Enhanced file reading with caching and security checks
   */
  async readFileContent(filePath: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Security check
      if (this.securityEnabled) {
        await this.validateFilePath(filePath);
      }

      // Use cache for file reading
      const content = await this.fileCache.getFile(filePath);
      
      // Performance monitoring
      if (this.performanceMonitoring) {
        const duration = Date.now() - startTime;
        logger.debug(`File read completed: ${filePath}`, {
          duration,
          size: Buffer.byteLength(content, 'utf-8'),
          cached: this.fileCache.has(filePath),
        });
      }

      return content;

    } catch (error) {
      throw new FileSystemError(
        `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filePath,
        ErrorCode.FILE_READ_ERROR,
        { additionalInfo: { duration: Date.now() - startTime } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Secure file writing with directory creation
   */
  async writeFileContent(filePath: string, content: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Security check
      if (this.securityEnabled) {
        await this.validateFilePath(filePath);
      }

      // Ensure directory exists
      const dir = dirname(filePath);
      await mkdir(dir, { recursive: true });

      // Write file
      await writeFile(filePath, content, 'utf-8');

      // Invalidate cache entry if it exists
      this.fileCache.invalidate(filePath);

      // Performance monitoring
      if (this.performanceMonitoring) {
        const duration = Date.now() - startTime;
        logger.debug(`File write completed: ${filePath}`, {
          duration,
          size: Buffer.byteLength(content, 'utf-8'),
        });
      }

    } catch (error) {
      throw new FileSystemError(
        `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filePath,
        ErrorCode.FILE_WRITE_ERROR,
        { additionalInfo: { duration: Date.now() - startTime } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate file path for security
   */
  private async validateFilePath(filePath: string): Promise<void> {
    const normalizedPath = normalize(filePath);
    
    // Check for path traversal attempts
    if (normalizedPath.includes('..')) {
      throw new FileSystemError(
        'Path traversal detected in file path',
        filePath,
        ErrorCode.PERMISSION_DENIED,
        { additionalInfo: { normalizedPath } }
      );
    }

    // Check file extension
    const ext = extname(normalizedPath).toLowerCase();
    if (ext && !this.allowedExtensions.has(ext)) {
      throw new FileSystemError(
        `File extension not allowed: ${ext}`,
        filePath,
        ErrorCode.PERMISSION_DENIED,
        { additionalInfo: { extension: ext, allowedExtensions: Array.from(this.allowedExtensions) } }
      );
    }

    // Check if file exists and get stats
    try {
      const stats = await stat(normalizedPath);
      
      // Check file size
      if (stats.size > this.maxFileSize) {
        throw new FileSystemError(
          `File too large: ${stats.size} bytes (max: ${this.maxFileSize})`,
          filePath,
          ErrorCode.FILE_TOO_LARGE,
          { additionalInfo: { fileSize: stats.size, maxSize: this.maxFileSize } }
        );
      }
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // File doesn't exist, which is okay for write operations
        return;
      }
      throw error;
    }
  }

  /**
   * Read files matching glob patterns
   */
  async readFiles(patterns: string[], rootPath: string = process.cwd()): Promise<FileInfo[]> {
    try {
      logger.info('Reading files with patterns:', { patterns, rootPath });
      
      const files: FileInfo[] = [];
      
      for (const pattern of patterns) {
        const matchedFiles = await glob(pattern, {
          cwd: rootPath,
          ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**', 'coverage/**'],
          absolute: false,
        });

        for (const filePath of matchedFiles) {
          const fullPath = join(rootPath, filePath);
          const fileInfo = await this.getFileInfo(fullPath, rootPath);
          
          if (fileInfo && this.isAllowedFile(fileInfo)) {
            files.push(fileInfo);
          }
        }
      }

      logger.info(`Read ${files.length} files`);
      return files;
    } catch (error) {
      logger.error('Failed to read files:', error);
      throw error;
    }
  }

  /**
   * Read a single file with enhanced caching and error handling
   */
  async readFile(filePath: string, rootPath: string = process.cwd()): Promise<FileInfo | null> {
    try {
      const fullPath = join(rootPath, filePath);
      return await this.getFileInfo(fullPath, rootPath);
    } catch (error) {
      logger.error(`Failed to read file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Analyze project structure
   */
  async analyzeProjectStructure(rootPath: string = process.cwd()): Promise<ProjectStructure> {
    try {
      logger.info('Analyzing project structure:', { rootPath });

      const structure: ProjectStructure = {
        rootPath,
        files: [],
        directories: [],
      };

      // Read package.json if exists
      try {
        const packageJsonPath = join(rootPath, 'package.json');
        await access(packageJsonPath);
        const packageContent = await readFile(packageJsonPath, 'utf-8');
        structure.packageJson = JSON.parse(packageContent);
      } catch {
        // package.json doesn't exist, that's fine
      }

      // Detect framework and language
      structure.framework = await this.detectFramework(rootPath, structure.packageJson);
      structure.language = await this.detectPrimaryLanguage(rootPath);

      // Get project files
      const patterns = ['**/*'];
      structure.files = await this.readFiles(patterns, rootPath);

      // Get directories
      structure.directories = await this.getDirectories(rootPath);

      logger.info('Project structure analyzed:', {
        framework: structure.framework,
        language: structure.language,
        fileCount: structure.files.length,
        dirCount: structure.directories.length,
      });

      return structure;
    } catch (error) {
      logger.error('Failed to analyze project structure:', error);
      throw error;
    }
  }

  /**
   * Get file information
   */
  private async getFileInfo(fullPath: string, rootPath: string): Promise<FileInfo | null> {
    try {
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        return null;
      }

      if (stats.size > this.maxFileSize) {
        logger.warn(`File too large, skipping: ${fullPath} (${stats.size} bytes)`);
        return null;
      }

      const relativePath = relative(rootPath, fullPath);
      const extension = extname(fullPath);

      const fileInfo: FileInfo = {
        path: fullPath,
        relativePath,
        size: stats.size,
        isDirectory: false,
        extension,
      };

      // Read content for text files using enhanced file reading
      if (this.isTextFile(extension)) {
        try {
          fileInfo.content = await this.readFileContent(fullPath);
        } catch (error) {
          logger.warn(`Failed to read file content: ${fullPath}`, error);
        }
      }

      return fileInfo;
    } catch (error) {
      logger.error(`Failed to get file info for ${fullPath}:`, error);
      return null;
    }
  }

  /**
   * Check if file is allowed
   */
  private isAllowedFile(fileInfo: FileInfo): boolean {
    // Skip hidden files and directories
    if (basename(fileInfo.relativePath).startsWith('.') && 
        !fileInfo.relativePath.includes('.env') && 
        !fileInfo.relativePath.includes('.gitignore')) {
      return false;
    }

    // Check extension
    return this.allowedExtensions.has(fileInfo.extension) || fileInfo.extension === '';
  }

  /**
   * Check if file is text file
   */
  private isTextFile(extension: string): boolean {
    const textExtensions = new Set([
      '.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h',
      '.css', '.scss', '.sass', '.less', '.html', '.xml', '.json', '.yaml', '.yml', '.md',
      '.sql', '.sh', '.bat', '.ps1', '.txt', '.env', '.gitignore'
    ]);
    return textExtensions.has(extension) || extension === '';
  }

  /**
   * Detect project framework
   */
  private async detectFramework(rootPath: string, packageJson?: any): Promise<string | undefined> {
    if (packageJson?.dependencies || packageJson?.devDependencies) {
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.react) return 'React';
      if (deps.vue) return 'Vue.js';
      if (deps.angular || deps['@angular/core']) return 'Angular';
      if (deps.next) return 'Next.js';
      if (deps.nuxt) return 'Nuxt.js';
      if (deps.express) return 'Express.js';
      if (deps.fastify) return 'Fastify';
      if (deps.nestjs || deps['@nestjs/core']) return 'NestJS';
    }

    // Check for framework-specific files
    try {
      await access(join(rootPath, 'angular.json'));
      return 'Angular';
    } catch {}

    try {
      await access(join(rootPath, 'nuxt.config.js'));
      return 'Nuxt.js';
    } catch {}

    try {
      await access(join(rootPath, 'next.config.js'));
      return 'Next.js';
    } catch {}

    return undefined;
  }

  /**
   * Detect primary programming language
   */
  private async detectPrimaryLanguage(rootPath: string): Promise<string | undefined> {
    try {
      const files = await glob('**/*.{js,ts,py,java,go,rs,cpp,c}', {
        cwd: rootPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**'],
      });

      const langCounts: Record<string, number> = {};
      
      for (const file of files) {
        const ext = extname(file);
        const lang = this.extensionToLanguage(ext);
        if (lang) {
          langCounts[lang] = (langCounts[lang] || 0) + 1;
        }
      }

      // Return the most common language
      const sortedLangs = Object.entries(langCounts).sort(([,a], [,b]) => b - a);
      return sortedLangs[0]?.[0];
    } catch {
      return undefined;
    }
  }

  /**
   * Map file extension to language
   */
  private extensionToLanguage(ext: string): string | undefined {
    const mapping: Record<string, string> = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'JavaScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.cpp': 'C++',
      '.c': 'C',
    };
    return mapping[ext];
  }

  /**
   * Get directories in project
   */
  private async getDirectories(rootPath: string): Promise<string[]> {
    try {
      const items = await readdir(rootPath, { withFileTypes: true });
      const directories = items
        .filter(item => item.isDirectory())
        .map(item => item.name)
        .filter(name => !name.startsWith('.') && !['node_modules', 'dist', 'build', 'coverage'].includes(name));
      
      return directories;
    } catch {
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.fileCache.getStats();
  }

  /**
   * Clear file cache
   */
  clearCache(): void {
    this.fileCache.clear();
    logger.info('File system cache cleared');
  }

  /**
   * Invalidate specific file in cache
   */
  invalidateFile(filePath: string): boolean {
    return this.fileCache.invalidate(filePath);
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats safely
   */
  async getFileStats(filePath: string): Promise<{ size: number; mtime: Date } | null> {
    try {
      const stats = await stat(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  /**
   * Find files by pattern with caching
   */
  async findFiles(pattern: string, rootPath: string = process.cwd()): Promise<string[]> {
    try {
      const files = await glob(pattern, {
        cwd: rootPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
        absolute: true,
      });
      
      return files.filter(file => {
        const ext = extname(file).toLowerCase();
        return this.allowedExtensions.has(ext) || ext === '';
      });
    } catch (error) {
      throw new FileSystemError(
        `Failed to find files with pattern: ${pattern}`,
        pattern,
        ErrorCode.FILE_READ_ERROR,
        { additionalInfo: { rootPath } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get file content with specific encoding
   */
  async readFileWithEncoding(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    try {
      if (this.securityEnabled) {
        await this.validateFilePath(filePath);
      }

      // For non-UTF8 encodings, bypass cache and read directly
      if (encoding !== 'utf-8') {
        const content = await readFile(filePath, encoding);
        return content;
      }

      // Use cache for UTF-8 files
      return await this.readFileContent(filePath);
    } catch (error) {
      throw new FileSystemError(
        `Failed to read file with encoding ${encoding}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filePath,
        ErrorCode.FILE_READ_ERROR,
        { additionalInfo: { encoding } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Batch read multiple files efficiently
   */
  async readMultipleFiles(filePaths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const errors: string[] = [];

    // Process files in parallel with concurrency limit
    const concurrency = 10;
    for (let i = 0; i < filePaths.length; i += concurrency) {
      const batch = filePaths.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (filePath) => {
        try {
          const content = await this.readFileContent(filePath);
          results.set(filePath, content);
        } catch (error) {
          errors.push(`${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      await Promise.all(batchPromises);
    }

    if (errors.length > 0) {
      logger.warn(`Failed to read ${errors.length} files:`, { errors: errors.slice(0, 5) });
    }

    logger.info(`Successfully read ${results.size}/${filePaths.length} files`);
    return results;
  }

  /**
   * Update file system manager options
   */
  updateOptions(options: {
    maxFileSize?: number;
    enableSecurity?: boolean;
    enablePerformanceMonitoring?: boolean;
  }): void {
    if (options.maxFileSize !== undefined) {
      this.maxFileSize = options.maxFileSize;
    }
    if (options.enableSecurity !== undefined) {
      this.securityEnabled = options.enableSecurity;
    }
    if (options.enablePerformanceMonitoring !== undefined) {
      this.performanceMonitoring = options.enablePerformanceMonitoring;
    }

    logger.info('File system manager options updated', { options });
  }

  /**
   * Get health status of file system manager
   */
  getHealthStatus(): {
    cacheEnabled: boolean;
    securityEnabled: boolean;
    performanceMonitoring: boolean;
    maxFileSize: number;
    cacheStats: CacheStats;
  } {
    return {
      cacheEnabled: this.fileCache.getStats().maxMemoryUsage > 0,
      securityEnabled: this.securityEnabled,
      performanceMonitoring: this.performanceMonitoring,
      maxFileSize: this.maxFileSize,
      cacheStats: this.fileCache.getStats(),
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.fileCache.cleanup();
    logger.info('File system manager cleaned up');
  }
}
