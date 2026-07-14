import { z } from "zod";

export const addRelationshipSchema = z.object({
  relationshipType: z.enum(["parent", "child", "spouse"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
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
  partnershipStatus: z
    .enum(["married", "divorced", "widowed"])
    .optional(),
  includeSpouseAsParent: z.boolean().optional(),
  notes: z.string().optional(),
});

export type AddRelationshipFormValues = z.infer<typeof addRelationshipSchema>;
