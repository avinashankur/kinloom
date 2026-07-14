import type { ParentChildRelationship } from "@/entities/relationship/model/parent-child-relationship";

export function getParents(
  personId: string,
  relationships: ParentChildRelationship[],
): string[] {
  return relationships
    .filter((r) => r.childId === personId)
    .map((r) => r.parentId);
}

export function getChildren(
  personId: string,
  relationships: ParentChildRelationship[],
): string[] {
  return relationships
    .filter((r) => r.parentId === personId)
    .map((r) => r.childId);
}
