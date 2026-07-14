import type { LayoutGraph, PositionedGraph } from "../tree-layout-engine";

interface ElkResultNode {
  id: string;
  x?: number;
  y?: number;
}

interface ElkResult {
  children?: ElkResultNode[];
}

export function fromElkGraph(
  elkResult: ElkResult,
  originalGraph: LayoutGraph,
): PositionedGraph {
  const positionMap = new Map<string, { x: number; y: number }>();
  for (const node of elkResult.children ?? []) {
    positionMap.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
  }

  const positionedNodes = originalGraph.nodes.map((n) => {
    const pos = positionMap.get(n.id) ?? { x: 0, y: 0 };
    return { ...n, x: pos.x, y: pos.y };
  });

  return {
    nodes: positionedNodes,
    edges: originalGraph.edges,
  };
}
