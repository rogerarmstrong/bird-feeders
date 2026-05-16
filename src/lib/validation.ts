import { z } from "zod";

export const telemetrySchema = z.object({
  serialNumber: z.string().min(3),
  fillPercent: z.number().int().min(0).max(100),
  weightGrams: z.number().int().nonnegative(),
  status: z.enum(["ONLINE", "DEGRADED", "OFFLINE"]).default("ONLINE"),
  measuredAt: z.coerce.date().optional()
});

export const visitSchema = z.object({
  feederId: z.string().min(1),
  species: z.string().min(1),
  count: z.number().int().positive().default(1),
  confidence: z.number().min(0).max(1),
  durationSeconds: z.number().int().positive(),
  imageUrl: z.string().url().optional(),
  observedAt: z.coerce.date().optional()
});

export const alertSchema = z.object({
  feederId: z.string().min(1),
  type: z.enum(["LOW_FEED", "CONNECTIVITY", "MAINTENANCE"]),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
  message: z.string().min(3),
  resolved: z.boolean().default(false)
});
