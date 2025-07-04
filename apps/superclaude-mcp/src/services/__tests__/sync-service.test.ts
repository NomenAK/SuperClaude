import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SyncService } from "../sync-service.js";
import { DatabaseService } from "../database-service.js";
import { GitHubSourceLoader } from "@/sources/index.js";
import { createMockCommand, createMockPersona, createMockRule } from "@tests/mocks/data.js";
import { createTestDatabase } from "@tests/utils/test-helpers.js";
import {
  convertCommandModelToCommand,
  convertPersonaModelToPersona,
} from "@tests/utils/snapshot-loader.js";

vi.mock("@/sources/index.js");

describe("SyncService", () => {
  let syncService: SyncService;
  let databaseService: DatabaseService;
  let githubLoader: GitHubSourceLoader;

  beforeEach(async () => {
    // Create a completely isolated database for each test
    const testDb = await createTestDatabase();
    databaseService = testDb.dbService;

    // Verify database starts empty
    const commands = await databaseService.getAllCommands();
    const personas = await databaseService.getAllPersonas();
    const rules = await databaseService.getAllRules();
    expect(commands).toHaveLength(0);
    expect(personas).toHaveLength(0);
    expect(rules).toHaveLength(0);

    // Create mocked GitHubLoader
    githubLoader = {
      loadCommands: vi.fn() as any,
      loadPersonas: vi.fn() as any,
      loadRules: vi.fn() as any,
      loadSharedIncludes: vi.fn() as any,
    } as any;

    // Create sync service with mocked dependencies
    syncService = new SyncService(githubLoader, databaseService, 30);
  });

  afterEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe("syncFromGitHub", () => {
    it("should sync commands, personas, and rules from GitHub", async () => {
      // Create test data - ensure ID matches name for commands
      const mockCommandModels = [
        createMockCommand({ id: "command-1", name: "command-1" }),
        createMockCommand({ id: "command-2", name: "command-2" }),
      ];

      const mockPersonaModels = [
        createMockPersona({ id: "persona-1", name: "Persona 1" }),
        createMockPersona({ id: "persona-2", name: "Persona 2" }),
      ];

      const mockRuleModels = [
        createMockRule({ id: "rule1", name: "rule1", content: "Content 1" }),
        createMockRule({ id: "rule2", name: "rule2", content: "Content 2" }),
      ];

      // Convert to GitHub loader format
      const mockCommands = mockCommandModels.map(cmd => convertCommandModelToCommand(cmd));
      const mockPersonas = mockPersonaModels.map(p => convertPersonaModelToPersona(p));
      const mockRules = {
        rules: mockRuleModels.map(r => ({ name: r.name, content: r.content })),
      };

      // Mock GitHub loader responses
      (githubLoader.loadCommands as any).mockResolvedValue(mockCommands);
      (githubLoader.loadPersonas as any).mockResolvedValue(mockPersonas);
      (githubLoader.loadRules as any).mockResolvedValue(mockRules);

      // Execute sync
      await syncService.syncFromGitHub();

      // Verify data was synced to database
      const commands = await databaseService.getAllCommands();
      const personas = await databaseService.getAllPersonas();
      const rules = await databaseService.getAllRules();

      expect(commands).toHaveLength(2);
      expect(personas).toHaveLength(2);
      expect(rules).toHaveLength(2);
    });

    it.skip("should skip sync if already in progress", async () => {
      // Mock GitHub loader to take time
      (githubLoader.loadCommands as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      // Start two syncs concurrently
      const sync1 = syncService.syncFromGitHub();
      const sync2 = syncService.syncFromGitHub();

      // Both should complete without error
      await expect(sync1).resolves.not.toThrow();
      await expect(sync2).resolves.not.toThrow();

      // GitHub loader should only be called once
      expect(githubLoader.loadCommands).toHaveBeenCalledTimes(1);
    });

    it("should only update changed items based on hash", async () => {
      // Insert initial data - ID will be the command name
      const existingCommand = createMockCommand({
        id: "existing-cmd",
        name: "existing-cmd",
        description: "Original description",
        hash: "original-hash",
      });
      await databaseService.upsertCommand(existingCommand);

      // Mock GitHub response with one changed and one new command
      // Note: convertCommandModelToCommand strips the hash, so we need the raw command
      const changedCommand = {
        name: "existing-cmd",
        description: "Modified description",
        prompt: existingCommand.prompt,
        arguments: existingCommand.arguments,
        messages: existingCommand.messages,
      };

      const newCommand = {
        name: "new-cmd",
        description: "New command",
        prompt: "New prompt",
        arguments: undefined as any,
        messages: undefined as any,
      };

      (githubLoader.loadCommands as any).mockResolvedValue([changedCommand, newCommand]);
      (githubLoader.loadPersonas as any).mockResolvedValue([]);
      (githubLoader.loadRules as any).mockResolvedValue(null);

      // Execute sync
      await syncService.syncFromGitHub();

      // Verify updates
      const commands = await databaseService.getAllCommands();
      expect(commands).toHaveLength(2);

      const updatedCommand = commands.find(c => c.id === "existing-cmd");
      expect(updatedCommand?.description).toBe("Modified description");

      const addedCommand = commands.find(c => c.id === "new-cmd");
      expect(addedCommand).toBeDefined();
    });

    it("should handle partial failures gracefully", async () => {
      // Mock commands to succeed
      (githubLoader.loadCommands as any).mockResolvedValue([]);

      // Mock personas to fail
      (githubLoader.loadPersonas as any).mockRejectedValue(new Error("Network error"));

      // Mock rules to succeed
      (githubLoader.loadRules as any).mockResolvedValue(null);

      // Sync should not throw
      await expect(syncService.syncFromGitHub()).resolves.not.toThrow();

      // Verify sync metadata reflects failure
      await databaseService["db"].read();
      const metadata = databaseService["db"].data.syncMetadata;
      expect(metadata.syncStatus).toBe("failed");
      expect(metadata.errorMessage).toContain("Network error");
    });
  });

  describe("loadFromDatabase", () => {
    it("should load all data from database", async () => {
      // Insert test data
      const commands = [createMockCommand({ id: "cmd-1" }), createMockCommand({ id: "cmd-2" })];
      const personas = [createMockPersona({ id: "p-1" }), createMockPersona({ id: "p-2" })];
      const rules = [
        createMockRule({ id: "rule1", name: "rule1", content: "Content 1" }),
        createMockRule({ id: "rule2", name: "rule2", content: "Content 2" }),
      ];

      await databaseService.upsertCommands(commands);
      await databaseService.upsertPersonas(personas);
      await databaseService.upsertRules(rules);

      // Load from database
      const data = await syncService.loadFromDatabase();

      expect(data.commands).toHaveLength(2);
      expect(Object.keys(data.personas)).toHaveLength(2);
      expect(data.rules).not.toBeNull();
    });

    it("should return personas as a record keyed by id", async () => {
      const personas = [
        createMockPersona({ id: "architect", name: "Architect" }),
        createMockPersona({ id: "developer", name: "Developer" }),
      ];

      await databaseService.upsertPersonas(personas);

      const data = await syncService.loadFromDatabase();

      expect(data.personas["architect"]).toBeDefined();
      expect(data.personas["architect"].name).toBe("Architect");
      expect(data.personas["developer"]).toBeDefined();
      expect(data.personas["developer"].name).toBe("Developer");
    });

    it("should return empty array for rules if none exist", async () => {
      const data = await syncService.loadFromDatabase();

      expect(data.commands).toEqual([]);
      expect(data.personas).toEqual({});
      expect(data.rules).toEqual([]);
    });
  });

  describe("periodic sync", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should start periodic sync with correct interval", async () => {
      const syncIntervalMinutes = 5;

      // Mock GitHub loader before creating service
      (githubLoader.loadCommands as any).mockResolvedValue([]);
      (githubLoader.loadPersonas as any).mockResolvedValue({});
      (githubLoader.loadRules as any).mockResolvedValue(null);

      const service = new SyncService(githubLoader, databaseService, syncIntervalMinutes);

      // Start periodic sync
      service.startPeriodicSync();

      // Periodic sync should be started but not called yet
      expect(githubLoader.loadCommands).not.toHaveBeenCalled();

      // Advance time by sync interval
      await vi.advanceTimersByTimeAsync(syncIntervalMinutes * 60 * 1000);

      // Should have synced once
      expect(githubLoader.loadCommands).toHaveBeenCalledTimes(1);

      // Advance time by another interval
      await vi.advanceTimersByTimeAsync(syncIntervalMinutes * 60 * 1000);

      // Should have synced again
      expect(githubLoader.loadCommands).toHaveBeenCalledTimes(2);

      service.stopPeriodicSync();
    });

    it("should stop periodic sync", async () => {
      const service = new SyncService(githubLoader, databaseService, 1);

      // Mock GitHub loader
      (githubLoader.loadCommands as any).mockResolvedValue([]);
      (githubLoader.loadPersonas as any).mockResolvedValue({});
      (githubLoader.loadRules as any).mockResolvedValue(null);

      service.startPeriodicSync();
      service.stopPeriodicSync();

      // Clear initial call count
      (githubLoader.loadCommands as any).mockClear();

      // Advance time - no more syncs should happen
      await vi.advanceTimersByTimeAsync(60 * 1000);

      expect(githubLoader.loadCommands).not.toHaveBeenCalled();
    });
  });

  describe("hash-based change detection", () => {
    it("should detect changes in command content", async () => {
      // Insert initial command - ID must match name for sync to work
      const command = createMockCommand({
        id: "test-cmd",
        name: "test-cmd",
        prompt: "Original prompt",
        hash: "original-hash",
      });
      await databaseService.upsertCommand(command);

      // Mock GitHub response with modified command (without hash field)
      const modifiedCommand = {
        name: "test-cmd",
        description: command.description,
        prompt: "Modified prompt",
        arguments: command.arguments,
        messages: command.messages,
      };

      (githubLoader.loadCommands as any).mockResolvedValue([modifiedCommand]);
      (githubLoader.loadPersonas as any).mockResolvedValue({});
      (githubLoader.loadRules as any).mockResolvedValue(null);

      // Sync
      await syncService.syncFromGitHub();

      // Verify update
      const commands = await databaseService.getAllCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].prompt).toBe("Modified prompt");
    });

    it("should not update if hash is unchanged", async () => {
      const originalDate = new Date("2024-01-01");

      // Create the command data that will be returned from GitHub
      const githubCommand = {
        name: "test",
        description: "Test description",
        prompt: "Test prompt",
        arguments: [] as any[],
        messages: undefined as any,
      };

      // Calculate the hash that will be generated for this command
      const crypto = await import("crypto");
      const expectedHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(githubCommand))
        .digest("hex");

      // Insert command with the calculated hash and specific date - ID must match name
      const command = createMockCommand({
        id: "test",
        name: "test",
        description: githubCommand.description,
        prompt: githubCommand.prompt,
        arguments: githubCommand.arguments,
        lastUpdated: originalDate,
        hash: expectedHash,
      });
      await databaseService.upsertCommand(command);

      // Mock GitHub response with exact same content
      (githubLoader.loadCommands as any).mockResolvedValue([githubCommand]);
      (githubLoader.loadPersonas as any).mockResolvedValue({});
      (githubLoader.loadRules as any).mockResolvedValue(null);

      // Sync
      await syncService.syncFromGitHub();

      // Verify date hasn't changed
      const commands = await databaseService.getAllCommands();
      expect(commands[0].lastUpdated.toISOString()).toBe(originalDate.toISOString());
    });
  });
});
