import type { ParentChildRelationship } from "@/entities/relationship/model/parent-child-relationship";

/**
 * Returns true if adding parentId → childId would create a cycle.
 * Uses DFS to detect if childId can already reach parentId through
 * the existing parent-child graph.
 */
export function wouldCreateCycle(
  parentId: string,
  childId: string,
  relationships: ParentChildRelationship[],
): boolean {
  if (parentId === childId) return true;

  // Build adjacency: child → parents
  const parentMap = new Map<string, string[]>();
  for (const rel of relationships) {
    const existing = parentMap.get(rel.childId) ?? [];
    existing.push(rel.parentId);
    parentMap.set(rel.childId, existing);
  }

  // DFS: can we reach parentId starting from childId going UP?
  const visited = new Set<string>();
  const stack = [childId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === parentId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const parents = parentMap.get(current) ?? [];
    for (const p of parents) stack.push(p);
  }

  return false;
}
