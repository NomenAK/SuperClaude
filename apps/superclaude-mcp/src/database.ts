// Re-export from models for backward compatibility
export type {
  CommandModel,
  PersonaModel,
  RuleModel,
  SyncMetadata,
  DatabaseSchema,
  UnparsedFile,
} from "./models/index.js";
import type { DatabaseSchema } from "./models/index.js";

export const DEFAULT_DATABASE_SCHEMA = (): DatabaseSchema => ({
  commands: [],
  personas: [],
  rules: [],
  syncMetadata: {
    lastSync: new Date(0),
    syncStatus: "success",
  },
  unparsedFiles: [],
});
