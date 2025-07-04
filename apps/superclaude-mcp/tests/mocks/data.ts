import {
  CommandModel,
  PersonaModel,
  RuleModel,
  DatabaseSchema,
  SyncMetadata,
} from "../../src/database.js";
import { faker } from "@faker-js/faker";
import crypto from "crypto";

// Helper to create consistent hashes for test data
function createHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function createMockCommand(overrides?: Partial<CommandModel>): CommandModel {
  const id = overrides?.id || faker.string.uuid();
  const name = overrides?.name || "mock-command";
  const description = overrides?.description || "A mock command for testing";
  const prompt = overrides?.prompt || "This is a mock prompt for testing purposes";
  const args = overrides?.arguments || [];

  const content = `${name}-${description}-${prompt}-${JSON.stringify(args)}`;

  return {
    id,
    name,
    description,
    prompt,
    arguments: args,
    lastUpdated: overrides?.lastUpdated || new Date(),
    hash: overrides?.hash || createHash(content),
    ...overrides,
  };
}

export function createMockPersona(overrides?: Partial<PersonaModel>): PersonaModel {
  const id = overrides?.id || faker.string.uuid();
  const name = overrides?.name || "Mock Persona";
  const description = overrides?.description || "A mock persona for testing";
  const instructions =
    overrides?.instructions || "You are a mock persona used for testing purposes.";

  const content = `${name}-${description}-${instructions}`;

  return {
    id,
    name,
    description,
    instructions,
    lastUpdated: overrides?.lastUpdated || new Date(),
    hash: overrides?.hash || createHash(content),
    ...overrides,
  };
}

export function createMockRule(overrides?: Partial<RuleModel>): RuleModel {
  const name = overrides?.name || faker.lorem.word();
  const content = overrides?.content || faker.lorem.sentence();
  const id = overrides?.id || name;

  return {
    id,
    name,
    content,
    lastUpdated: overrides?.lastUpdated || new Date(),
    hash: overrides?.hash || createHash(JSON.stringify({ name, content })),
    ...overrides,
  };
}

export function createMockSyncMetadata(overrides?: Partial<SyncMetadata>): SyncMetadata {
  return {
    lastSync: overrides?.lastSync || new Date(),
    syncStatus: overrides?.syncStatus || "success",
    errorMessage: overrides?.errorMessage,
    ...overrides,
  };
}

export function createMockDatabase(overrides?: Partial<DatabaseSchema>): DatabaseSchema {
  return {
    commands: [],
    personas: [],
    rules: [],
    syncMetadata: createMockSyncMetadata({ syncStatus: "success" }),
    ...overrides,
  };
}

// Factory functions that create fresh instances every time they're called
export function getMockCommands(): CommandModel[] {
  return [
    createMockCommand({
      id: faker.string.uuid(),
      name: "test-command",
      description: "A test command",
      prompt: "This is a test prompt with $ARGUMENT",
      arguments: [
        {
          name: "ARGUMENT",
          description: "Test argument",
          required: true,
        },
      ],
    }),
    createMockCommand({
      id: faker.string.uuid(),
      name: "simple",
      description: "A simple command",
      prompt: "Simple prompt without arguments",
    }),
  ];
}

export function getMockPersonas(): PersonaModel[] {
  return [
    createMockPersona({
      id: faker.string.uuid(),
      name: "Developer",
      description: "A helpful developer persona",
      instructions: "You are a helpful developer who writes clean code.",
    }),
    createMockPersona({
      id: faker.string.uuid(),
      name: "Software Architect",
      description: "System design expert",
      instructions: "You focus on high-level system design and architecture patterns.",
    }),
  ];
}

export function getMockRules(): RuleModel[] {
  return [
    createMockRule({
      id: "safety",
      name: "safety",
      content: "Always prioritize safety and security",
    }),
    createMockRule({
      id: "clarity",
      name: "clarity",
      content: "Be clear and concise in communication",
    }),
  ];
}

// Remove legacy exports to force use of factory functions
// export const mockCommands = getMockCommands();
// export const mockPersonas = getMockPersonas();
// export const mockRules = getMockRules();
