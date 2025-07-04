import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  AppConfigSchema,
  AppConfigBaseSchema,
  SourceConfigSchema,
  LocalSourceConfigSchema,
  RemoteSourceConfigSchema,
  DatabaseConfigSchema,
  SyncConfigSchema,
  ServerConfigSchema,
  PersistenceConfigSchema,
  DEFAULT_CONFIG,
} from "../config.model.js";

describe("Configuration Model Schemas", () => {
  describe("LocalSourceConfigSchema", () => {
    it("should validate valid local source config", () => {
      const config = { path: "/test/data" };
      const result = LocalSourceConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(config);
    });

    it("should reject empty path", () => {
      const config = { path: "" };
      const result = LocalSourceConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain("Local path is required");
    });

    it("should reject missing path", () => {
      const config = {};
      const result = LocalSourceConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });
  });

  describe("RemoteSourceConfigSchema", () => {
    it("should validate valid remote source config", () => {
      const config = {
        url: "https://github.com/test/repo",
        branch: "main",
        cacheTTL: 60,
      };
      const result = RemoteSourceConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(config);
    });

    it("should reject invalid URL", () => {
      const config = {
        url: "not-a-url",
        branch: "main",
        cacheTTL: 60,
      };
      const result = RemoteSourceConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain("Must be a valid URL");
    });

    it("should reject negative cache TTL", () => {
      const config = {
        url: "https://github.com/test/repo",
        branch: "main",
        cacheTTL: -1,
      };
      const result = RemoteSourceConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        "Number must be greater than or equal to 1"
      );
    });

    it("should reject cache TTL of 0", () => {
      const config = {
        url: "https://github.com/test/repo",
        branch: "main",
        cacheTTL: 0,
      };
      const result = RemoteSourceConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        "Number must be greater than or equal to 1"
      );
    });
  });

  describe("SourceConfigSchema", () => {
    it("should validate local source config", () => {
      const config = {
        type: "local" as const,
        local: { path: "/test/data" },
        remote: {
          url: "https://github.com/default/repo",
          branch: "main",
          cacheTTL: 60,
        },
      };
      const result = SourceConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      expect(result.data.type).toBe("local");
    });

    it("should validate remote source config", () => {
      const config = {
        type: "remote" as const,
        remote: {
          url: "https://github.com/test/repo",
          branch: "develop",
          cacheTTL: 120,
        },
        local: { path: "/default/path" },
      };
      const result = SourceConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      expect(result.data.type).toBe("remote");
    });

    it("should reject invalid source type", () => {
      const config = {
        type: "invalid",
        local: { path: "/test/data" },
        remote: {
          url: "https://github.com/test/repo",
          branch: "main",
          cacheTTL: 60,
        },
      };
      const result = SourceConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain("Invalid enum value");
    });
  });

  describe("DatabaseConfigSchema", () => {
    it("should validate valid database config", () => {
      const config = { path: "./data/superclaude.json" };
      const result = DatabaseConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...config,
        autoInit: true, // Default value
      });
    });

    it("should handle absolute paths", () => {
      const config = { path: "/absolute/path/db.json" };
      const result = DatabaseConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });
  });

  describe("SyncConfigSchema", () => {
    it("should validate valid sync config", () => {
      const config = {
        enabled: true,
        intervalMinutes: 30,
        onStartup: true,
      };
      const result = SyncConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(config);
    });

    it("should reject negative interval", () => {
      const config = {
        enabled: true,
        intervalMinutes: -5,
        onStartup: true,
      };
      const result = SyncConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain(
        "Number must be greater than or equal to 1"
      );
    });

    it("should reject zero interval", () => {
      const config = {
        enabled: true,
        intervalMinutes: 0,
        onStartup: true,
      };
      const result = SyncConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });

    it("should accept very large intervals", () => {
      const config = {
        enabled: true,
        intervalMinutes: 10080, // 1 week
        onStartup: false,
      };
      const result = SyncConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });
  });

  describe("ServerConfigSchema", () => {
    it("should validate stdio transport", () => {
      const config = {
        transport: "stdio" as const,
        port: 8080,
        logLevel: "info",
      };
      const result = ServerConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it("should validate http transport", () => {
      const config = {
        transport: "http" as const,
        port: 3000,
        logLevel: "debug",
      };
      const result = ServerConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it("should reject invalid transport", () => {
      const config = {
        transport: "websocket",
        port: 8080,
        logLevel: "info",
      };
      const result = ServerConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });

    it("should reject invalid port numbers", () => {
      const invalidPorts = [0, -1, 65536, 100000];

      invalidPorts.forEach(port => {
        const config = {
          transport: "http" as const,
          port,
          logLevel: "info",
        };
        const result = ServerConfigSchema.safeParse(config);

        expect(result.success).toBe(false);
      });
    });

    it("should accept valid port range", () => {
      const validPorts = [1, 80, 443, 3000, 8080, 65535];

      validPorts.forEach(port => {
        const config = {
          transport: "http" as const,
          port,
          logLevel: "info",
        };
        const result = ServerConfigSchema.safeParse(config);

        expect(result.success).toBe(true);
      });
    });
  });

  describe("PersistenceConfigSchema", () => {
    it("should validate valid persistence config", () => {
      const config = {
        enabled: true,
        autoSave: true,
      };
      const result = PersistenceConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(config);
    });

    it("should allow disabled persistence", () => {
      const config = {
        enabled: false,
        autoSave: false,
      };
      const result = PersistenceConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });
  });

  describe("AppConfigSchema", () => {
    it("should validate complete valid configuration", () => {
      const config = {
        source: {
          type: "remote" as const,
          remote: {
            url: "https://github.com/test/repo",
            branch: "main",
            cacheTTL: 60,
          },
          local: { path: "/default/path" },
        },
        database: { path: "./data/superclaude.json" },
        sync: {
          enabled: true,
          intervalMinutes: 30,
          onStartup: true,
        },
        server: {
          transport: "stdio" as const,
          port: 8080,
          logLevel: "info",
        },
        persistence: {
          enabled: false,
          autoSave: false,
        },
      };

      const result = AppConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...config,
        database: {
          ...config.database,
          autoInit: true, // Default value added by schema
        },
      });
    });

    it("should reject configuration with local type but missing local config", () => {
      const config = {
        source: {
          type: "local" as const,
          remote: {
            url: "https://github.com/test/repo",
            branch: "main",
            cacheTTL: 60,
          },
        },
        database: { path: "./data/superclaude.json" },
        sync: {
          enabled: true,
          intervalMinutes: 30,
          onStartup: true,
        },
        server: {
          transport: "stdio" as const,
          port: 8080,
          logLevel: "info",
        },
        persistence: {
          enabled: false,
          autoSave: false,
        },
      };

      const result = AppConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain("Source configuration must match");
    });

    it("should reject configuration with remote type but missing remote config", () => {
      const config = {
        source: {
          type: "remote" as const,
          local: { path: "/test/path" },
        },
        database: { path: "./data/superclaude.json" },
        sync: {
          enabled: true,
          intervalMinutes: 30,
          onStartup: true,
        },
        server: {
          transport: "stdio" as const,
          port: 8080,
          logLevel: "info",
        },
        persistence: {
          enabled: false,
          autoSave: false,
        },
      };

      const result = AppConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain("Source configuration must match");
    });

    it("should accept partial configuration for base schema", () => {
      const partialConfig = {
        sync: {
          enabled: false,
        },
      };

      // Use z.partial() on the base schema
      const PartialSchema = z.object({
        source: SourceConfigSchema.optional(),
        database: DatabaseConfigSchema.optional(),
        sync: SyncConfigSchema.optional(),
        server: ServerConfigSchema.optional(),
        persistence: PersistenceConfigSchema.optional(),
      });

      const result = PartialSchema.safeParse(partialConfig);

      expect(result.success).toBe(true);
      expect(result.data.sync?.enabled).toBe(false);
    });
  });

  describe("DEFAULT_CONFIG", () => {
    it("should be a valid AppConfig", () => {
      const result = AppConfigSchema.safeParse(DEFAULT_CONFIG);

      expect(result.success).toBe(true);
    });

    it("should have remote source as default", () => {
      expect(DEFAULT_CONFIG.source.type).toBe("remote");
      expect(DEFAULT_CONFIG.source.remote.url).toContain("NomenAK/SuperClaude");
    });

    it("should have sync enabled by default", () => {
      expect(DEFAULT_CONFIG.sync.enabled).toBe(false);
      expect(DEFAULT_CONFIG.sync.intervalMinutes).toBe(30);
      expect(DEFAULT_CONFIG.sync.onStartup).toBe(false);
    });

    it("should have persistence disabled by default", () => {
      expect(DEFAULT_CONFIG.persistence.enabled).toBe(false);
      expect(DEFAULT_CONFIG.persistence.autoSave).toBe(false);
    });

    it("should use stdio transport by default", () => {
      expect(DEFAULT_CONFIG.server.transport).toBe("stdio");
    });
  });

  describe("Edge cases and validation", () => {
    it("should handle very long URLs", () => {
      const longUrl = "https://github.com/" + "a".repeat(1000) + "/repo";
      const config = {
        url: longUrl,
        branch: "main",
        cacheTTL: 60,
      };

      const result = RemoteSourceConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should handle paths with special characters", () => {
      const specialPath = "/test/data with spaces/and-dashes_underscores/";
      const config = { path: specialPath };

      const result = LocalSourceConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should handle unicode in paths", () => {
      const unicodePath = "/test/données/文件夹/";
      const config = { path: unicodePath };

      const result = LocalSourceConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });
});
