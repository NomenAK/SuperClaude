import { vi, afterEach, beforeEach, afterAll, beforeAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Mock logger to reduce noise in tests
vi.mock("../src/logger.js", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Ensure tests run in isolation
beforeAll(async () => {
  // Copy snapshot data from SuperClaude database to test location
  const sourceDbPath = path.join(os.homedir(), ".superclaude", "data", "db.json");
  const targetSnapshotPath = path.join(process.cwd(), "tests", "data", "snapshot.db.json");

  try {
    // Ensure target directory exists
    await fs.mkdir(path.dirname(targetSnapshotPath), { recursive: true });

    // Copy the database file if it exists
    await fs.access(sourceDbPath);
    await fs.copyFile(sourceDbPath, targetSnapshotPath);
    console.log("Snapshot data copied successfully");
  } catch (error) {
    console.warn("Could not copy snapshot data - run 'pnpm run sync:snapshot' first:", error);
  }

  // Clean up any existing test data
  const fixturesDir = path.join(process.cwd(), "tests", "fixtures");
  const tempDir = path.join(fixturesDir, "temp");
  const dataDir = path.join(process.cwd(), "data");

  try {
    // Only clean JSON files, not the directory structure to avoid race conditions
    const files = await fs.readdir(fixturesDir);
    for (const file of files) {
      if (file.endsWith(".json")) {
        await fs.unlink(path.join(fixturesDir, file));
      }
    }
  } catch (error) {
    // Directory might not exist, that's fine
  }

  // Ensure fixtures/temp directory exists (this is safe to call multiple times)
  await fs.mkdir(tempDir, { recursive: true });

  try {
    const files = await fs.readdir(dataDir);
    for (const file of files) {
      if (file.endsWith(".json") && !file.includes("backup")) {
        await fs.unlink(path.join(dataDir, file));
      }
    }
  } catch (error) {
    // Directory might not exist
  }
});

// Clean up test fixtures before each test
beforeEach(async () => {
  const fixturesDir = path.join(process.cwd(), "tests", "fixtures");
  const tempDir = path.join(fixturesDir, "temp");

  // Only clean JSON files, not the directory structure
  try {
    const files = await fs.readdir(fixturesDir);
    for (const file of files) {
      if (file.endsWith(".json")) {
        await fs.unlink(path.join(fixturesDir, file));
      }
    }
  } catch (error) {
    // Directory might not exist, that's fine
  }

  // Clean temp directory contents but keep the directory
  try {
    const tempFiles = await fs.readdir(tempDir);
    for (const file of tempFiles) {
      await fs.unlink(path.join(tempDir, file));
    }
  } catch (error) {
    // Directory might not exist, that's fine
  }

  // Ensure directories exist
  await fs.mkdir(tempDir, { recursive: true });

  // Also clean up any data files that might interfere with tests
  const dataDir = path.join(process.cwd(), "data");
  try {
    const files = await fs.readdir(dataDir);
    for (const file of files) {
      if (file.endsWith(".json") && !file.includes("backup")) {
        await fs.unlink(path.join(dataDir, file));
      }
    }
  } catch (error) {
    // Directory might not exist, that's fine
  }
});

// Clean up after each test
afterEach(async () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  const fixturesDir = path.join(process.cwd(), "tests", "fixtures");
  const tempDir = path.join(fixturesDir, "temp");

  // Clean up test files but keep directory structure
  try {
    const files = await fs.readdir(fixturesDir);
    for (const file of files) {
      if (file.endsWith(".json")) {
        await fs.unlink(path.join(fixturesDir, file));
      }
    }
  } catch (error) {
    // Directory might not exist, that's fine
  }

  try {
    const tempFiles = await fs.readdir(tempDir);
    for (const file of tempFiles) {
      await fs.unlink(path.join(tempDir, file));
    }
  } catch (error) {
    // Directory might not exist, that's fine
  }

  // Restore backup if exists
  const dataDir = path.join(process.cwd(), "data");
  const backupPath = path.join(dataDir, "superclaude.json.backup");
  const originalPath = path.join(dataDir, "superclaude.json");
  try {
    await fs.access(backupPath);
    await fs.rename(backupPath, originalPath);
  } catch (error) {
    // Backup might not exist, that's fine
  }
});
