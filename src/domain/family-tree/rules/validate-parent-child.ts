import type { ParentChildRelationship } from "@/entities/relationship/model/parent-child-relationship";
import { wouldCreateCycle } from "./detect-cycle";

export type ParentChildValidationError =
  | "SELF_PARENT"
  | "DUPLICATE_RELATIONSHIP"
  | "CYCLE_DETECTED"
  | "CROSS_TREE";

export function validateParentChild(
  parentId: string,
  childId: string,
  treeId: string,
  existing: ParentChildRelationship[],
): ParentChildValidationError | null {
  if (parentId === childId) return "SELF_PARENT";

  const sameTree = existing.every((r) => r.treeId === treeId);
  if (!sameTree) return "CROSS_TREE";

  const duplicate = existing.some(
    (r) => r.parentId === parentId && r.childId === childId,
  );
  if (duplicate) return "DUPLICATE_RELATIONSHIP";

  if (wouldCreateCycle(parentId, childId, existing)) return "CYCLE_DETECTED";

  return null;
}
