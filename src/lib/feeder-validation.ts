import { z } from "zod";

export const feederMutationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(160),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacityGrams: z.number().int().positive().max(100000),
  notes: z.string().trim().max(1000).default(""),
  cleanStatus: z.enum(["CLEAN", "NEEDS_CLEANING"]),
  fillStatus: z.enum(["FILLED", "LOW", "EMPTY"]),
  assignedUserId: z.string().min(1),
  fillPercent: z.number().int().min(0).max(100).optional(),
  weightGrams: z.number().int().nonnegative().optional()
});

export type FeederMutationInput = z.infer<typeof feederMutationSchema>;
