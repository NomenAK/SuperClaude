/**
 * SuperAugment File Cache System
 * 
 * Provides intelligent caching for file operations with LRU eviction,
 * memory management, and performance optimization for large codebases.
 */

import { readFile, stat } from 'fs/promises';
import { createHash } from 'crypto';
import { logger } from './logger.js';
import {
  FileSystemError,
  ErrorCode,
} from '../errors/ErrorTypes.js';

/**
 * Cache entry interface
 */
interface CacheEntry {
  content: string;
  size: number;
  mtime: number;
  accessTime: number;
  accessCount: number;
  hash: string;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  hitRate: number;
  memoryUsage: number;
  maxMemoryUsage: number;
}

/**
 * Cache configuration options
 */
export interface FileCacheOptions {
  maxMemoryUsage: number;    // Maximum memory usage in bytes
  maxEntries: number;        // Maximum number of cached entries
  maxFileSize: number;       // Maximum individual file size to cache
  ttlMs: number;            // Time to live in milliseconds
  enableCompression: boolean; // Enable content compression
  enableIntegrityCheck: boolean; // Enable content integrity checking
}

/**
 * Default cache options
 */
const DEFAULT_OPTIONS: FileCacheOptions = {
  maxMemoryUsage: 256 * 1024 * 1024, // 256MB
  maxEntries: 10000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  ttlMs: 30 * 60 * 1000, // 30 minutes
  enableCompression: false, // Disabled by default for simplicity
  enableIntegrityCheck: true,
};

/**
 * LRU File Cache implementation with advanced features
 */
export class FileCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];
  private options: FileCacheOptions;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: Partial<FileCacheOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      hitRate: 0,
      memoryUsage: 0,
      maxMemoryUsage: this.options.maxMemoryUsage,
    };

    // Start periodic cleanup
    this.startCleanupTimer();
  }

  /**
   * Get file content from cache or load from disk
   */
  async getFile(filePath: string): Promise<string> {
    const normalizedPath = this.normalizePath(filePath);
    
    try {
      // Check if file exists in cache and is still valid
      const cached = this.cache.get(normalizedPath);
      if (cached) {
        const fileStats = await stat(filePath);
        
        // Check if file has been modified
        if (fileStats.mtimeMs === cached.mtime) {
          // Verify integrity if enabled
          if (this.options.enableIntegrityCheck) {
            const currentHash = this.calculateHash(cached.content);
            if (currentHash !== cached.hash) {
              logger.warn(`Cache integrity check failed for ${filePath}`, {
                expectedHash: cached.hash,
                actualHash: currentHash,
              });
              this.cache.delete(normalizedPath);
              this.updateAccessOrder(normalizedPath, true);
            } else {
              // Cache hit - update access info
              this.updateCacheEntry(normalizedPath, cached);
              this.stats.hitCount++;
              this.updateHitRate();
              
              logger.debug(`Cache hit for ${filePath}`, {
                size: cached.size,
                accessCount: cached.accessCount,
              });
              
              return cached.content;
            }
          } else {
            // Cache hit without integrity check
            this.updateCacheEntry(normalizedPath, cached);
            this.stats.hitCount++;
            this.updateHitRate();
            return cached.content;
          }
        } else {
          // File has been modified, remove from cache
          this.cache.delete(normalizedPath);
          this.updateAccessOrder(normalizedPath, true);
          logger.debug(`Cache invalidated for modified file: ${filePath}`);
        }
      }

      // Cache miss - load from disk
      this.stats.missCount++;
      this.updateHitRate();
      
      const content = await this.loadFileFromDisk(filePath);
      await this.cacheFile(normalizedPath, content, filePath);
      
      return content;

    } catch (error) {
      throw new FileSystemError(
        `Failed to get file from cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filePath,
        ErrorCode.FILE_READ_ERROR,
        { additionalInfo: { cacheStats: this.getStats() } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Load file content from disk
   */
  private async loadFileFromDisk(filePath: string): Promise<string> {
    try {
      const fileStats = await stat(filePath);
      
      // Check file size limit
      if (fileStats.size > this.options.maxFileSize) {
        throw new FileSystemError(
          `File too large to cache: ${fileStats.size} bytes (max: ${this.options.maxFileSize})`,
          filePath,
          ErrorCode.FILE_TOO_LARGE,
          { additionalInfo: { fileSize: fileStats.size, maxSize: this.options.maxFileSize } }
        );
      }

      const content = await readFile(filePath, 'utf-8');
      
      logger.debug(`Loaded file from disk: ${filePath}`, {
        size: fileStats.size,
        encoding: 'utf-8',
      });

      return content;

    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new FileSystemError(
          `File not found: ${filePath}`,
          filePath,
          ErrorCode.FILE_NOT_FOUND,
          {},
          error as Error
        );
      }

      throw new FileSystemError(
        `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filePath,
        ErrorCode.FILE_READ_ERROR,
        {},
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Cache file content
   */
  private async cacheFile(normalizedPath: string, content: string, originalPath: string): Promise<void> {
    try {
      const fileStats = await stat(originalPath);
      const contentSize = Buffer.byteLength(content, 'utf-8');
      
      // Check if we need to make room in cache
      await this.ensureCacheSpace(contentSize);

      // Create cache entry
      const entry: CacheEntry = {
        content,
        size: contentSize,
        mtime: fileStats.mtimeMs,
        accessTime: Date.now(),
        accessCount: 1,
        hash: this.options.enableIntegrityCheck ? this.calculateHash(content) : '',
      };

      // Add to cache
      this.cache.set(normalizedPath, entry);
      this.updateAccessOrder(normalizedPath, false);
      
      // Update stats
      this.stats.totalEntries = this.cache.size;
      this.stats.totalSize += contentSize;
      this.stats.memoryUsage += contentSize;

      logger.debug(`Cached file: ${originalPath}`, {
        size: contentSize,
        totalCacheSize: this.stats.totalSize,
        totalEntries: this.stats.totalEntries,
      });

    } catch (error) {
      logger.warn(`Failed to cache file: ${originalPath}`, { error });
      // Don't throw error, caching failure shouldn't break file reading
    }
  }

  /**
   * Ensure there's enough space in cache for new content
   */
  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    // Check memory limit
    if (this.stats.memoryUsage + requiredSize > this.options.maxMemoryUsage) {
      await this.evictLRU(requiredSize);
    }

    // Check entry count limit
    if (this.cache.size >= this.options.maxEntries) {
      await this.evictLRU(0);
    }
  }

  /**
   * Evict least recently used entries
   */
  private async evictLRU(requiredSize: number): Promise<void> {
    const targetSize = this.options.maxMemoryUsage - requiredSize;
    let evictedCount = 0;

    while ((this.stats.memoryUsage > targetSize || this.cache.size >= this.options.maxEntries) && 
           this.accessOrder.length > 0) {
      
      const oldestPath = this.accessOrder.shift();
      if (oldestPath && this.cache.has(oldestPath)) {
        const entry = this.cache.get(oldestPath)!;
        this.cache.delete(oldestPath);
        
        this.stats.totalSize -= entry.size;
        this.stats.memoryUsage -= entry.size;
        this.stats.evictionCount++;
        evictedCount++;

        logger.debug(`Evicted cache entry: ${oldestPath}`, {
          size: entry.size,
          accessCount: entry.accessCount,
        });
      }
    }

    this.stats.totalEntries = this.cache.size;

    if (evictedCount > 0) {
      logger.debug(`Evicted ${evictedCount} cache entries`, {
        remainingEntries: this.stats.totalEntries,
        memoryUsage: this.stats.memoryUsage,
      });
    }
  }

  /**
   * Update cache entry access information
   */
  private updateCacheEntry(path: string, entry: CacheEntry): void {
    entry.accessTime = Date.now();
    entry.accessCount++;
    this.updateAccessOrder(path, false);
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(path: string, remove: boolean): void {
    const index = this.accessOrder.indexOf(path);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    
    if (!remove) {
      this.accessOrder.push(path);
    }
  }

  /**
   * Calculate content hash for integrity checking
   */
  private calculateHash(content: string): string {
    return createHash('sha256').update(content, 'utf-8').digest('hex');
  }

  /**
   * Normalize file path for consistent caching
   */
  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/').toLowerCase();
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const totalRequests = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = totalRequests > 0 ? this.stats.hitCount / totalRequests : 0;
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredPaths: string[] = [];

    for (const [path, entry] of this.cache) {
      if (now - entry.accessTime > this.options.ttlMs) {
        expiredPaths.push(path);
      }
    }

    for (const path of expiredPaths) {
      const entry = this.cache.get(path);
      if (entry) {
        this.cache.delete(path);
        this.updateAccessOrder(path, true);
        this.stats.totalSize -= entry.size;
        this.stats.memoryUsage -= entry.size;
        this.stats.evictionCount++;
      }
    }

    this.stats.totalEntries = this.cache.size;

    if (expiredPaths.length > 0) {
      logger.debug(`Cleaned up ${expiredPaths.length} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      hitRate: 0,
      memoryUsage: 0,
      maxMemoryUsage: this.options.maxMemoryUsage,
    };

    logger.info('File cache cleared');
  }

  /**
   * Check if file is cached
   */
  has(filePath: string): boolean {
    return this.cache.has(this.normalizePath(filePath));
  }

  /**
   * Remove specific file from cache
   */
  invalidate(filePath: string): boolean {
    const normalizedPath = this.normalizePath(filePath);
    const entry = this.cache.get(normalizedPath);
    
    if (entry) {
      this.cache.delete(normalizedPath);
      this.updateAccessOrder(normalizedPath, true);
      this.stats.totalSize -= entry.size;
      this.stats.memoryUsage -= entry.size;
      this.stats.totalEntries = this.cache.size;
      
      logger.debug(`Invalidated cache entry: ${filePath}`);
      return true;
    }
    
    return false;
  }

  /**
   * Update cache options
   */
  updateOptions(newOptions: Partial<FileCacheOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.stats.maxMemoryUsage = this.options.maxMemoryUsage;
    
    // Trigger cleanup if new limits are lower
    if (this.stats.memoryUsage > this.options.maxMemoryUsage || 
        this.cache.size > this.options.maxEntries) {
      this.ensureCacheSpace(0);
    }

    logger.info('File cache options updated', { options: this.options });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
    logger.info('File cache cleaned up');
  }
}
