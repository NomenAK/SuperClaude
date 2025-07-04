#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Command } from "commander";
import express from "express";
import serverInstance from "@/http-server.js";
import app from "@/app.js";
import logger, { configureLogger } from "@logger";
import { DatabaseService } from "@services/database-service.js";
import { SyncReportGenerator } from "@utils/sync-report.js";
import { SourceLoaderFactory } from "@/sources/index.js";
import { SyncService } from "@services/sync-service.js";
import { ConfigService, ConfigOptions } from "@services/config-service.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import os from "os";
import packageJson from "../package.json" with { type: "json" };

// Helper function to expand tilde in paths
function expandTilde(filepath: string): string {
  if (filepath.startsWith("~/")) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  return filepath;
}

async function launchMcpStdioServer() {
  const server = serverInstance.createInstance();
  await server.connect(new StdioServerTransport());
  logger.info("SuperClaude MCP server started on stdio");
  return server;
}

async function launchHttpServer() {
  const PORT = process.env.PORT || 8080;

  const server = express()
    .use(app)
    .listen(PORT, () => {
      logger.info({ port: PORT }, "SuperClaude HTTP server started");
    });

  return server;
}

async function runServer(transport: string) {
  // Configure logger based on transport type as early as possible
  configureLogger(transport);

  if (!["stdio", "http"].includes(transport)) {
    logger.error(`Invalid transport type: ${transport}. Must be 'stdio' or 'http'`);
    process.exit(1);
  }

  try {
    let server;

    if (transport === "http") {
      server = await launchHttpServer();
    } else {
      server = await launchMcpStdioServer();
    }

    // Handle graceful shutdown
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      try {
        if (transport === "express") {
          // Express server shutdown
          await new Promise<void>(resolve => {
            (server as any).close(() => {
              logger.info("Express server closed");
              resolve();
            });
          });
        } else {
          // MCP server shutdown
          await (server as any).close();
          logger.info("MCP server closed");
        }
        process.exit(0);
      } catch (error) {
        logger.error({ error }, "Error during shutdown");
        process.exit(1);
      }
    };

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

async function runSyncAndReport(options: {
  detailed?: boolean;
  path?: string;
  color?: boolean;
  syncEnabled: boolean;
  configOptions?: ConfigOptions;
}) {
  // Configure logger for non-server usage
  configureLogger("http");

  if (options.color === false) {
    chalk.level = 0;
  }

  try {
    // Create config service to get configuration
    const configService = new ConfigService(options.configOptions);
    await configService.initialize();
    const config = configService.getConfig();

    // Use database path from config, with optional override from CLI
    const dbPath =
      options.path ||
      expandTilde(config.database.path || path.join(process.cwd(), "data", "superclaude.json"));
    const databaseService = new DatabaseService(dbPath);

    // Always initialize database before use
    await databaseService.initialize();

    // Perform sync if enabled
    if (options.syncEnabled) {
      console.log(chalk.blue("Starting GitHub sync..."));

      const sourceLoader = SourceLoaderFactory.create(config.source);
      const syncService = new SyncService(sourceLoader, databaseService);

      try {
        await syncService.syncFromSource();
        console.log(chalk.green("Sync completed successfully"));
      } catch (error) {
        console.error(chalk.yellow("Warning: Sync failed, but will still generate report:"), error);
        // Continue to report generation even if sync fails
      }
    }

    // Generate report
    const reportGenerator = new SyncReportGenerator(databaseService);

    const report = options.detailed
      ? await reportGenerator.generateDetailedReport()
      : await reportGenerator.generateReport();

    console.log(report);
  } catch (error) {
    console.error(chalk.red("Error:"), error);
    process.exit(1);
  }
}

async function runReport(options: {
  detailed?: boolean;
  path?: string;
  color?: boolean;
  configOptions?: ConfigOptions;
}) {
  await runSyncAndReport({ ...options, syncEnabled: false });
}

async function runSync(options: {
  detailed?: boolean;
  path?: string;
  color?: boolean;
  configOptions?: ConfigOptions;
}) {
  await runSyncAndReport({ ...options, syncEnabled: true });
}

async function runConfigInit(): Promise<void> {
  configureLogger("http");

  try {
    const configService = new ConfigService();
    const configPath = configService.getCurrentConfigFilePath();

    // Check if config already exists
    if (fs.existsSync(configPath)) {
      console.log(chalk.yellow(`Configuration file already exists at: ${configPath}`));
      console.log(chalk.yellow("Use 'config reset' to reset to defaults"));
      return;
    }

    // Save default config
    await configService.saveUserConfig();
    console.log(chalk.green(`Configuration initialized at: ${configPath}`));
    console.log(chalk.gray("You can now edit this file to customize your configuration"));
  } catch (error) {
    console.error(chalk.red("Error initializing configuration:"), error);
    process.exit(1);
  }
}

async function runConfigShow(configOptions?: ConfigOptions): Promise<void> {
  configureLogger("http");

  try {
    const configService = new ConfigService(configOptions);
    await configService.initialize();
    const config = configService.getConfig();
    const configPath = configService.getCurrentConfigFilePath();

    console.log(chalk.blue("Current Configuration:"));
    console.log(chalk.gray(`Config file: ${configPath}`));
    console.log();
    console.log(JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(chalk.red("Error showing configuration:"), error);
    process.exit(1);
  }
}

async function runConfigSet(key: string, value: string): Promise<void> {
  configureLogger("http");

  try {
    const configService = new ConfigService();
    await configService.initialize();

    // Parse the key path and value
    const keyParts = key.split(".");
    const parsedValue =
      value === "true"
        ? true
        : value === "false"
          ? false
          : !isNaN(Number(value))
            ? Number(value)
            : value;

    // Build update object
    const update: any = {};
    let current = update;
    for (let i = 0; i < keyParts.length - 1; i++) {
      current[keyParts[i]] = {};
      current = current[keyParts[i]];
    }
    current[keyParts[keyParts.length - 1]] = parsedValue;

    // Update and save config
    await configService.updateConfig(update, true);
    console.log(chalk.green(`Configuration updated: ${key} = ${value}`));
  } catch (error) {
    console.error(chalk.red("Error setting configuration:"), error);
    process.exit(1);
  }
}

async function runConfigReset(deleteFile: boolean): Promise<void> {
  configureLogger("http");

  try {
    const configService = new ConfigService();
    await configService.resetConfig(deleteFile);

    if (deleteFile) {
      console.log(chalk.green("Configuration reset to defaults and file deleted"));
    } else {
      console.log(chalk.green("Configuration reset to defaults"));
    }
  } catch (error) {
    console.error(chalk.red("Error resetting configuration:"), error);
    process.exit(1);
  }
}

async function main() {
  const program = new Command();

  program
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version)
    .option("--source-type <type>", "Data source type (local or remote)")
    .option("--source-path <path>", "Path for local source")
    .option("--source-url <url>", "URL for remote source")
    .option("--source-branch <branch>", "Branch for remote source")
    .option("--persist-config", "Save configuration to home directory");

  // Server command (default)
  program
    .command("server", { isDefault: true })
    .description("Start the SuperClaude MCP server")
    .option("-t, --transport <type>", "transport type (stdio or http)", "stdio")
    .action(async (options, cmd) => {
      // Get global options from parent command
      const globalOpts = cmd.parent.opts();

      // Set environment variables for config options
      if (globalOpts.sourceType) process.env.SC_SOURCE_TYPE = globalOpts.sourceType;
      if (globalOpts.sourcePath) process.env.SC_SOURCE_PATH = globalOpts.sourcePath;
      if (globalOpts.sourceUrl) process.env.SC_SOURCE_URL = globalOpts.sourceUrl;
      if (globalOpts.sourceBranch) process.env.SC_SOURCE_BRANCH = globalOpts.sourceBranch;

      await runServer(options.transport);
    });

  // Report command
  program
    .command("report")
    .description("Generate a report of recently synced data")
    .option("-d, --detailed", "Detailed report with full schema validation")
    .option("-p, --path <path>", "Custom database path")
    .option("--no-color", "Disable colored output")
    .action(async (options, cmd) => {
      // Get global options from parent command
      const globalOpts = cmd.parent.opts();

      // Build config options from global flags
      const configOptions: ConfigOptions = {};
      if (globalOpts.sourceType) configOptions.sourceType = globalOpts.sourceType;
      if (globalOpts.sourcePath) configOptions.sourcePath = globalOpts.sourcePath;
      if (globalOpts.sourceUrl) configOptions.sourceUrl = globalOpts.sourceUrl;
      if (globalOpts.sourceBranch) configOptions.sourceBranch = globalOpts.sourceBranch;

      await runReport({ ...options, configOptions });
    });

  // Sync command
  program
    .command("sync")
    .description("Sync data from GitHub and generate a report")
    .option("-d, --detailed", "Detailed report with full schema validation")
    .option("-p, --path <path>", "Custom database path")
    .option("--no-color", "Disable colored output")
    .action(async (options, cmd) => {
      // Get global options from parent command
      const globalOpts = cmd.parent.opts();

      // Build config options from global flags
      const configOptions: ConfigOptions = {};
      if (globalOpts.sourceType) configOptions.sourceType = globalOpts.sourceType;
      if (globalOpts.sourcePath) configOptions.sourcePath = globalOpts.sourcePath;
      if (globalOpts.sourceUrl) configOptions.sourceUrl = globalOpts.sourceUrl;
      if (globalOpts.sourceBranch) configOptions.sourceBranch = globalOpts.sourceBranch;

      await runSync({ ...options, configOptions });
    });

  // Config command with subcommands
  const configCmd = program.command("config").description("Manage SuperClaude MCP configuration");

  configCmd
    .command("init")
    .description("Initialize default configuration file")
    .action(runConfigInit);

  configCmd
    .command("show")
    .description("Show current configuration")
    .action(async (options, cmd) => {
      // Get global options from parent's parent command
      const globalOpts = cmd.parent.parent.opts();

      // Build config options from global flags
      const configOptions: ConfigOptions = {};
      if (globalOpts.sourceType) configOptions.sourceType = globalOpts.sourceType;
      if (globalOpts.sourcePath) configOptions.sourcePath = globalOpts.sourcePath;
      if (globalOpts.sourceUrl) configOptions.sourceUrl = globalOpts.sourceUrl;
      if (globalOpts.sourceBranch) configOptions.sourceBranch = globalOpts.sourceBranch;
      if (globalOpts.persistConfig) configOptions.persistConfig = globalOpts.persistConfig;

      await runConfigShow(configOptions);
    });

  configCmd
    .command("set <key> <value>")
    .description("Set a configuration value")
    .action(runConfigSet);

  configCmd
    .command("reset")
    .description("Reset configuration to defaults")
    .option("--delete", "Also delete the configuration file")
    .action(async options => {
      await runConfigReset(options.delete || false);
    });

  await program.parseAsync();
}

main().catch(error => {
  logger.error({ error }, "Unhandled error in main");
  process.exit(1);
});
