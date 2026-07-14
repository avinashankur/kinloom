import type { LayoutGraph } from "../tree-layout-engine";

interface ElkNode {
  id: string;
  width?: number;
  height?: number;
  layoutOptions?: Record<string, string>;
}

interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
}

interface ElkGraph {
  id: string;
  layoutOptions?: Record<string, string>;
  children: ElkNode[];
  edges: ElkEdge[];
}

export function toElkGraph(graph: LayoutGraph): ElkGraph {
  const children: ElkNode[] = graph.nodes.map((n) => ({
    id: n.id,
    width: n.width,
    height: n.height,
    // Union nodes: make them as small as possible so they act as pure junction points
    layoutOptions:
      n.kind === "union"
        ? {
            "elk.nodeSize.minimum": "(16, 16)",
          }
        : undefined,
  }));

  const edges: ElkEdge[] = graph.edges.map((e) => ({
    id: e.id,
    sources: [e.sourceId],
    targets: [e.targetId],
  }));

  return {
    id: "root",
    layoutOptions: {
      // Layered gives the best genealogy layout when tuned correctly
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",

      // Layer spacing — generous vertical gap between generations
      "elk.layered.spacing.nodeNodeBetweenLayers": "100",

      // Node spacing — horizontal gap between siblings
      "elk.spacing.nodeNode": "50",

      // NETWORK_SIMPLEX places each node at the barycenter of its neighbours →
      // children center under parents, parents center over children
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",

      // Keep edge bends tidy
      "elk.edgeRouting": "ORTHOGONAL",

      // Minimize crossings between generations
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",

      // Allow the algorithm to reorder within each layer for better centering
      "elk.layered.crossingMinimization.forceNodeModelOrder": "false",

      // Widen the look-ahead so the algorithm sees more of the tree when deciding
      "elk.layered.layering.strategy": "NETWORK_SIMPLEX",

      // Balance: pull nodes toward the center of their subtree
      "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
    },
    children,
    edges,
  };
}
