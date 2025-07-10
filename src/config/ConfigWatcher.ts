/**
 * SuperAugment Configuration Watcher
 * 
 * Provides file system monitoring for configuration files with
 * hot reload capabilities and change notification system.
 */

import { watch, type FSWatcher } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { ConfigValidator, type ValidationResult } from './ConfigValidator.js';
import {
  ConfigurationError,
  ErrorCode,
} from '../errors/ErrorTypes.js';

/**
 * Configuration change event types
 */
export enum ConfigChangeType {
  CREATED = 'created',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  VALIDATION_FAILED = 'validation_failed',
  VALIDATION_PASSED = 'validation_passed',
}

/**
 * Configuration change event data
 */
export interface ConfigChangeEvent {
  type: ConfigChangeType;
  file: string;
  timestamp: Date;
  validationResult?: ValidationResult;
  error?: Error;
}

/**
 * Configuration watcher options
 */
export interface ConfigWatcherOptions {
  enableHotReload: boolean;
  debounceMs: number;
  validateOnChange: boolean;
  backupOnChange: boolean;
  maxBackups: number;
}

/**
 * Default watcher options
 */
const DEFAULT_OPTIONS: ConfigWatcherOptions = {
  enableHotReload: true,
  debounceMs: 1000, // 1 second debounce
  validateOnChange: true,
  backupOnChange: true,
  maxBackups: 5,
};

/**
 * Configuration file watcher with hot reload capabilities
 */
export class ConfigWatcher extends EventEmitter {
  private watchers: Map<string, FSWatcher> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private validator: ConfigValidator;
  private options: ConfigWatcherOptions;
  private isWatching = false;
  private configPath: string;

  constructor(configPath: string, options: Partial<ConfigWatcherOptions> = {}) {
    super();
    this.configPath = configPath;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.validator = new ConfigValidator();
  }

  /**
   * Start watching configuration files
   */
  async startWatching(): Promise<void> {
    if (this.isWatching) {
      logger.warn('Configuration watcher is already running');
      return;
    }

    try {
      const configFiles = [
        'personas.yml',
        'tools.yml',
        'settings.yml',
        'patterns.yml',
      ];

      for (const file of configFiles) {
        await this.watchFile(file);
      }

      this.isWatching = true;
      logger.info('Configuration watcher started', {
        configPath: this.configPath,
        watchedFiles: configFiles,
        options: this.options,
      });

      this.emit('started', { configPath: this.configPath, files: configFiles });

    } catch (error) {
      throw new ConfigurationError(
        `Failed to start configuration watcher: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.CONFIG_LOAD_FAILED,
        { additionalInfo: { configPath: this.configPath } },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Stop watching configuration files
   */
  async stopWatching(): Promise<void> {
    if (!this.isWatching) {
      return;
    }

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close all file watchers
    for (const [file, watcher] of this.watchers) {
      try {
        watcher.close();
        logger.debug(`Stopped watching ${file}`);
      } catch (error) {
        logger.warn(`Failed to close watcher for ${file}`, { error });
      }
    }
    this.watchers.clear();

    this.isWatching = false;
    logger.info('Configuration watcher stopped');

    this.emit('stopped');
  }

  /**
   * Watch a specific configuration file
   */
  private async watchFile(filename: string): Promise<void> {
    const filePath = join(this.configPath, filename);

    try {
      const watcher = watch(filePath, { persistent: false }, (eventType, changedFilename) => {
        if (changedFilename) {
          this.handleFileChange(eventType, filename, filePath);
        }
      });

      watcher.on('error', (error) => {
        logger.error(`File watcher error for ${filename}`, { error, filePath });
        this.emit('error', {
          type: ConfigChangeType.VALIDATION_FAILED,
          file: filename,
          timestamp: new Date(),
          error,
        });
      });

      this.watchers.set(filename, watcher);
      logger.debug(`Started watching ${filename}`, { filePath });

    } catch (error) {
      // File might not exist, which is okay for optional files
      if ((error as any).code === 'ENOENT') {
        logger.debug(`Configuration file ${filename} does not exist, skipping watch`);
      } else {
        logger.error(`Failed to watch ${filename}`, { error, filePath });
        throw error;
      }
    }
  }

  /**
   * Handle file system change events
   */
  private handleFileChange(eventType: string, filename: string, filePath: string): void {
    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(filename);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      try {
        await this.processFileChange(eventType, filename, filePath);
      } catch (error) {
        logger.error(`Failed to process file change for ${filename}`, { error });
        this.emit('error', {
          type: ConfigChangeType.VALIDATION_FAILED,
          file: filename,
          timestamp: new Date(),
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      } finally {
        this.debounceTimers.delete(filename);
      }
    }, this.options.debounceMs);

    this.debounceTimers.set(filename, timer);
  }

  /**
   * Process file change after debounce
   */
  private async processFileChange(eventType: string, filename: string, filePath: string): Promise<void> {
    logger.info(`Configuration file changed: ${filename}`, { eventType, filePath });

    let changeType: ConfigChangeType;
    switch (eventType) {
      case 'rename':
        // Check if file still exists to determine if it was created or deleted
        try {
          const fs = await import('fs/promises');
          await fs.access(filePath);
          changeType = ConfigChangeType.CREATED;
        } catch {
          changeType = ConfigChangeType.DELETED;
        }
        break;
      case 'change':
        changeType = ConfigChangeType.MODIFIED;
        break;
      default:
        changeType = ConfigChangeType.MODIFIED;
    }

    const event: ConfigChangeEvent = {
      type: changeType,
      file: filename,
      timestamp: new Date(),
    };

    // Create backup if enabled
    if (this.options.backupOnChange && changeType === ConfigChangeType.MODIFIED) {
      try {
        await this.createBackup(filename);
      } catch (error) {
        logger.warn(`Failed to create backup for ${filename}`, { error });
      }
    }

    // Validate configuration if enabled
    if (this.options.validateOnChange && changeType !== ConfigChangeType.DELETED) {
      try {
        const validationResult = await this.validateConfiguration();
        event.validationResult = validationResult;

        if (validationResult.isValid) {
          event.type = ConfigChangeType.VALIDATION_PASSED;
          logger.info(`Configuration validation passed for ${filename}`, {
            warnings: validationResult.warnings.length,
          });
        } else {
          event.type = ConfigChangeType.VALIDATION_FAILED;
          logger.error(`Configuration validation failed for ${filename}`, {
            errors: validationResult.errors.length,
            warnings: validationResult.warnings.length,
          });
        }
      } catch (error) {
        event.error = error instanceof Error ? error : new Error('Validation failed');
        event.type = ConfigChangeType.VALIDATION_FAILED;
        logger.error(`Configuration validation error for ${filename}`, { error });
      }
    }

    // Emit change event
    this.emit('change', event);

    // Emit specific event type
    this.emit(event.type, event);

    // Hot reload if enabled and validation passed
    if (this.options.enableHotReload && 
        (event.type === ConfigChangeType.VALIDATION_PASSED || 
         (event.type === ConfigChangeType.MODIFIED && !this.options.validateOnChange))) {
      this.emit('reload', event);
    }
  }

  /**
   * Validate all configuration files
   */
  private async validateConfiguration(): Promise<ValidationResult> {
    return this.validator.validateAll(this.configPath);
  }

  /**
   * Create backup of configuration file
   */
  private async createBackup(filename: string): Promise<void> {
    const fs = await import('fs/promises');
    
    const sourceFile = join(this.configPath, filename);
    const backupDir = join(this.configPath, '.backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(backupDir, `${filename}.${timestamp}.bak`);

    try {
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });

      // Copy file to backup
      await fs.copyFile(sourceFile, backupFile);

      logger.debug(`Created backup: ${backupFile}`);

      // Clean up old backups
      await this.cleanupOldBackups(filename, backupDir);

    } catch (error) {
      logger.warn(`Failed to create backup for ${filename}`, { error });
      throw error;
    }
  }

  /**
   * Clean up old backup files
   */
  private async cleanupOldBackups(filename: string, backupDir: string): Promise<void> {
    try {
      const fs = await import('fs/promises');

      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter(file => file.startsWith(filename) && file.endsWith('.bak'))
        .map(file => ({
          name: file,
          path: join(backupDir, file),
          stat: null as any,
        }));

      // Get file stats for sorting by creation time
      for (const file of backupFiles) {
        try {
          file.stat = await fs.stat(file.path);
        } catch (error) {
          logger.warn(`Failed to get stats for backup file ${file.name}`, { error });
        }
      }

      // Sort by creation time (newest first)
      backupFiles.sort((a, b) => {
        if (!a.stat || !b.stat) return 0;
        return b.stat.birthtime.getTime() - a.stat.birthtime.getTime();
      });

      // Remove excess backups
      if (backupFiles.length > this.options.maxBackups) {
        const filesToDelete = backupFiles.slice(this.options.maxBackups);
        for (const file of filesToDelete) {
          try {
            await fs.unlink(file.path);
            logger.debug(`Deleted old backup: ${file.name}`);
          } catch (error) {
            logger.warn(`Failed to delete old backup ${file.name}`, { error });
          }
        }
      }

    } catch (error) {
      logger.warn('Failed to cleanup old backups', { error });
    }
  }

  /**
   * Get current watcher status
   */
  getStatus(): {
    isWatching: boolean;
    watchedFiles: string[];
    options: ConfigWatcherOptions;
  } {
    return {
      isWatching: this.isWatching,
      watchedFiles: Array.from(this.watchers.keys()),
      options: this.options,
    };
  }

  /**
   * Force validation of all configuration files
   */
  async forceValidation(): Promise<ValidationResult> {
    try {
      const result = await this.validateConfiguration();
      
      this.emit('validation', {
        type: result.isValid ? ConfigChangeType.VALIDATION_PASSED : ConfigChangeType.VALIDATION_FAILED,
        file: 'all',
        timestamp: new Date(),
        validationResult: result,
      });

      return result;
    } catch (error) {
      const errorEvent: ConfigChangeEvent = {
        type: ConfigChangeType.VALIDATION_FAILED,
        file: 'all',
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error('Validation failed'),
      };

      this.emit('validation', errorEvent);
      throw error;
    }
  }

  /**
   * Update watcher options
   */
  updateOptions(newOptions: Partial<ConfigWatcherOptions>): void {
    this.options = { ...this.options, ...newOptions };
    logger.info('Configuration watcher options updated', { options: this.options });
  }
}
