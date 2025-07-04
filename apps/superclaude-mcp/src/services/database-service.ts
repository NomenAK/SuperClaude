import { LowSync, MemorySync } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import path from "path";
import fs from "fs/promises";
import {
  DatabaseSchema,
  DEFAULT_DATABASE_SCHEMA,
  CommandModel,
  PersonaModel,
  RuleModel,
  UnparsedFile,
} from "@database";
import logger from "@logger";

export class DatabaseService {
  // ! It's critical to use LowSync because the async version fails frequently
  // ! when trying to make updates to the database (fails to rename temp file to main file).
  private db: LowSync<DatabaseSchema>;
  private initialized: boolean = false;

  constructor(
    private readonly dbPath: string = path.join(process.cwd(), "data", "superclaude.json"),
    private readonly adapter?: JSONFileSync<DatabaseSchema> | MemorySync<DatabaseSchema> // ! Only should use MemorySync for testing
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      let adapterToUse: JSONFileSync<DatabaseSchema> | MemorySync<DatabaseSchema>;

      if (this.adapter) {
        // Use provided adapter (e.g., for testing)
        adapterToUse = this.adapter;
      } else {
        // Use file adapter for production
        // Always ensure the directory exists before creating the adapter
        const dbDir = path.dirname(this.dbPath);
        try {
          await fs.access(dbDir);
        } catch (error) {
          // Directory doesn't exist, create it
          await fs.mkdir(dbDir, { recursive: true, mode: 0o755 });
          logger.info({ dbDir }, "Created database directory");
        }
        adapterToUse = new JSONFileSync<DatabaseSchema>(this.dbPath);
      }

      this.db = new LowSync(adapterToUse, DEFAULT_DATABASE_SCHEMA());

      this.db.read();

      // LowDB sets data to the default if file doesn't exist
      // Always write to ensure file is created (only for file adapters)
      if (!this.adapter) {
        this.db.write();
      }

      this.initialized = true;
      logger.info({ dbPath: this.dbPath }, "Database initialized");
    } catch (error) {
      logger.error({ error, dbPath: this.dbPath }, "Failed to initialize database");
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
  }

  async upsertCommand(command: CommandModel): Promise<void> {
    this.ensureInitialized();

    const index = this.db.data!.commands.findIndex(c => c.id === command.id);
    if (index >= 0) {
      this.db.data!.commands[index] = command;
    } else {
      this.db.data!.commands.push(command);
    }

    this.db.write();
    logger.debug({ commandId: command.id }, "Command upserted");
  }

  async upsertCommands(commands: CommandModel[]): Promise<void> {
    this.ensureInitialized();

    // Read latest data before modifying
    this.db.read();

    for (const command of commands) {
      const index = this.db.data!.commands.findIndex(c => c.id === command.id);
      if (index >= 0) {
        this.db.data!.commands[index] = command;
      } else {
        this.db.data!.commands.push(command);
      }
    }

    this.db.write();
    logger.debug({ count: commands.length }, "Commands upserted");
  }

  async upsertPersona(persona: PersonaModel): Promise<void> {
    this.ensureInitialized();

    const index = this.db.data!.personas.findIndex(p => p.id === persona.id);
    if (index >= 0) {
      this.db.data!.personas[index] = persona;
    } else {
      this.db.data!.personas.push(persona);
    }

    this.db.write();
    logger.debug({ personaId: persona.id }, "Persona upserted");
  }

  async upsertPersonas(personas: PersonaModel[]): Promise<void> {
    this.ensureInitialized();

    // Read latest data before modifying
    this.db.read();

    for (const persona of personas) {
      const index = this.db.data!.personas.findIndex(p => p.id === persona.id);
      if (index >= 0) {
        this.db.data!.personas[index] = persona;
      } else {
        this.db.data!.personas.push(persona);
      }
    }

    this.db.write();
    logger.debug({ count: personas.length }, "Personas upserted");
  }

  async upsertRule(rule: RuleModel): Promise<void> {
    this.ensureInitialized();

    // Read latest data before modifying
    this.db.read();

    const index = this.db.data!.rules.findIndex(r => r.id === rule.id);
    if (index >= 0) {
      this.db.data!.rules[index] = rule;
    } else {
      this.db.data!.rules.push(rule);
    }

    this.db.write();
    logger.debug({ ruleId: rule.id }, "Rule upserted");
  }

  async upsertRules(rules: RuleModel[]): Promise<void> {
    this.ensureInitialized();

    // Read latest data before modifying
    this.db.read();

    for (const rule of rules) {
      const index = this.db.data!.rules.findIndex(r => r.id === rule.id);
      if (index >= 0) {
        this.db.data!.rules[index] = rule;
      } else {
        this.db.data!.rules.push(rule);
      }
    }

    this.db.write();
    logger.debug({ count: rules.length }, "Rules upserted");
  }

  async getAllCommands(): Promise<CommandModel[]> {
    this.ensureInitialized();
    this.db.read();
    return (this.db.data!.commands || []).map(cmd => ({
      ...cmd,
      lastUpdated: new Date(cmd.lastUpdated),
    }));
  }

  async getAllPersonas(): Promise<PersonaModel[]> {
    this.ensureInitialized();
    this.db.read();
    return (this.db.data!.personas || []).map(persona => ({
      ...persona,
      lastUpdated: new Date(persona.lastUpdated),
    }));
  }

  async getAllRules(): Promise<RuleModel[]> {
    this.ensureInitialized();
    this.db.read();
    return (this.db.data!.rules || []).map(rule => ({
      ...rule,
      lastUpdated: new Date(rule.lastUpdated),
    }));
  }

  async getLastSync(): Promise<Date> {
    this.ensureInitialized();
    this.db.read();
    return new Date(this.db.data!.syncMetadata.lastSync);
  }

  async updateSyncMetadata(status: "success" | "failed", errorMessage?: string): Promise<void> {
    this.ensureInitialized();

    this.db.data!.syncMetadata = {
      lastSync: new Date(),
      syncStatus: status,
      errorMessage,
    };

    this.db.write();
    logger.info({ status, errorMessage }, "Sync metadata updated");
  }

  async upsertUnparsedFiles(files: UnparsedFile[]): Promise<void> {
    this.ensureInitialized();

    // Initialize unparsedFiles array if it doesn't exist
    if (!this.db.data!.unparsedFiles) {
      this.db.data!.unparsedFiles = [];
    }

    // Clear existing unparsed files and add new ones
    this.db.data!.unparsedFiles = files;

    this.db.write();
    logger.debug({ count: files.length }, "Unparsed files updated");
  }

  async getUnparsedFiles(): Promise<UnparsedFile[]> {
    this.ensureInitialized();
    this.db.read();

    if (!this.db.data!.unparsedFiles) {
      return [];
    }

    return this.db.data!.unparsedFiles.map(file => ({
      ...file,
      timestamp: new Date(file.timestamp),
    }));
  }

  async clearUnparsedFiles(): Promise<void> {
    this.ensureInitialized();

    this.db.data!.unparsedFiles = [];
    this.db.write();
    logger.debug("Unparsed files cleared");
  }

  async clearAll(): Promise<void> {
    this.ensureInitialized();

    this.db.data = DEFAULT_DATABASE_SCHEMA();
    this.db.write();
    logger.info("Database cleared");
  }

  async close(): Promise<void> {
    if (this.initialized && this.db) {
      // Ensure all pending writes are completed
      this.db.write();
      this.initialized = false;
      logger.debug("Database connection closed");
    }
  }
}
