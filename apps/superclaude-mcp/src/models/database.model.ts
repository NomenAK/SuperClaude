import { z } from "zod";
import { CommandModelSchema } from "./command.model.js";
import { PersonaModelSchema } from "./persona.model.js";
import { RuleModelSchema } from "./rules.model.js";
import { SyncMetadataSchema } from "./sync.model.js";

export const UnparsedFileSchema = z.object({
  path: z.string(),
  error: z.string(),
  timestamp: z.coerce.date(),
  source: z.enum(["local", "remote"]).optional(),
});

export const DatabaseSchemaSchema = z.object({
  commands: z.array(CommandModelSchema),
  personas: z.array(PersonaModelSchema),
  rules: z.array(RuleModelSchema),
  syncMetadata: SyncMetadataSchema,
  unparsedFiles: z.array(UnparsedFileSchema).optional(),
});

export type UnparsedFile = z.infer<typeof UnparsedFileSchema>;
export type DatabaseSchema = z.infer<typeof DatabaseSchemaSchema>;
