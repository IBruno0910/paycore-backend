import { z } from "zod";

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters long")
    .max(50, "First name must be at most 50 characters long"),

  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters long")
    .max(50, "Last name must be at most 50 characters long"),

  email: z
    .string()
    .email("Invalid email address")
    .transform((value) => value.toLowerCase().trim()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be at most 100 characters long"),

  role: z
    .string()
    .min(2, "Role is required"),

  companyId: z
    .string()
    .uuid("Company ID must be a valid UUID"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((value) => value.toLowerCase().trim()),

  password: z
    .string()
    .min(1, "Password is required"),
});