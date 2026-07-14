export interface LayoutNode {
  id: string;
  kind: "person" | "union";
  width: number;
  height: number;
  // For "person" nodes
  personId?: string;
  // For "union" nodes
  partnershipId?: string;
}

export interface LayoutEdge {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface LayoutGraph {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

export interface PositionedNode extends LayoutNode {
  x: number;
  y: number;
}

export interface PositionedGraph {
  nodes: PositionedNode[];
  edges: LayoutEdge[];
}

export interface TreeLayoutEngine {
  layout(graph: LayoutGraph): Promise<PositionedGraph>;
}
