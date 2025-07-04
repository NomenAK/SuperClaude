import { DatabaseService } from "../../src/services/database-service.js";
import { MemorySync } from "lowdb";
import { DatabaseSchema, DEFAULT_DATABASE_SCHEMA } from "../../src/database.js";
import { randomBytes } from "crypto";

/**
 * Creates a completely isolated DatabaseService instance for testing.
 * Uses in-memory storage to ensure complete isolation and avoid file system issues.
 */
export async function createTestDatabase(): Promise<{
  dbService: DatabaseService;
  dbPath: string;
}> {
  // Generate a unique identifier for debugging purposes
  const timestamp = Date.now();
  const random = randomBytes(8).toString("hex");
  const processId = process.pid;
  const nanoTime = process.hrtime.bigint().toString();

  const dbPath = `in-memory-test-db-${timestamp}-${processId}-${random}-${nanoTime}`;

  // Create an in-memory adapter
  const memoryAdapter = new MemorySync<DatabaseSchema>();

  // Create the database service with in-memory adapter
  const dbService = new DatabaseService(dbPath, memoryAdapter);

  // Initialize the database
  await dbService.initialize();

  // Debug: log the database identifier being used
  console.log(`Test database created: ${dbPath}`);

  return { dbService, dbPath };
}

/**
 * Helper to wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Helper to verify database is empty
 */
export async function verifyEmptyDatabase(dbService: DatabaseService): Promise<boolean> {
  const commands = await dbService.getAllCommands();
  const personas = await dbService.getAllPersonas();
  const rules = await dbService.getAllRules();

  return commands.length === 0 && personas.length === 0 && rules.length === 0;
}
