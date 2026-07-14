import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import { familyTreeExportSchema } from "../schemas/export-schema";

export type ImportResult =
  | { ok: true; snapshot: FamilyTreeSnapshot }
  | { ok: false; error: string };

export async function importTree(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const raw = JSON.parse(text);
    const parsed = familyTreeExportSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid file format: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      };
    }

    const { tree, people, partnerships, parentChildRelationships } =
      parsed.data;

    return {
      ok: true,
      snapshot: { tree, people, partnerships, parentChildRelationships },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to parse file",
    };
  }
}
