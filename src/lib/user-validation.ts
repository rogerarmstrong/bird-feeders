import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  feederIds: z.array(z.string()).default([])
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  feederIds: z.array(z.string()).default([])
});
