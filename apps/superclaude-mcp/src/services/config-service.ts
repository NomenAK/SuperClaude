import fs from "fs/promises";
import path from "path";
import os from "os";
import { AppConfig, AppConfigSchema, DEFAULT_CONFIG } from "@/models/config.model.js";
import logger from "@logger";

export interface ConfigOptions {
  // CLI arguments
  sourceType?: "local" | "remote";
  sourcePath?: string;
  sourceUrl?: string;
  sourceBranch?: string;
  databasePath?: string;
  transport?: "stdio" | "http";
  port?: number;
  logLevel?: string;
  persistConfig?: boolean;

  // Config file path override
  configPath?: string;
}

export class ConfigService {
  private config: AppConfig;
  private configFilePath: string;
  private initialized = false;

  constructor(private options: ConfigOptions = {}) {
    this.configFilePath = this.getConfigFilePath();
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Initialize the configuration by loading from all sources in precedence order
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure the config directory exists with anyone can read and write
    const configDir = path.join(os.homedir(), ".superclaude");
    await fs.mkdir(configDir, { recursive: true, mode: 0o755 });

    try {
      // Load configuration in precedence order
      let config = { ...DEFAULT_CONFIG };

      // 1. Load from user config file (lowest precedence)
      const userConfig = await this.loadUserConfig();
      if (userConfig) {
        config = this.mergeConfigs(config, userConfig);
      }

      // 2. Load from environment variables
      const envConfig = this.loadEnvironmentConfig();
      config = this.mergeConfigs(config, envConfig);

      // 3. Load from CLI arguments (highest precedence)
      const cliConfig = this.loadCliConfig();
      config = this.mergeConfigs(config, cliConfig);

      // Validate the final configuration
      this.config = AppConfigSchema.parse(config);
      this.initialized = true;

      logger.info(
        {
          sourceType: this.config.source.type,
          persistenceEnabled: this.config.persistence.enabled,
          configFile: this.configFilePath,
        },
        "Configuration loaded successfully"
      );

      // Auto-save if persistence is enabled and auto-save is on
      if (this.config.persistence.enabled && this.config.persistence.autoSave) {
        await this.saveUserConfig();
      }
    } catch (error) {
      logger.error({ error }, "Failed to initialize configuration");
      throw error;
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): AppConfig {
    if (!this.initialized) {
      throw new Error("Configuration not initialized. Call initialize() first.");
    }
    return { ...this.config };
  }

  /**
   * Update configuration and optionally persist
   */
  async updateConfig(updates: Partial<AppConfig>, persist = false): Promise<void> {
    const newConfig = this.mergeConfigs(this.config, updates);
    this.config = AppConfigSchema.parse(newConfig);

    if (persist && this.config.persistence.enabled) {
      await this.saveUserConfig();
    }

    logger.info({ updates }, "Configuration updated");
  }

  /**
   * Save current configuration to user config file
   */
  async saveUserConfig(): Promise<void> {
    try {
      const configDir = path.dirname(this.configFilePath);
      await fs.mkdir(configDir, { recursive: true });

      const configJson = JSON.stringify(this.config, null, 2);
      await fs.writeFile(this.configFilePath, configJson, "utf-8");

      logger.info({ configFile: this.configFilePath }, "Configuration saved to file");
    } catch (error) {
      logger.error({ error, configFile: this.configFilePath }, "Failed to save configuration");
      throw error;
    }
  }

  /**
   * Load configuration from user config file
   */
  private async loadUserConfig(): Promise<Partial<AppConfig> | null> {
    try {
      const configExists = await fs
        .access(this.configFilePath)
        .then(() => true)
        .catch(() => false);

      if (!configExists) {
        logger.debug({ configFile: this.configFilePath }, "User config file not found");
        return null;
      }

      const configContent = await fs.readFile(this.configFilePath, "utf-8");
      const userConfig = JSON.parse(configContent);

      logger.debug({ configFile: this.configFilePath }, "Loaded user config file");
      return userConfig;
    } catch (error) {
      logger.warn(
        { error, configFile: this.configFilePath },
        "Failed to load user config file, using defaults"
      );
      return null;
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadEnvironmentConfig(): Partial<AppConfig> {
    const config: any = {};

    // Source configuration
    if (process.env.SC_SOURCE_TYPE) {
      config.source = { type: process.env.SC_SOURCE_TYPE };

      if (process.env.SC_SOURCE_TYPE === "local" && process.env.SC_SOURCE_PATH) {
        config.source.local = { path: process.env.SC_SOURCE_PATH };
      }

      if (process.env.SC_SOURCE_TYPE === "remote") {
        config.source.remote = {};
        if (process.env.SC_SOURCE_URL) {
          config.source.remote.url = process.env.SC_SOURCE_URL;
        }
        if (process.env.SC_SOURCE_BRANCH) {
          config.source.remote.branch = process.env.SC_SOURCE_BRANCH;
        }
        if (process.env.SC_SOURCE_CACHE_TTL) {
          config.source.remote.cacheTTL = parseInt(process.env.SC_SOURCE_CACHE_TTL, 10);
        }
      }
    }

    // Database configuration
    if (process.env.SC_DATABASE_PATH) {
      config.database = { path: process.env.SC_DATABASE_PATH };
    }

    // Sync configuration
    if (process.env.SC_AUTO_SYNC_ENABLED) {
      config.sync = {
        enabled: process.env.SC_AUTO_SYNC_ENABLED === "true",
      };
    }

    // Server configuration
    if (process.env.SC_TRANSPORT) {
      config.server = { transport: process.env.SC_TRANSPORT };
    }
    if (process.env.PORT) {
      config.server = { ...config.server, port: parseInt(process.env.PORT, 10) };
    }
    if (process.env.LOG_LEVEL) {
      config.server = { ...config.server, logLevel: process.env.LOG_LEVEL };
    }

    if (Object.keys(config).length > 0) {
      logger.debug("Loaded configuration from environment variables");
    }

    return config;
  }

  /**
   * Load configuration from CLI arguments
   */
  private loadCliConfig(): Partial<AppConfig> {
    const config: any = {};

    if (this.options.sourceType) {
      config.source = { type: this.options.sourceType };

      if (this.options.sourceType === "local" && this.options.sourcePath) {
        config.source.local = { path: this.options.sourcePath };
      }

      if (this.options.sourceType === "remote") {
        config.source.remote = {};
        if (this.options.sourceUrl) {
          config.source.remote.url = this.options.sourceUrl;
        }
        if (this.options.sourceBranch) {
          config.source.remote.branch = this.options.sourceBranch;
        }
      }
    }

    if (this.options.databasePath) {
      config.database = { path: this.options.databasePath };
    }

    if (this.options.transport) {
      config.server = { transport: this.options.transport };
    }

    if (this.options.port) {
      config.server = { ...config.server, port: this.options.port };
    }

    if (this.options.logLevel) {
      config.server = { ...config.server, logLevel: this.options.logLevel };
    }

    if (this.options.persistConfig) {
      config.persistence = { enabled: true, autoSave: true };
    }

    if (Object.keys(config).length > 0) {
      logger.debug("Loaded configuration from CLI arguments");
    }

    return config;
  }

  /**
   * Get the path for the user config file
   */
  private getConfigFilePath(): string {
    if (this.options.configPath) {
      return this.options.configPath;
    }

    const homeDir = os.homedir();
    return path.join(homeDir, ".superclaude", "config.json");
  }

  /**
   * Deep merge two configuration objects
   */
  private mergeConfigs(base: any, override: any): any {
    const result = { ...base };

    for (const key in override) {
      if (override[key] !== undefined && override[key] !== null) {
        if (
          typeof override[key] === "object" &&
          !Array.isArray(override[key]) &&
          typeof base[key] === "object" &&
          !Array.isArray(base[key])
        ) {
          result[key] = this.mergeConfigs(base[key] || {}, override[key]);
        } else {
          result[key] = override[key];
        }
      }
    }

    return result;
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfig(deleteUserConfig = false): Promise<void> {
    this.config = { ...DEFAULT_CONFIG };

    if (deleteUserConfig) {
      try {
        await fs.unlink(this.configFilePath);
        logger.info({ configFile: this.configFilePath }, "User config file deleted");
      } catch (error) {
        // File might not exist, that's okay
        logger.debug({ error }, "Could not delete user config file (may not exist)");
      }
    }

    logger.info("Configuration reset to defaults");
  }

  /**
   * Get the current configuration file path
   */
  getCurrentConfigFilePath(): string {
    return this.configFilePath;
  }
}
