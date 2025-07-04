import { z } from "zod";

export const PersonaSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  instructions: z.string().min(1),
});

export const PersonaModelSchema = PersonaSchema.extend({
  id: z.string().min(1),
  lastUpdated: z.coerce.date(),
  hash: z.string().min(1),
});

export type Persona = z.infer<typeof PersonaSchema>;
export type PersonaModel = z.infer<typeof PersonaModelSchema>;
