import crypto from "crypto";
import { ISourceLoader } from "@/sources/index.js";
import { DatabaseService } from "@services/database-service.js";
import { CommandModel, PersonaModel, RuleModel } from "@database";
import logger from "@logger";

export class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor(
    private readonly sourceLoader: ISourceLoader,
    private readonly databaseService: DatabaseService,
    private readonly syncIntervalMinutes: number = 30
  ) {}

  private getSourceType(): "local" | "remote" {
    // Check if the source loader has a getSourceInfo method
    if ("getSourceInfo" in this.sourceLoader) {
      const info = (this.sourceLoader as any).getSourceInfo();
      return info.type;
    }
    return "remote"; // Default to remote for backward compatibility
  }

  private generateHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  private async syncCommands(): Promise<number> {
    const commands = await this.sourceLoader.loadCommands();
    logger.debug({ commandCount: commands.length }, "Loaded commands from source");

    const commandModels: CommandModel[] = [];
    let updatedCount = 0;

    const existingCommands = await this.databaseService.getAllCommands();

    for (const command of commands) {
      const id = command.name;
      const hash = this.generateHash(JSON.stringify(command));

      const existing = existingCommands.find(c => c.id === id);

      const isNew = !existing;
      const hasChanged = existing && existing.hash !== hash;

      if (isNew || hasChanged) {
        updatedCount++;
      }

      commandModels.push({
        ...command,
        id,
        hash,
        lastUpdated: existing && existing.hash === hash ? existing.lastUpdated : new Date(),
      });
    }

    logger.debug({ modelsToUpsert: commandModels.length }, "Upserting command models");
    await this.databaseService.upsertCommands(commandModels);

    return updatedCount;
  }

  private async syncPersonas(): Promise<number> {
    const personas = await this.sourceLoader.loadPersonas();
    const personaModels: PersonaModel[] = [];
    let updatedCount = 0;

    const existingPersonas = await this.databaseService.getAllPersonas();

    for (const persona of personas) {
      const id = persona.name;
      const hash = this.generateHash(JSON.stringify(persona));

      const existing = existingPersonas.find(p => p.id === id);

      const isNew = !existing;
      const hasChanged = existing && existing.hash !== hash;

      if (isNew || hasChanged) {
        updatedCount++;
      }

      personaModels.push({
        ...persona,
        id,
        hash,
        lastUpdated: existing && existing.hash === hash ? existing.lastUpdated : new Date(),
      });
    }

    await this.databaseService.upsertPersonas(personaModels);

    return updatedCount;
  }

  private async syncRules(): Promise<number> {
    const rulesData = await this.sourceLoader.loadRules();

    // If no rules loaded, nothing to sync
    if (!rulesData?.rules) {
      logger.debug("No rules to sync");
      return 0;
    }

    const ruleModels: RuleModel[] = [];
    let updatedCount = 0;

    const existingRules = await this.databaseService.getAllRules();

    for (const rule of rulesData.rules) {
      const id = rule.name; // Use rule name as ID like personas
      const hash = this.generateHash(JSON.stringify(rule));

      const existing = existingRules.find(r => r.id === id);

      const isNew = !existing;
      const hasChanged = existing && existing.hash !== hash;

      if (isNew || hasChanged) {
        updatedCount++;
      }

      ruleModels.push({
        ...rule,
        id,
        hash,
        lastUpdated: existing && existing.hash === hash ? existing.lastUpdated : new Date(),
      });
    }

    await this.databaseService.upsertRules(ruleModels);

    return updatedCount;
  }

  async syncFromSource(): Promise<void> {
    if (this.isSyncing) {
      logger.warn("Sync already in progress, skipping");
      return;
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      logger.info("Starting data sync from source");

      let commandsUpdated = 0;
      let personasUpdated = 0;
      let rulesUpdated = 0;
      const errors: string[] = [];
      const allUnparsedFiles: any[] = [];

      // Run sync operations sequentially to avoid database write conflicts
      try {
        commandsUpdated = await this.syncCommands();

        // Collect unparsed files from commands load
        if (this.sourceLoader.getUnparsedFiles) {
          const unparsed = this.sourceLoader.getUnparsedFiles();
          allUnparsedFiles.push(...unparsed.map(f => ({ ...f, source: this.getSourceType() })));
        }
      } catch (error) {
        logger.error({ error }, "Failed to sync commands");
        errors.push(`Commands: ${error instanceof Error ? error.message : "Unknown error"}`);
      }

      try {
        personasUpdated = await this.syncPersonas();

        // Collect unparsed files from personas load
        if (this.sourceLoader.getUnparsedFiles) {
          const unparsed = this.sourceLoader.getUnparsedFiles();
          allUnparsedFiles.push(...unparsed.map(f => ({ ...f, source: this.getSourceType() })));
        }
      } catch (error) {
        logger.error({ error }, "Failed to sync personas");
        errors.push(`Personas: ${error instanceof Error ? error.message : "Unknown error"}`);
      }

      try {
        rulesUpdated = await this.syncRules();

        // Collect unparsed files from rules load
        if (this.sourceLoader.getUnparsedFiles) {
          const unparsed = this.sourceLoader.getUnparsedFiles();
          allUnparsedFiles.push(...unparsed.map(f => ({ ...f, source: this.getSourceType() })));
        }
      } catch (error) {
        logger.error({ error }, "Failed to sync rules");
        errors.push(`Rules: ${error instanceof Error ? error.message : "Unknown error"}`);
      }

      // Save unparsed files to database
      if (allUnparsedFiles.length > 0) {
        await this.databaseService.upsertUnparsedFiles(allUnparsedFiles);
        logger.warn({ count: allUnparsedFiles.length }, "Found unparsed files during sync");
      } else {
        await this.databaseService.clearUnparsedFiles();
      }

      if (errors.length > 0) {
        await this.databaseService.updateSyncMetadata("failed", errors.join("; "));

        logger.error(
          {
            commandsUpdated,
            personasUpdated,
            rulesUpdated,
            failures: errors.length,
            durationMs: Date.now() - startTime,
          },
          "Data sync completed with errors"
        );
      } else {
        await this.databaseService.updateSyncMetadata("success");

        const duration = Date.now() - startTime;
        logger.info(
          {
            commandsUpdated,
            personasUpdated,
            rulesUpdated,
            unparsedFiles: allUnparsedFiles.length,
            durationMs: duration,
          },
          "Data sync completed successfully"
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await this.databaseService.updateSyncMetadata("failed", errorMessage);

      logger.error({ error, durationMs: Date.now() - startTime }, "Data sync failed");
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  async loadFromDatabase(): Promise<{
    commands: CommandModel[];
    personas: Record<string, PersonaModel>;
    rules: RuleModel[];
  }> {
    const commands = await this.databaseService.getAllCommands();
    const personasList = await this.databaseService.getAllPersonas();
    const rules = await this.databaseService.getAllRules();

    const personas: Record<string, PersonaModel> = {};
    for (const persona of personasList) {
      personas[persona.id] = persona;
    }

    return { commands, personas, rules };
  }

  /**
   * @deprecated Use syncFromSource() instead
   */
  async syncFromGitHub(): Promise<void> {
    return this.syncFromSource();
  }

  startPeriodicSync(): void {
    if (this.syncInterval) {
      logger.warn("Periodic sync already started");
      return;
    }

    const intervalMs = this.syncIntervalMinutes * 60 * 1000;

    // Set up interval to run sync periodically (not immediately)
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncFromSource();
      } catch (error) {
        logger.error({ error }, "Periodic sync failed");
      }
    }, intervalMs);

    logger.info({ intervalMinutes: this.syncIntervalMinutes }, "Started periodic data sync");
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info("Stopped periodic data sync");
    }
  }
}
