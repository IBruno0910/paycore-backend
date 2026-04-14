import { z } from "zod";

export const createTransferSchema = z.object({
  sourceAccountId: z.string().uuid("Source account ID must be a valid UUID"),
  destinationAccountId: z.string().uuid("Destination account ID must be a valid UUID"),
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().max(255).trim().optional(),
});