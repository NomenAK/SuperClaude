import { z } from "zod";

export const SyncMetadataSchema = z.object({
  lastSync: z.coerce.date(),
  syncStatus: z.enum(["success", "failed"]),
  errorMessage: z.string().optional(),
});

export type SyncMetadata = z.infer<typeof SyncMetadataSchema>;
