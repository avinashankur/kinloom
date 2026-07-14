import { useReactFlow, type EdgeProps } from "@xyflow/react";
import { PERSON_W, UNION_SIZE } from "../config/constants";

interface FamilyEdgeData {
  edgeType?: "spouse" | "child";
  strokeColor?: string;
  isDashed?: boolean;
  isBus?: boolean;
  busY?: number;
  busLeft?: number;
  busRight?: number;
}

function getData(raw: unknown): FamilyEdgeData {
  return (raw as FamilyEdgeData) ?? {};
}

/**
 * Custom genealogy edge renderer.
 *
 * - spouse edges → horizontal line from person inner-edge to union outer-edge
 * - child edges  → orthogonal T-bus routing
 *   • 1 child: vertical stem down from union to child
 *   • N children: vertical stem → horizontal bus → vertical drops to each child
 */
export function FamilyEdge({ id, source, target, data: rawData }: EdgeProps) {
  const { getNode } = useReactFlow();
  const srcNode = getNode(source);
  const tgtNode = getNode(target);

  if (!srcNode || !tgtNode) return null;

  const data = getData(rawData);
  const stroke = data.strokeColor ?? "#64748b";
  const strokeDasharray = data.isDashed ? "6 4" : undefined;
  const strokeWidth = 1.5;

  // ── spouse edge (person → union) ──────────────────────────────────────────
  if (data.edgeType === "spouse") {
    // Person avatar is a 56px circle (28px radius) centered at X=PERSON_W/2, Y=28
    const personCx = srcNode.position.x + PERSON_W / 2;
    const personCy = srcNode.position.y + 28;
    
    // The line should be perfectly horizontal
    const cy = personCy;

    const fromX =
      srcNode.position.x < tgtNode.position.x
        ? personCx + 28       // person is LEFT  → its right edge
        : personCx - 28;      // person is RIGHT → its left edge

    const toX =
      srcNode.position.x < tgtNode.position.x
        ? tgtNode.position.x                   // union left edge
        : tgtNode.position.x + UNION_SIZE;     // union right edge

    return (
      <path
        id={id}
        d={`M ${fromX} ${cy} L ${toX} ${cy}`}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        fill="none"
      />
    );
  }

  // ── child edge (union → person) ───────────────────────────────────────────
  if (data.edgeType === "child") {
    const unionCX = srcNode.position.x + UNION_SIZE / 2;
    const unionBottomY = srcNode.position.y + UNION_SIZE;
    const childCX = tgtNode.position.x + PERSON_W / 2;
    const childTopY = tgtNode.position.y;

    const gap = childTopY - unionBottomY;
    const busY = data.busY ?? unionBottomY + gap * 0.42;
    const isBus = data.isBus ?? false;

    if (!isBus) {
      // Single child or un-aligned: elbow routing
      const aligned = Math.abs(unionCX - childCX) < 2;
      const d = aligned
        ? `M ${unionCX} ${unionBottomY} L ${childCX} ${childTopY}`
        : [
            `M ${unionCX} ${unionBottomY}`,
            `L ${unionCX} ${busY}`,
            `L ${childCX} ${busY}`,
            `L ${childCX} ${childTopY}`,
          ].join(" ");

      return (
        <path
          id={id}
          d={d}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          fill="none"
        />
      );
    }

    // Multiple children — T-bus (each sibling edge draws the full bus; overlapping is fine)
    const busLeft = data.busLeft ?? childCX;
    const busRight = data.busRight ?? childCX;

    const d = [
      `M ${unionCX} ${unionBottomY}`,   // start at union bottom
      `L ${unionCX} ${busY}`,            // vertical stem to bus level
      `M ${busLeft} ${busY}`,            // horizontal bus (full width)
      `L ${busRight} ${busY}`,
      `M ${childCX} ${busY}`,            // vertical drop to this child
      `L ${childCX} ${childTopY}`,
    ].join(" ");

    return (
      <path
        id={id}
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        fill="none"
      />
    );
  }

  return null;
}
