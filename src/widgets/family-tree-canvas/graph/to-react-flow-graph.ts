import type { Node, Edge } from "@xyflow/react";
import type { PositionedGraph } from "@/infrastructure/layout/tree-layout-engine";
import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import { PERSON_W, PERSON_H, UNION_SIZE } from "../config/constants";


export type PersonNodeData = {
  label: string;
  personId: string;
  gender: "male" | "female";
  isDeceased: boolean;
  birthYear?: string;
};

export type UnionNodeData = {
  partnershipId: string;
  status: "married" | "divorced" | "widowed";
};

/**
 * Final adapter: PositionedGraph → React Flow nodes + edges.
 *
 * Edges are typed as 'familyEdge' (custom renderer):
 *  - spouse edges  carry { edgeType: 'spouse', strokeColor, isDashed }
 *  - child  edges  carry { edgeType: 'child',  strokeColor, isDashed, siblingCXs }
 */
export function toReactFlowGraph(
  positioned: PositionedGraph,
  snapshot: FamilyTreeSnapshot,
): { nodes: Node[]; edges: Edge[] } {
  const personMap = new Map(snapshot.people.map((p) => [p.id, p]));
  const partnershipMap = new Map(snapshot.partnerships.map((p) => [p.id, p]));

  // ── nodes ─────────────────────────────────────────────────────────────────
  const nodes: Node[] = positioned.nodes.map((n) => {
    if (n.kind === "person") {
      const person = personMap.get(n.personId!);
      const data: PersonNodeData = {
        label: person
          ? `${person.firstName}${person.lastName ? ` ${person.lastName}` : ""}`
          : "Unknown",
        personId: n.personId!,
        gender: person?.gender ?? "male",
        isDeceased: !!person?.deathDate,
        birthYear: person?.birthDate?.split("-")[0],
      };
      return {
        id: n.id,
        type: "personNode",
        position: { x: n.x, y: n.y },
        data,
        draggable: false,
        // Size hints so React Flow knows bounding box
        width: PERSON_W,
        height: PERSON_H,
      };
    }

    // union node
    const partnership = partnershipMap.get(n.partnershipId!);
    const data: UnionNodeData = {
      partnershipId: n.partnershipId!,
      status: partnership?.status ?? "married",
    };
    return {
      id: n.id,
      type: "unionNode",
      position: { x: n.x, y: n.y },
      data,
      draggable: false,
      selectable: false,
      width: UNION_SIZE,
      height: UNION_SIZE,
    };
  });

  // ── pre-compute sibling center-X lists per union ─────────────────────────────────
  // siblingCXs is position-independent (it encodes WHICH children belong to
  // the same union) so it stays correct even when node positions are updated
  // by a subsequent layout pass.  FamilyEdge reads live positions from
  // getNode() and computes busY / busLeft / busRight from them at render time.
  const nodeById = new Map(positioned.nodes.map((n) => [n.id, n]));

  /** unionId → [centerX, …] of every child of that union */
  const siblingCXsByUnion = new Map<string, number[]>();

  for (const e of positioned.edges) {
    const src = nodeById.get(e.sourceId);
    const tgt = nodeById.get(e.targetId);
    if (src?.kind !== "union" || tgt?.kind !== "person") continue;
    const list = siblingCXsByUnion.get(e.sourceId) ?? [];
    list.push(tgt.x + PERSON_W / 2);
    siblingCXsByUnion.set(e.sourceId, list);
  }

  // ── edges ──────────────────────────────────────────────────────────────────
  const edges: Edge[] = positioned.edges.map((e) => {
    const src = nodeById.get(e.sourceId);
    const tgt = nodeById.get(e.targetId);

    const isFromUnion = src?.kind === "union";
    const isToUnion = tgt?.kind === "union";

    // Determine stroke colour from partnership status
    let strokeColor = "#64748b";
    let isDashed = false;

    const partnershipId = isToUnion
      ? tgt?.partnershipId
      : isFromUnion
        ? src?.partnershipId
        : undefined;

    const partnership = partnershipId
      ? partnershipMap.get(partnershipId)
      : undefined;

    if (partnership?.status === "divorced") {
      strokeColor = "#94a3b8";
      isDashed = true;
    } else if (partnership?.status === "widowed") {
      strokeColor = "#94a3b8";
    } else if (isToUnion) {
      // married spouse connector: use teal
      strokeColor = "#0f766e";
    } else {
      // child line
      strokeColor = "#475569";
    }

    if (isToUnion) {
      // Spouse edge: person → union
      return {
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        type: "familyEdge",
        data: { edgeType: "spouse", strokeColor, isDashed },
      } satisfies Edge;
    }

    if (isFromUnion) {
      // Child edge: union → person
      // Pass siblingCXs so FamilyEdge can compute the bus span live from
      // up-to-date node positions (avoids stale pre-computed coordinates).
      const siblingCXs = siblingCXsByUnion.get(e.sourceId) ?? [tgt!.x + PERSON_W / 2];
      return {
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        type: "familyEdge",
        data: { edgeType: "child", strokeColor, isDashed, siblingCXs },
      } satisfies Edge;
    }

    // Direct person→person edge (single parent, no union)
    const childCX = tgt ? tgt.x + PERSON_W / 2 : 0;
    return {
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      type: "familyEdge",
      data: { edgeType: "child", strokeColor, isDashed, siblingCXs: [childCX] },
    } satisfies Edge;
  });

  return { nodes, edges };
}
