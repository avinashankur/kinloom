import { z } from "zod";

export const editPersonSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  gender: z.enum(["male", "female"]),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),
  deathDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

export type EditPersonFormValues = z.infer<typeof editPersonSchema>;
