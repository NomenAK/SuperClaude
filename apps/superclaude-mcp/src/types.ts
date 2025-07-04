// Re-export types from models for backward compatibility
export type { Command as SuperClaudeCommand, CommandModel } from "./models/command.model.js";
export type { Persona, PersonaModel } from "./models/persona.model.js";
export type { Rule, RuleModel } from "./models/rules.model.js";
export type { SyncMetadata } from "./models/sync.model.js";
export type { DatabaseSchema } from "./models/database.model.js";

// SuperClaudeRules type for the MCP server interface
import { Rule } from "./models/rules.model.js";

export interface SuperClaudeRules {
  rules: Rule[];
}

// Legacy interface for backward compatibility
export interface CommandArgument {
  name: string;
  description: string;
  required: boolean;
}
