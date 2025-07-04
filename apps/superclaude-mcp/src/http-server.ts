import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import path from "path";
import os from "os";
import logger from "@logger";
import { ISourceLoader, SourceLoaderFactory } from "@/sources/index.js";
import { DatabaseService } from "@services/database-service.js";
import { SyncService } from "@services/sync-service.js";
import { ConfigService, ConfigOptions } from "@services/config-service.js";
import { SuperClaudeCommand, Persona, SuperClaudeRules } from "@types";
import { createMCPServer } from "@/mcp.js";

// Helper function to expand tilde in paths
function expandTilde(filepath: string): string {
  if (filepath.startsWith("~/")) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  return filepath;
}

class SuperClaudeMCPServer {
  private configService: ConfigService;
  private sourceLoader: ISourceLoader;
  private databaseService: DatabaseService;
  private syncService: SyncService;
  private personas: Record<string, Persona> = {};
  private commands: SuperClaudeCommand[] = [];
  private rules: SuperClaudeRules | null = null;

  constructor(configOptions?: ConfigOptions) {
    this.configService = new ConfigService(configOptions);
    // Initialize will be called asynchronously
    this.initialize();
  }

  private async initialize() {
    try {
      // Initialize configuration
      await this.configService.initialize();
      const config = this.configService.getConfig();

      // Create source loader based on configuration
      this.sourceLoader = SourceLoaderFactory.create(config.source);

      // Initialize database
      const dbPath = expandTilde(
        config.database.path || path.join(process.cwd(), "data", "superclaude.json")
      );
      this.databaseService = new DatabaseService(dbPath);
      await this.databaseService.initialize();

      // Create sync service with configured source loader
      this.syncService = new SyncService(
        this.sourceLoader,
        this.databaseService,
        config.sync.intervalMinutes
      );

      // Try to load from database first
      const dbData = await this.syncService.loadFromDatabase();

      if (
        dbData.commands.length === 0 &&
        dbData.personas &&
        Object.keys(dbData.personas).length === 0
      ) {
        // Database is empty, do initial sync
        logger.info("Database empty, performing initial sync from source");
        await this.syncService.syncFromSource();
        await this.loadFromDatabase();
      } else {
        // Load from database
        await this.loadFromDatabase();

        // Check if we need to sync on startup
        if (config.sync.onStartup) {
          const lastSync = await this.databaseService.getLastSync();
          const timeSinceLastSync = Date.now() - lastSync.getTime();
          const syncIntervalMs = config.sync.intervalMinutes * 60 * 1000;

          if (timeSinceLastSync > syncIntervalMs) {
            logger.info(
              {
                lastSync: lastSync.toISOString(),
                intervalMinutes: config.sync.intervalMinutes,
              },
              "Last sync exceeded interval, syncing from source"
            );
            this.syncService.syncFromSource().catch(error => {
              logger.error({ error }, "Background sync failed");
            });
          }
        }
      }

      // Start periodic sync if enabled
      if (config.sync.enabled) {
        logger.info(
          { intervalMinutes: config.sync.intervalMinutes },
          "Auto sync is enabled, starting periodic sync"
        );
        this.syncService.startPeriodicSync();
      } else {
        logger.info("Auto sync is disabled (configure sync.enabled=true to enable)");
      }
    } catch (error) {
      logger.error({ error }, "Failed to initialize server");
    }
  }

  async triggerSync(): Promise<void> {
    await this.syncService.syncFromSource();
    await this.loadFromDatabase();
  }

  private async loadFromDatabase() {
    try {
      const { commands, personas, rules } = await this.syncService.loadFromDatabase();

      // Convert CommandModel[] to SuperClaudeCommand[]
      this.commands = commands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        prompt: cmd.prompt,
        messages: cmd.messages,
        arguments: cmd.arguments,
      }));

      // Convert PersonaModel record to Persona record
      this.personas = {};
      for (const [id, personaModel] of Object.entries(personas)) {
        this.personas[id] = {
          name: personaModel.name,
          description: personaModel.description,
          instructions: personaModel.instructions,
        };
      }

      // Convert RuleModel[] to Rules format expected by MCP
      this.rules =
        rules && rules.length > 0
          ? {
              rules: rules.map(r => ({ name: r.name, content: r.content })),
            }
          : null;

      // Count rules
      const rulesCount = rules?.length || 0;

      logger.info(
        {
          commandsCount: this.commands.length,
          personasCount: Object.keys(this.personas).length,
          rulesCount,
        },
        "Successfully loaded data from database"
      );
    } catch (error) {
      logger.error({ error }, "Failed to load data from database");
    }
  }

  createInstance(): McpServer {
    return createMCPServer(
      this.commands,
      this.personas,
      this.rules,
      this.sourceLoader,
      this.triggerSync.bind(this)
    );
  }
}

// Create a lazy singleton instance
let serverInstance: SuperClaudeMCPServer | null = null;

export function getServerInstance(): SuperClaudeMCPServer {
  if (!serverInstance) {
    serverInstance = new SuperClaudeMCPServer();
  }
  return serverInstance;
}

export default {
  get createInstance() {
    return getServerInstance().createInstance.bind(getServerInstance());
  },
  get triggerSync() {
    return getServerInstance().triggerSync.bind(getServerInstance());
  },
};
