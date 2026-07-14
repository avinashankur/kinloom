import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import type {
  LayoutGraph,
  LayoutNode,
  LayoutEdge,
} from "@/infrastructure/layout/tree-layout-engine";

const PERSON_NODE_WIDTH = 120;
const PERSON_NODE_HEIGHT = 90;
const UNION_NODE_WIDTH = 16;
const UNION_NODE_HEIGHT = 16;

/**
 * Converts a FamilyTreeSnapshot into a LayoutGraph with virtual union nodes.
 *
 * Each partnership becomes a virtual "union" node that sits between the two
 * spouses and acts as the parent source for their shared children.
 *
 * Structure:
 *   [Person A] ─── [Union] ─── [Person B]
 *                     │
 *                  [Child]
 */
export function projectFamilyGraph(snapshot: FamilyTreeSnapshot): LayoutGraph {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const edgeIds = new Set<string>();

  const addEdge = (sourceId: string, targetId: string) => {
    const id = `e-${sourceId}-${targetId}`;
    if (!edgeIds.has(id)) {
      edgeIds.add(id);
      edges.push({ id, sourceId, targetId });
    }
  };

  // Add a person node for every person
  for (const person of snapshot.people) {
    nodes.push({
      id: person.id,
      kind: "person",
      personId: person.id,
      width: PERSON_NODE_WIDTH,
      height: PERSON_NODE_HEIGHT,
    });
  }

  // Add a virtual union node for every partnership
  for (const partnership of snapshot.partnerships) {
    const unionId = `union-${partnership.id}`;
    nodes.push({
      id: unionId,
      kind: "union",
      partnershipId: partnership.id,
      width: UNION_NODE_WIDTH,
      height: UNION_NODE_HEIGHT,
    });

    // Connect both spouses to the union node
    addEdge(partnership.personAId, unionId);
    addEdge(partnership.personBId, unionId);
  }

  // For each child, find their parents and connect via union nodes where possible
  for (const person of snapshot.people) {
    const parentIds = snapshot.parentChildRelationships
      .filter((r) => r.childId === person.id)
      .map((r) => r.parentId);

    if (parentIds.length === 0) continue;

    if (parentIds.length === 2) {
      // Find if there's a partnership between these two parents
      const partnership = snapshot.partnerships.find(
        (p) =>
          (p.personAId === parentIds[0] && p.personBId === parentIds[1]) ||
          (p.personAId === parentIds[1] && p.personBId === parentIds[0]),
      );

      if (partnership) {
        // Connect through union node
        const unionId = `union-${partnership.id}`;
        addEdge(unionId, person.id);
      } else {
        // No partnership — connect directly from each parent
        for (const parentId of parentIds) {
          addEdge(parentId, person.id);
        }
      }
    } else {
      // Single parent or 3+ parents — connect directly
      for (const parentId of parentIds) {
        addEdge(parentId, person.id);
      }
    }
  }

  // Handle people with no partnerships — connect directly to children
  // (already handled above)

  // Remove union nodes that have no children edges going out of them
  // (partnerships without shared children still appear, just floating)

  return { nodes, edges };
}
