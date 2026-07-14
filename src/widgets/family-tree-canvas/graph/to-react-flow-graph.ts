import type { Node, Edge } from "@xyflow/react";
import type { PositionedGraph } from "@/infrastructure/layout/tree-layout-engine";
import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import { PERSON_W, PERSON_H, UNION_SIZE } from "../config/constants";

// ── node data types ───────────────────────────────────────────────────────────
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

// ── how far below the union node the horizontal bus sits ──────────────────────
const BUS_OFFSET_RATIO = 0.42; // fraction of the gap: union-bottom → child-top

/**
 * Final adapter: PositionedGraph → React Flow nodes + edges.
 *
 * Edges are typed as 'familyEdge' (custom renderer):
 *  - spouse edges  carry { edgeType: 'spouse', strokeColor, isDashed }
 *  - child  edges  carry { edgeType: 'child',  strokeColor, isDashed,
 *                          isBus, busY, busLeft, busRight }
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

  // ── pre-compute bus data per union ────────────────────────────────────────
  const nodeById = new Map(positioned.nodes.map((n) => [n.id, n]));

  // group child edges (union → person) by their source union
  interface BusGroup {
    edgeIds: string[];
    childCXs: number[];
    childTopY: number;
    unionBottomY: number;
  }
  const busGroups = new Map<string, BusGroup>();

  for (const e of positioned.edges) {
    const src = nodeById.get(e.sourceId);
    const tgt = nodeById.get(e.targetId);
    if (src?.kind !== "union" || tgt?.kind !== "person") continue;

    if (!busGroups.has(e.sourceId)) {
      busGroups.set(e.sourceId, {
        edgeIds: [],
        childCXs: [],
        childTopY: tgt.y,
        unionBottomY: src.y + UNION_SIZE,
      });
    }
    const g = busGroups.get(e.sourceId)!;
    g.edgeIds.push(e.id);
    g.childCXs.push(tgt.x + PERSON_W / 2);
    // childTopY is the same for all siblings (same generation)
  }

  // edge-id → bus payload
  const busPayload = new Map<string, {
    isBus: boolean;
    busY: number;
    busLeft: number;
    busRight: number;
  }>();

  for (const [, g] of busGroups) {
    const gap = g.childTopY - g.unionBottomY;
    const busY = g.unionBottomY + gap * BUS_OFFSET_RATIO;
    const busLeft = Math.min(...g.childCXs);
    const busRight = Math.max(...g.childCXs);
    const isBus = g.childCXs.length > 1;

    for (const eid of g.edgeIds) {
      busPayload.set(eid, { isBus, busY, busLeft, busRight });
    }
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
      const bus = busPayload.get(e.id) ?? {
        isBus: false,
        busY: 0,
        busLeft: 0,
        busRight: 0,
      };
      return {
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        type: "familyEdge",
        data: { edgeType: "child", strokeColor, isDashed, ...bus },
      } satisfies Edge;
    }

    // Direct person→person edge (single parent, no union)
    return {
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      type: "familyEdge",
      data: { edgeType: "child", strokeColor, isDashed, isBus: false },
    } satisfies Edge;
  });

  return { nodes, edges };
}
