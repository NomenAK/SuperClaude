// Re-export from models for backward compatibility
export {
  CommandSchema as SuperClaudeCommandSchema,
  CommandModelSchema,
  type Command,
  type CommandModel,
} from "./models/command.model.js";

export {
  PersonaSchema,
  PersonaModelSchema,
  type Persona,
  type PersonaModel,
} from "./models/persona.model.js";

export { RuleModelSchema, RuleSchema, type Rule, type RuleModel } from "./models/rules.model.js";

// SuperClaudeRules schema for the MCP server interface
import { z } from "zod";
import { RuleSchema } from "./models/rules.model.js";

export const SuperClaudeRulesSchema = z.object({
  rules: z.array(RuleSchema),
});

export { SyncMetadataSchema, type SyncMetadata } from "./models/sync.model.js";

export { DatabaseSchemaSchema, type DatabaseSchema } from "./models/database.model.js";
