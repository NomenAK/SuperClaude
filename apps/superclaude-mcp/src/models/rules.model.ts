import { z } from "zod";

// Individual rule schema
export const RuleSchema = z.object({
  name: z.string(),
  content: z.string(),
});

// Rule model with tracking info (similar to PersonaModel)
export const RuleModelSchema = RuleSchema.extend({
  id: z.string().min(1),
  lastUpdated: z.coerce.date(),
  hash: z.string().min(1),
});

export type Rule = z.infer<typeof RuleSchema>;
export type RuleModel = z.infer<typeof RuleModelSchema>;
