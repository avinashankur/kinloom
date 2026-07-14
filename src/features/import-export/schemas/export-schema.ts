import { z } from "zod";

const personSchema = z.object({
  id: z.string(),
  treeId: z.string(),
  firstName: z.string(),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  gender: z.enum(["male", "female"]),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const partnershipSchema = z.object({
  id: z.string(),
  treeId: z.string(),
  personAId: z.string(),
  personBId: z.string(),
  status: z.enum(["married", "divorced", "widowed"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const parentChildSchema = z.object({
  id: z.string(),
  treeId: z.string(),
  parentId: z.string(),
  childId: z.string(),
  createdAt: z.string(),
});

const treeSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const familyTreeExportSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  tree: treeSchema,
  people: z.array(personSchema),
  partnerships: z.array(partnershipSchema),
  parentChildRelationships: z.array(parentChildSchema),
});

export type FamilyTreeExport = z.infer<typeof familyTreeExportSchema>;
