import { z } from "zod";

export const CommandSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  prompt: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      })
    )
    .optional(),
  arguments: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        required: z.boolean(),
      })
    )
    .optional(),
});

export const CommandModelSchema = CommandSchema.extend({
  id: z.string().min(1),
  lastUpdated: z.coerce.date(),
  hash: z.string().min(1),
});

export type Command = z.infer<typeof CommandSchema>;
export type CommandModel = z.infer<typeof CommandModelSchema>;
