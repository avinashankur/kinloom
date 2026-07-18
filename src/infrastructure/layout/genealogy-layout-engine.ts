import type {
  LayoutGraph,
  PositionedGraph,
  PositionedNode,
  TreeLayoutEngine,
} from "./tree-layout-engine";

// ─── constants ────────────────────────────────────────────────────────────────
const PERSON_W = 120;
const UNION_SIZE = 28; // must match union-node.tsx rendered size
const H_GAP = 56; // horizontal gap between sibling subtrees
const SPOUSE_GAP = 24; // gap between spouse node and union dot (each side)
const V_STEP = 200; // vertical distance from generation centre to next

// ─── engine ───────────────────────────────────────────────────────────────────
export class GenealogyLayoutEngine implements TreeLayoutEngine {
  async layout(graph: LayoutGraph): Promise<PositionedGraph> {
    if (graph.nodes.length === 0) return { nodes: [], edges: [] };
    return computeLayout(graph);
  }
}

// ─── main algorithm ───────────────────────────────────────────────────────────
function computeLayout(graph: LayoutGraph): PositionedGraph {
  const unionIds = new Set(
    graph.nodes.filter((n) => n.kind === "union").map((n) => n.id)
  );

  // ── build adjacency ──────────────────────────────────────────────────────
  /** unionId → person ids of the two spouses (person → union edges) */
  const spousesOf = new Map<string, string[]>();
  /** unionId → child person ids (union → person edges) */
  const childrenOf = new Map<string, string[]>();
  /** personId → ALL union ids this person participates in as a spouse */
  const allUnionsOf = new Map<string, string[]>();
  /** personId → union id that is this person's parent */
  const parentUnionOf = new Map<string, string>();
  /** personId → child person ids (direct person→person edges, single parent) */
  const directChildrenOf = new Map<string, string[]>();
  /** personId → parent person id (direct edge) */
  const directParentOf = new Map<string, string>();

  for (const edge of graph.edges) {
    const srcIsUnion = unionIds.has(edge.sourceId);
    const tgtIsUnion = unionIds.has(edge.targetId);

    if (!srcIsUnion && tgtIsUnion) {
      // person → union  (spouse edge)
      const arr = spousesOf.get(edge.targetId) ?? [];
      arr.push(edge.sourceId);
      spousesOf.set(edge.targetId, arr);

      const unions = allUnionsOf.get(edge.sourceId) ?? [];
      unions.push(edge.targetId);
      allUnionsOf.set(edge.sourceId, unions);
    } else if (srcIsUnion && !tgtIsUnion) {
      // union → person  (child edge)
      const arr = childrenOf.get(edge.sourceId) ?? [];
      arr.push(edge.targetId);
      childrenOf.set(edge.sourceId, arr);
      parentUnionOf.set(edge.targetId, edge.sourceId);
    } else if (!srcIsUnion && !tgtIsUnion) {
      // person → person  (single-parent edge)
      const arr = directChildrenOf.get(edge.sourceId) ?? [];
      arr.push(edge.targetId);
      directChildrenOf.set(edge.sourceId, arr);
      directParentOf.set(edge.targetId, edge.sourceId);
    }
  }

  /** Pick the "main" union for layout purposes: most children wins; ties → last. */
  function primaryUnion(personId: string): string | null {
    const unions = allUnionsOf.get(personId);
    if (!unions?.length) return null;
    return unions.reduce((best, uid) =>
      (childrenOf.get(uid)?.length ?? 0) >= (childrenOf.get(best)?.length ?? 0)
        ? uid
        : best
    );
  }

  // ── subtree width (bottom-up, memoised) ──────────────────────────────────
  const widthCache = new Map<string, number>();

  function subtreeWidth(personId: string): number {
    if (widthCache.has(personId)) return widthCache.get(personId)!;

    const pUnion = primaryUnion(personId);
    let w: number;

    if (pUnion) {
      const spouses = spousesOf.get(pUnion) ?? [];
      // Secondary spouse width is accounted for in primary's width
      if (spouses[0] !== personId) {
        widthCache.set(personId, 0);
        return 0;
      }
      const baseCoupleW =
        PERSON_W + SPOUSE_GAP + UNION_SIZE + SPOUSE_GAP + PERSON_W;
      // When we align the blood child's avatar at cx, the whole couple is shifted by:
      const shift = PERSON_W / 2 + UNION_SIZE / 2 + SPOUSE_GAP;
      // To prevent overlaps using a symmetrical bounding box, we double the max extent from center
      const coupleW = baseCoupleW + 2 * shift;

      const kids = childrenOf.get(pUnion) ?? [];
      if (kids.length === 0) {
        w = coupleW;
      } else {
        const kidsW =
          kids.reduce((sum, k) => sum + subtreeWidth(k), 0) +
          H_GAP * (kids.length - 1);
        w = Math.max(coupleW, kidsW);
      }
    } else {
      // Single person — no partner
      const direct = directChildrenOf.get(personId) ?? [];
      if (direct.length === 0) {
        w = PERSON_W;
      } else {
        const kidsW =
          direct.reduce((sum, k) => sum + subtreeWidth(k), 0) +
          H_GAP * (direct.length - 1);
        w = Math.max(PERSON_W, kidsW);
      }
    }

    widthCache.set(personId, w);
    return w;
  }

  // ── position nodes (top-down, recursive) ─────────────────────────────────
  const pos = new Map<string, { x: number; y: number }>();
  const placedUnions = new Set<string>();

  /**
   * Place personId so its SUBTREE is horizontally centred at `cx`.
   * `depth` is the generation row (0 = root).
   */
  function place(personId: string, cx: number, depth: number): void {
    const y = depth * V_STEP;
    const pUnion = primaryUnion(personId);

    if (pUnion && !placedUnions.has(pUnion)) {
      placedUnions.add(pUnion);

      const spouses = spousesOf.get(pUnion) ?? [];
      const kids = childrenOf.get(pUnion) ?? [];

      // Centre of this family = cx
      // To ensure the blood child's avatar is exactly at cx, we shift the union dot
      const isS0 = spouses[0] === personId;
      const shift = PERSON_W / 2 + UNION_SIZE / 2 + SPOUSE_GAP;
      const unionAbsX = cx + (isS0 ? shift : -shift);

      // Lay out children centred at unionAbsX
      if (kids.length > 0) {
        const kidsW =
          kids.reduce((sum, k) => sum + subtreeWidth(k), 0) +
          H_GAP * (kids.length - 1);
        let kidX = unionAbsX - kidsW / 2;
        for (const kid of kids) {
          const kw = subtreeWidth(kid);
          place(kid, kidX + kw / 2, depth + 1);
          kidX += kw + H_GAP;
        }
      }

      // Union dot at unionAbsX
      pos.set(pUnion, {
        x: unionAbsX - UNION_SIZE / 2,
        y: y + 28 - UNION_SIZE / 2,
      });

      // Spouse A left of union
      if (spouses[0]) {
        pos.set(spouses[0], {
          x: unionAbsX - UNION_SIZE / 2 - SPOUSE_GAP - PERSON_W,
          y,
        });
      }
      // Spouse B right of union
      if (spouses[1]) {
        pos.set(spouses[1], {
          x: unionAbsX + UNION_SIZE / 2 + SPOUSE_GAP,
          y,
        });
      }

      // Secondary unions for this person (e.g. divorced couples)
      // Place them to the left of the primary family
      const allU = allUnionsOf.get(personId) ?? [];
      let secondaryOffsetLeft =
        unionAbsX - UNION_SIZE / 2 - SPOUSE_GAP - PERSON_W - H_GAP;

      for (const uid of allU) {
        if (uid === pUnion || placedUnions.has(uid)) continue;
        placedUnions.add(uid);

        const secSpouses = spousesOf.get(uid) ?? [];
        const secKids = childrenOf.get(uid) ?? [];
        const secUnionCx = secondaryOffsetLeft - UNION_SIZE / 2 - SPOUSE_GAP;

        pos.set(uid, {
          x: secUnionCx - UNION_SIZE / 2,
          y: y + 28 - UNION_SIZE / 2,
        });

        // The other spouse of the secondary union
        const otherSpouse = secSpouses.find((s) => s !== personId);
        if (otherSpouse) {
          pos.set(otherSpouse, {
            x: secUnionCx - UNION_SIZE / 2 - SPOUSE_GAP - PERSON_W,
            y,
          });
          secondaryOffsetLeft =
            secUnionCx - UNION_SIZE / 2 - SPOUSE_GAP - PERSON_W - H_GAP;
        }

        // Children of the secondary union
        if (secKids.length > 0) {
          const kidsW =
            secKids.reduce((sum, k) => sum + subtreeWidth(k), 0) +
            H_GAP * (secKids.length - 1);
          let kidX = secUnionCx - kidsW / 2;
          for (const kid of secKids) {
            const kw = subtreeWidth(kid);
            if (!pos.has(kid)) place(kid, kidX + kw / 2, depth + 1);
            kidX += kw + H_GAP;
          }
        }
      }
    } else if (!pUnion) {
      // Isolated person (no partner at this level)
      pos.set(personId, { x: cx - PERSON_W / 2, y });

      const direct = directChildrenOf.get(personId) ?? [];
      if (direct.length > 0) {
        const kidsW =
          direct.reduce((sum, k) => sum + subtreeWidth(k), 0) +
          H_GAP * (direct.length - 1);
        let kidX = cx - kidsW / 2;
        for (const kid of direct) {
          const kw = subtreeWidth(kid);
          place(kid, kidX + kw / 2, depth + 1);
          kidX += kw + H_GAP;
        }
      }
    }
    // If pUnion is set but already placed → secondary spouse already positioned
  }

  // ── find roots & kick off layout ─────────────────────────────────────
  const rootIds = graph.nodes
    .filter(
      (n) =>
        n.kind === "person" &&
        !parentUnionOf.has(n.id) &&
        !directParentOf.has(n.id)
    )
    .map((n) => n.id)
    .filter((id) => {
      // Only keep "primary" roots (avoid double-counting couples)
      const pu = primaryUnion(id);
      if (!pu) return true;
      const sp = spousesOf.get(pu) ?? [];
      return sp[0] === id;
    });

  /**
   * A "parentless spouse root" is a person who has no parents in this graph
   * but whose primary-union partner DOES have a parent (parentUnionOf or
   * directParentOf). Their position will be set naturally when the partner
   * gets placed as a child of the partner's parental family. Sorting them
   * last ensures the parental family is the main root and the couple ends
   * up at the correct depth below the parents.
   *
   * Without this, A (parentless) could sort before PB1 (B's parent) and
   * be placed at depth 0 alongside B — putting PB1/PB2 at the same row as B.
   */
  function isParentlessSpouseRoot(id: string): boolean {
    const pu = primaryUnion(id);
    if (!pu) return false;
    const partner = (spousesOf.get(pu) ?? []).find((s) => s !== id);
    return (
      !!partner &&
      (parentUnionOf.has(partner) || directParentOf.has(partner))
    );
  }

  rootIds.sort((a, b) => {
    const aDeferred = isParentlessSpouseRoot(a) ? 1 : 0;
    const bDeferred = isParentlessSpouseRoot(b) ? 1 : 0;
    if (aDeferred !== bDeferred) return aDeferred - bDeferred; // deferred last
    return subtreeWidth(b) - subtreeWidth(a);                  // larger first
  });


  /**
   * Compute how many generations deep a root person's spouse sits.
   *
   * Problem: when A has no parents but B does, both A and B end up as
   * "roots" (no parentUnion). If we always start them at depth=0 they land
   * on the same row as B's parents — the union-AB edge goes sideways.
   *
   * Solution: walk each root's primary-union spouse upward to count how many
   * parent-union hops exist above them. That count is the depth offset we
   * should start this root at so it sits at the same generation as its
   * partner even though its own ancestry is hidden.
   */
  function inferRootDepth(personId: string): number {
    const pu = primaryUnion(personId);
    if (!pu) return 0;

    // Find the OTHER spouse in this union
    const spouses = spousesOf.get(pu) ?? [];
    const partner = spouses.find((s) => s !== personId);
    if (!partner) return 0;

    // Walk upward through the partner's ancestry to count generations
    let depth = 0;
    let current: string | undefined = partner;
    const visited = new Set<string>();
    while (current && !visited.has(current)) {
      visited.add(current);
      const pUnion = parentUnionOf.get(current);
      if (pUnion) {
        depth++;
        // Move to one of the parents of this union
        const parents = spousesOf.get(pUnion) ?? [];
        current = parents[0];
      } else {
        const directP = directParentOf.get(current);
        if (directP) { depth++; current = directP; }
        else break;
      }
    }
    return depth;
  }

  const rootWidths = rootIds.map(subtreeWidth);
  let rx = 0;

  if (rootIds.length > 0) {
    // Anchor the main (largest) family tree exactly at X=0
    place(rootIds[0], 0, 0);
    rx = rootWidths[0] / 2 + H_GAP;
  }

  // Place all secondary roots at their inferred depth so spouses without
  // parents land on the same row as their partner, not at the top.
  for (let i = 1; i < rootIds.length; i++) {
    const depth = inferRootDepth(rootIds[i]);
    place(rootIds[i], rx + rootWidths[i] / 2, depth);
    rx += rootWidths[i] + H_GAP;
  }

  // Fallback: any unpositioned node
  let fallbackX = 600;
  for (const node of graph.nodes) {
    if (!pos.has(node.id)) {
      pos.set(node.id, { x: fallbackX, y: 0 });
      fallbackX += PERSON_W + H_GAP;
    }
  }

  const positionedNodes: PositionedNode[] = graph.nodes.map((n) => ({
    ...n,
    ...(pos.get(n.id) ?? { x: 0, y: 0 }),
  }));

  return { nodes: positionedNodes, edges: graph.edges };
}
