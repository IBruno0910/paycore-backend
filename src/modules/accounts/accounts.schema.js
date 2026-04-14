import { z } from "zod";

export const createAccountSchema = z.object({
  alias: z
    .string()
    .min(3, "Alias must be at least 3 characters long")
    .max(50, "Alias must be at most 50 characters long")
    .trim(),

  currency: z
    .string()
    .min(3, "Currency is required")
    .max(10, "Currency must be at most 10 characters long")
    .transform((value) => value.toUpperCase().trim()),
});