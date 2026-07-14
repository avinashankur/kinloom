import ELK from "elkjs/lib/elk.bundled.js";
import type {
  LayoutGraph,
  PositionedGraph,
  TreeLayoutEngine,
} from "../tree-layout-engine";
import { toElkGraph } from "./to-elk-graph";
import { fromElkGraph } from "./from-elk-graph";

const elk = new ELK();

export class ElkTreeLayoutEngine implements TreeLayoutEngine {
  async layout(graph: LayoutGraph): Promise<PositionedGraph> {
    if (graph.nodes.length === 0) {
      return { nodes: [], edges: [] };
    }
    const elkGraph = toElkGraph(graph);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await elk.layout(elkGraph as any);
    return fromElkGraph(result, graph);
  }
}
