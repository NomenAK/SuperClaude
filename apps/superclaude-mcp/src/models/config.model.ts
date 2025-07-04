import { z } from "zod";

// Source configuration schemas
export const LocalSourceConfigSchema = z.object({
  path: z.string().min(1, "Local path is required"),
});

export const RemoteSourceConfigSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  branch: z.string().default("main"),
  cacheTTL: z.number().min(1).default(5), // Cache duration in minutes
});

export const SourceConfigSchema = z.object({
  type: z.enum(["local", "remote"]),
  local: LocalSourceConfigSchema.optional(),
  remote: RemoteSourceConfigSchema.optional(),
});

// Database configuration schema
export const DatabaseConfigSchema = z.object({
  path: z.string().optional(),
  autoInit: z.boolean().default(true),
});

// Sync configuration schema
export const SyncConfigSchema = z.object({
  enabled: z.boolean().default(false),
  intervalMinutes: z.number().min(1).default(30),
  onStartup: z.boolean().default(false),
});

// Server configuration schema
export const ServerConfigSchema = z.object({
  transport: z.enum(["stdio", "http"]).default("stdio"),
  port: z.number().min(1).max(65535).default(8080),
  logLevel: z.string().default("info"),
});

// Persistence configuration schema
export const PersistenceConfigSchema = z.object({
  enabled: z.boolean().default(false),
  autoSave: z.boolean().default(false),
});

// Base configuration schema (without refinements)
const AppConfigBaseSchema = z.object({
  source: SourceConfigSchema,
  database: DatabaseConfigSchema.default({}),
  sync: SyncConfigSchema.default({}),
  server: ServerConfigSchema.default({}),
  persistence: PersistenceConfigSchema.default({}),
});

// Main application configuration schema with refinements
export { AppConfigBaseSchema };
export const AppConfigSchema = AppConfigBaseSchema.refine(
  data => {
    // Validate that if source type is local, local config is provided
    if (data.source.type === "local" && !data.source.local) {
      return false;
    }
    // Validate that if source type is remote, remote config is provided
    if (data.source.type === "remote" && !data.source.remote) {
      return false;
    }
    return true;
  },
  {
    message: "Source configuration must match the specified type",
    path: ["source"],
  }
);

// Type exports
export type LocalSourceConfig = z.infer<typeof LocalSourceConfigSchema>;
export type RemoteSourceConfig = z.infer<typeof RemoteSourceConfigSchema>;
export type SourceConfig = z.infer<typeof SourceConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type SyncConfig = z.infer<typeof SyncConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type PersistenceConfig = z.infer<typeof PersistenceConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

// Default configuration
export const DEFAULT_CONFIG: AppConfig = {
  source: {
    type: "remote",
    remote: {
      url: "https://github.com/NomenAK/SuperClaude",
      branch: "master",
      cacheTTL: 5,
    },
  },
  database: {
    path: "~/.superclaude/data/db.json",
    autoInit: true,
  },
  sync: {
    enabled: false,
    intervalMinutes: 30,
    onStartup: false,
  },
  server: {
    transport: "stdio",
    port: 8080,
    logLevel: "info",
  },
  persistence: {
    enabled: false,
    autoSave: false,
  },
};

// Model schema for database storage (if needed)
export const AppConfigModelSchema = AppConfigBaseSchema.extend({
  id: z.string().default("app-config"),
  lastUpdated: z.date().default(() => new Date()),
});

export type AppConfigModel = z.infer<typeof AppConfigModelSchema>;
