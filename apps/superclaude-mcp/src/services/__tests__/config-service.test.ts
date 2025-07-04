import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ConfigService, ConfigOptions } from "../config-service.js";
import { DEFAULT_CONFIG } from "@/models/config.model.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("ConfigService", () => {
  let configService: ConfigService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear configuration-related environment variables
    delete process.env.SC_SOURCE_TYPE;
    delete process.env.SC_SOURCE_PATH;
    delete process.env.SC_SOURCE_URL;
    delete process.env.SC_SOURCE_BRANCH;
    delete process.env.SC_DATABASE_PATH;
    delete process.env.SC_AUTO_SYNC_ENABLED;
    delete process.env.SC_TRANSPORT;
    delete process.env.PORT;
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with default options", () => {
      configService = new ConfigService();
      expect(configService).toBeDefined();
      // Use a predictable path for testing
      expect(configService.getCurrentConfigFilePath()).toContain(".superclaude/config.json");
    });

    it("should accept custom config path", () => {
      const customPath = "/custom/config.json";
      configService = new ConfigService({ configPath: customPath });
      expect(configService.getCurrentConfigFilePath()).toBe(customPath);
    });
  });

  describe("initialize", () => {
    it("should load default configuration when no overrides exist", async () => {
      // Ensure there's no existing config file that could interfere
      const configPath = path.join(os.homedir(), ".superclaude", "config.json");
      try {
        await fs.unlink(configPath);
      } catch {
        // File doesn't exist, that's fine
      }

      configService = new ConfigService();
      await configService.initialize();

      const config = configService.getConfig();
      expect(config.source.type).toBe(DEFAULT_CONFIG.source.type);
      expect(config.sync.enabled).toBe(false); // DEFAULT_CONFIG.sync.enabled is false
      expect(config.server.transport).toBe(DEFAULT_CONFIG.server.transport);
    });

    it("should load configuration from environment variables", async () => {
      process.env.SC_SOURCE_TYPE = "remote";
      process.env.SC_SOURCE_URL = "https://github.com/test/repo";
      process.env.SC_SOURCE_BRANCH = "develop";
      process.env.SC_AUTO_SYNC_ENABLED = "false";

      configService = new ConfigService();
      await configService.initialize();

      const config = configService.getConfig();
      expect(config.source.type).toBe("remote");
      expect(config.source.remote.url).toBe("https://github.com/test/repo");
      expect(config.source.remote.branch).toBe("develop");
      expect(config.sync.enabled).toBe(false);
    });

    it("should prioritize CLI options over environment variables", async () => {
      process.env.SC_SOURCE_TYPE = "remote";
      process.env.SC_SOURCE_URL = "https://github.com/env/repo";

      const cliOptions: ConfigOptions = {
        sourceType: "local",
        sourcePath: "/cli/path",
      };

      configService = new ConfigService(cliOptions);
      await configService.initialize();

      const config = configService.getConfig();
      expect(config.source.type).toBe("local");
      expect(config.source.local.path).toBe("/cli/path");
    });

    it("should handle CLI options overriding environment variables", async () => {
      // Environment variables
      process.env.SC_SOURCE_TYPE = "local";
      process.env.SC_SOURCE_PATH = "/env/path";
      process.env.PORT = "3000";

      // CLI options (should override environment)
      const cliOptions: ConfigOptions = {
        sourceType: "remote",
        sourceUrl: "https://github.com/cli/repo",
        sourceBranch: "cli-branch",
      };

      configService = new ConfigService(cliOptions);
      await configService.initialize();

      const config = configService.getConfig();
      expect(config.source.type).toBe("remote"); // CLI wins over env
      expect(config.source.remote.url).toBe("https://github.com/cli/repo"); // CLI value
      expect(config.source.remote.branch).toBe("cli-branch"); // CLI value
      expect(config.server.port).toBe(3000); // ENV value preserved when not overridden by CLI
    });

    it("should set persistence configuration when requested", async () => {
      const cliOptions: ConfigOptions = {
        persistConfig: true,
      };

      configService = new ConfigService(cliOptions);
      await configService.initialize();

      const config = configService.getConfig();
      expect(config.persistence.enabled).toBe(true);
      expect(config.persistence.autoSave).toBe(true);
    });

    it("should not reinitialize if already initialized", async () => {
      configService = new ConfigService();
      await configService.initialize();

      // Get the config to ensure it's initialized
      const config1 = configService.getConfig();

      // Try to initialize again
      await configService.initialize();

      // Should still return the same config
      const config2 = configService.getConfig();
      expect(config1).toEqual(config2);
    });
  });

  describe("getConfig", () => {
    it("should throw error if not initialized", () => {
      configService = new ConfigService();
      expect(() => configService.getConfig()).toThrow(
        "Configuration not initialized. Call initialize() first."
      );
    });

    it("should return a copy of configuration", async () => {
      configService = new ConfigService();
      await configService.initialize();

      const config1 = configService.getConfig();
      const config2 = configService.getConfig();

      expect(config1).not.toBe(config2); // Different objects
      expect(config1).toEqual(config2); // Same content
    });
  });

  describe("updateConfig", () => {
    beforeEach(async () => {
      configService = new ConfigService();
      await configService.initialize();
    });

    it("should update configuration with partial updates", async () => {
      await configService.updateConfig({
        sync: { enabled: false },
      });

      const config = configService.getConfig();
      expect(config.sync.enabled).toBe(false);
      expect(config.sync.intervalMinutes).toBe(DEFAULT_CONFIG.sync.intervalMinutes);
    });

    it("should validate updated configuration", async () => {
      await expect(
        configService.updateConfig({
          source: { type: "invalid" as any },
        })
      ).rejects.toThrow();
    });

    it("should update persistence settings correctly", async () => {
      // Enable persistence
      await configService.updateConfig({
        persistence: { enabled: true, autoSave: true },
      });

      const config = configService.getConfig();
      expect(config.persistence.enabled).toBe(true);
      expect(config.persistence.autoSave).toBe(true);
    });
  });

  describe("resetConfig", () => {
    beforeEach(async () => {
      configService = new ConfigService();
      await configService.initialize();

      // Make some changes
      await configService.updateConfig({
        sync: { enabled: false },
      });
    });

    it("should reset configuration to defaults", async () => {
      await configService.resetConfig();

      const config = configService.getConfig();
      expect(config.source.type).toBe(DEFAULT_CONFIG.source.type);
      expect(config.sync.enabled).toBe(DEFAULT_CONFIG.sync.enabled);
      expect(config.server.transport).toBe(DEFAULT_CONFIG.server.transport);
    });
  });

  describe("environment variable parsing", () => {
    it("should parse PORT as number", async () => {
      process.env.PORT = "8080";

      configService = new ConfigService();
      await configService.initialize();

      const config = configService.getConfig();
      expect(config.server.port).toBe(8080);
      expect(typeof config.server.port).toBe("number");
    });

    it("should parse SC_SOURCE_CACHE_TTL as number", async () => {
      process.env.SC_SOURCE_TYPE = "remote";
      process.env.SC_SOURCE_CACHE_TTL = "120";

      configService = new ConfigService();
      await configService.initialize();

      const config = configService.getConfig();
      expect(config.source.remote.cacheTTL).toBe(120);
      expect(typeof config.source.remote.cacheTTL).toBe("number");
    });

    it("should parse boolean environment variables correctly", async () => {
      process.env.SC_AUTO_SYNC_ENABLED = "true";

      configService = new ConfigService();
      await configService.initialize();

      const config = configService.getConfig();
      expect(config.sync.enabled).toBe(true);
      expect(typeof config.sync.enabled).toBe("boolean");
    });
  });

  describe("local source configuration", () => {
    it("should configure local source from CLI options", async () => {
      const cliOptions: ConfigOptions = {
        sourceType: "local",
        sourcePath: "/data/superclaude",
      };

      configService = new ConfigService(cliOptions);
      await configService.initialize();

      const config = configService.getConfig();
      expect(config.source.type).toBe("local");
      expect(config.source.local.path).toBe("/data/superclaude");
    });

    it("should configure local source from environment", async () => {
      process.env.SC_SOURCE_TYPE = "local";
      process.env.SC_SOURCE_PATH = "/env/data";

      configService = new ConfigService();
      await configService.initialize();

      const config = configService.getConfig();
      expect(config.source.type).toBe("local");
      expect(config.source.local.path).toBe("/env/data");
    });
  });

  describe("remote source configuration", () => {
    it("should configure remote source with all options", async () => {
      const cliOptions: ConfigOptions = {
        sourceType: "remote",
        sourceUrl: "https://github.com/test/repo",
        sourceBranch: "feature",
      };

      configService = new ConfigService(cliOptions);
      await configService.initialize();

      const config = configService.getConfig();
      expect(config.source.type).toBe("remote");
      expect(config.source.remote.url).toBe("https://github.com/test/repo");
      expect(config.source.remote.branch).toBe("feature");
    });
  });
});
