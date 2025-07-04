import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DatabaseService } from "../database-service.js";
import {
  CommandModelSchema,
  PersonaModelSchema,
  RuleModelSchema,
  DatabaseSchemaSchema,
} from "@/schemas.js";
import {
  createMockCommand,
  createMockPersona,
  getMockCommands,
  getMockPersonas,
} from "@tests/mocks/data.js";
import { createTestDatabase } from "@tests/utils/test-helpers.js";

describe("DatabaseService", () => {
  let dbService: DatabaseService;
  let testDbPath: string;

  beforeEach(async () => {
    // Create a completely isolated database for each test
    const testDb = await createTestDatabase();
    dbService = testDb.dbService;
    testDbPath = testDb.dbPath;
  });

  afterEach(async () => {
    // Close the database connection
    await dbService.close();
  });

  describe("initialize", () => {
    it.skip("should create database file if it does not exist", async () => {
      // Not applicable for in-memory databases
      expect(true).toBe(true);
    });

    it("should not reinitialize if already initialized", async () => {
      // Try to initialize again
      await dbService.initialize();

      // Should still be able to use the database
      const commands = await dbService.getAllCommands();
      expect(commands).toEqual([]);
    });
  });

  describe("commands", () => {
    describe("upsertCommand", () => {
      it("should insert new command", async () => {
        const command = createMockCommand({
          id: "test-1",
          name: "test-command",
          description: "Test description",
        });

        await dbService.upsertCommand(command);

        const commands = await dbService.getAllCommands();
        expect(commands).toHaveLength(1);
        expect(commands[0].id).toBe("test-1");
        expect(commands[0].name).toBe("test-command");
        expect(commands[0].description).toBe("Test description");
      });

      it("should update existing command", async () => {
        const command = createMockCommand({
          id: "test-1",
          name: "test-command",
          description: "Original description",
        });

        await dbService.upsertCommand(command);

        // Update the command
        const updatedCommand = { ...command, description: "Updated description" };
        await dbService.upsertCommand(updatedCommand);

        const commands = await dbService.getAllCommands();
        expect(commands).toHaveLength(1);
        expect(commands[0].description).toBe("Updated description");
      });

      it("should validate command with Zod schema", async () => {
        const command = createMockCommand();
        await dbService.upsertCommand(command);

        const commands = await dbService.getAllCommands();
        const result = CommandModelSchema.safeParse(commands[0]);
        expect(result.success).toBe(true);
      });
    });

    describe("upsertCommands", () => {
      it("should insert multiple commands", async () => {
        const commands = [
          createMockCommand({ id: "cmd-1", name: "command-1" }),
          createMockCommand({ id: "cmd-2", name: "command-2" }),
        ];

        await dbService.upsertCommands(commands);

        const savedCommands = await dbService.getAllCommands();
        expect(savedCommands).toHaveLength(2);
        expect(savedCommands.map(c => c.id).sort()).toEqual(["cmd-1", "cmd-2"]);
      });

      it("should update existing commands", async () => {
        const commands = [
          createMockCommand({ id: "cmd-1", name: "command-1", description: "Original 1" }),
          createMockCommand({ id: "cmd-2", name: "command-2", description: "Original 2" }),
        ];

        await dbService.upsertCommands(commands);

        // Update the commands
        const updatedCommands = commands.map(cmd => ({
          ...cmd,
          description: `Updated: ${cmd.description}`,
        }));

        await dbService.upsertCommands(updatedCommands);

        const savedCommands = await dbService.getAllCommands();
        expect(savedCommands).toHaveLength(2);
        savedCommands.forEach(cmd => {
          expect(cmd.description).toContain("Updated:");
        });
      });
    });

    describe("getAllCommands", () => {
      it("should return empty array when no commands exist", async () => {
        const commands = await dbService.getAllCommands();
        expect(commands).toEqual([]);
      });

      it("should return all commands with ISO8601 dates", async () => {
        const testCommands = [
          createMockCommand({ id: "cmd-1" }),
          createMockCommand({ id: "cmd-2" }),
          createMockCommand({ id: "cmd-3" }),
        ];

        await dbService.upsertCommands(testCommands);

        const commands = await dbService.getAllCommands();
        expect(commands).toHaveLength(3);

        commands.forEach(cmd => {
          expect(cmd.lastUpdated).toBeInstanceOf(Date);
          expect(cmd.lastUpdated.toISOString()).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          );
        });
      });
    });
  });

  describe("personas", () => {
    describe("upsertPersona", () => {
      it("should insert new persona", async () => {
        const persona = createMockPersona({
          id: "persona-1",
          name: "Test Persona",
          description: "Test description",
        });

        await dbService.upsertPersona(persona);

        const personas = await dbService.getAllPersonas();
        expect(personas).toHaveLength(1);
        expect(personas[0].id).toBe("persona-1");
        expect(personas[0].name).toBe("Test Persona");
      });

      it("should update existing persona", async () => {
        const persona = createMockPersona({
          id: "persona-1",
          name: "Test Persona",
          description: "Original description",
        });

        await dbService.upsertPersona(persona);

        // Update the persona
        const updatedPersona = { ...persona, description: "Updated description" };
        await dbService.upsertPersona(updatedPersona);

        const personas = await dbService.getAllPersonas();
        expect(personas).toHaveLength(1);
        expect(personas[0].description).toBe("Updated description");
      });

      it("should validate persona with Zod schema", async () => {
        const persona = createMockPersona();
        await dbService.upsertPersona(persona);

        const personas = await dbService.getAllPersonas();
        const result = PersonaModelSchema.safeParse(personas[0]);
        expect(result.success).toBe(true);
      });
    });

    describe("upsertPersonas", () => {
      it("should insert multiple personas", async () => {
        const personas = [
          createMockPersona({ id: "p-1", name: "Persona 1" }),
          createMockPersona({ id: "p-2", name: "Persona 2" }),
        ];

        await dbService.upsertPersonas(personas);

        const savedPersonas = await dbService.getAllPersonas();
        expect(savedPersonas).toHaveLength(2);
        expect(savedPersonas.map(p => p.id).sort()).toEqual(["p-1", "p-2"]);
      });
    });

    describe("getAllPersonas", () => {
      it("should return empty array when no personas exist", async () => {
        const personas = await dbService.getAllPersonas();
        expect(personas).toEqual([]);
      });
    });
  });

  describe("rules", () => {
    describe("upsertRule", () => {
      it("should insert new rule", async () => {
        const rule = {
          id: "rule1",
          name: "rule1",
          content: "Content 1",
          lastUpdated: new Date(),
          hash: "rule1-hash",
        };

        await dbService.upsertRule(rule);

        const savedRules = await dbService.getAllRules();
        expect(savedRules).toHaveLength(1);
        expect(savedRules[0].id).toBe("rule1");
        expect(savedRules[0].content).toBe("Content 1");
      });

      it("should update existing rule", async () => {
        const rule = {
          id: "rule1",
          name: "rule1",
          content: "Original content",
          lastUpdated: new Date(),
          hash: "rule1-hash",
        };

        await dbService.upsertRule(rule);

        // Update the rule
        const updatedRule = {
          ...rule,
          content: "Updated content",
          hash: "rule1-hash-updated",
        };

        await dbService.upsertRule(updatedRule);

        const savedRules = await dbService.getAllRules();
        expect(savedRules).toHaveLength(1);
        expect(savedRules[0].content).toBe("Updated content");
      });

      it("should validate rule with Zod schema", async () => {
        const rule = {
          id: "rule1",
          name: "rule1",
          content: "Content 1",
          lastUpdated: new Date(),
          hash: "rule1-hash",
        };
        await dbService.upsertRule(rule);

        const savedRules = await dbService.getAllRules();
        const result = RuleModelSchema.safeParse(savedRules[0]);
        expect(result.success).toBe(true);
      });
    });

    describe("upsertRules", () => {
      it("should insert multiple rules", async () => {
        const rules = [
          {
            id: "rule1",
            name: "rule1",
            content: "Content 1",
            lastUpdated: new Date(),
            hash: "rule1-hash",
          },
          {
            id: "rule2",
            name: "rule2",
            content: "Content 2",
            lastUpdated: new Date(),
            hash: "rule2-hash",
          },
        ];

        await dbService.upsertRules(rules);

        const savedRules = await dbService.getAllRules();
        expect(savedRules).toHaveLength(2);
        expect(savedRules.map(r => r.id).sort()).toEqual(["rule1", "rule2"]);
      });
    });

    describe("getAllRules", () => {
      it("should return empty array when no rules exist", async () => {
        const rules = await dbService.getAllRules();
        expect(rules).toEqual([]);
      });

      it("should return all rules", async () => {
        const rules = [
          {
            id: "rule1",
            name: "rule1",
            content: "Content 1",
            lastUpdated: new Date(),
            hash: "rule1-hash",
          },
          {
            id: "rule2",
            name: "rule2",
            content: "Content 2",
            lastUpdated: new Date(),
            hash: "rule2-hash",
          },
        ];

        await dbService.upsertRules(rules);

        const savedRules = await dbService.getAllRules();
        expect(savedRules).toHaveLength(2);
        expect(savedRules.map(r => r.name).sort()).toEqual(["rule1", "rule2"]);
      });
    });
  });

  describe("sync metadata", () => {
    it("should update sync metadata", async () => {
      const now = new Date();
      await dbService.updateSyncMetadata("success", "All synced");

      // Read the database to get sync metadata
      await dbService["db"].read();
      const metadata = dbService["db"].data.syncMetadata;

      expect(metadata.syncStatus).toBe("success");
      expect(metadata.errorMessage).toBe("All synced");
      expect(new Date(metadata.lastSync).getTime()).toBeGreaterThanOrEqual(now.getTime());
    });
  });

  describe("clearAll", () => {
    it("should clear all data", async () => {
      // Add some data
      await dbService.upsertCommand(createMockCommand());
      await dbService.upsertPersona(createMockPersona());
      const rule = {
        id: "rule1",
        name: "rule1",
        content: "Content 1",
        lastUpdated: new Date(),
        hash: "rule1-hash",
      };
      await dbService.upsertRule(rule);

      // Clear all data
      await dbService.clearAll();

      // Verify everything is cleared
      const commands = await dbService.getAllCommands();
      const personas = await dbService.getAllPersonas();
      const rules = await dbService.getAllRules();

      expect(commands).toEqual([]);
      expect(personas).toEqual([]);
      expect(rules).toEqual([]);
    });
  });

  describe("validate database schema", () => {
    it("should validate entire database with Zod schema", async () => {
      // Add some data
      await dbService.upsertCommands(getMockCommands());
      await dbService.upsertPersonas(getMockPersonas());
      // Create mock rules in new format
      const mockRules = [
        {
          id: "rule1",
          name: "rule1",
          content: "Content 1",
          lastUpdated: new Date(),
          hash: "rule1-hash",
        },
        {
          id: "rule2",
          name: "rule2",
          content: "Content 2",
          lastUpdated: new Date(),
          hash: "rule2-hash",
        },
      ];
      await dbService.upsertRules(mockRules);

      // Read the raw database
      await dbService["db"].read();
      const db = dbService["db"].data;

      // Validate with schema
      const result = DatabaseSchemaSchema.safeParse(db);
      if (!result.success) {
        console.error("Schema validation failed:", result.error.errors);
      }
      expect(result.success).toBe(true);
    });
  });
});
