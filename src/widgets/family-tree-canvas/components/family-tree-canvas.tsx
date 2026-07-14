import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
  type EdgeTypes,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import { GenealogyLayoutEngine } from "@/infrastructure/layout/genealogy-layout-engine";
import { projectFamilyGraph } from "../graph/project-family-graph";
import type { PositionedGraph } from "@/infrastructure/layout/tree-layout-engine";
import { toReactFlowGraph } from "../graph/to-react-flow-graph";
import { PersonNode } from "./person-node";
import { UnionNode } from "./union-node";
import { FamilyEdge } from "./family-edge";
import { TreeControls } from "./tree-controls";
import { ActivePersonMenu } from "./active-person-menu";
import { useTreeUIStore } from "@/stores/tree-ui-store";
import { cn } from "@/lib/utils";

const nodeTypes: NodeTypes = {
  personNode: PersonNode as never,
  unionNode: UnionNode as never,
};

const edgeTypes: EdgeTypes = {
  familyEdge: FamilyEdge as never,
};

const layoutEngine = new GenealogyLayoutEngine();

interface FamilyTreeCanvasInnerProps {
  snapshot: FamilyTreeSnapshot;
  onAddRelationship: (personId: string) => void;
  onEdit: (personId: string) => void;
  onDelete: (personId: string) => void;
}

function FamilyTreeCanvasInner({
  snapshot,
  onAddRelationship,
  onEdit,
  onDelete,
}: FamilyTreeCanvasInnerProps) {
  const { fitView, setCenter } = useReactFlow();
  const {
    activePersonId,
    setActivePerson,
    fullscreen,
    closeContextMenu,
  } = useTreeUIStore();

  const [nodes, setNodes] = useState<ReturnType<typeof toReactFlowGraph>["nodes"]>([]);
  const [edges, setEdges] = useState<ReturnType<typeof toReactFlowGraph>["edges"]>([]);
  const [positionedGraph, setPositionedGraph] = useState<PositionedGraph | null>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const snapshotRef = useRef<string>("");

  // Run the full graph pipeline ONLY when snapshot structurally changes
  useEffect(() => {
    const key = JSON.stringify({
      people: snapshot.people.map((p) => p.id),
      partnerships: snapshot.partnerships.map((p) => p.id),
      rels: snapshot.parentChildRelationships.map((r) => r.id),
    });

    if (key === snapshotRef.current) return; // No structural change
    snapshotRef.current = key;

    setIsLayoutReady(false);

    const layoutGraph = projectFamilyGraph(snapshot);
    layoutEngine.layout(layoutGraph).then((positioned) => {
      setPositionedGraph(positioned);
      setIsLayoutReady(true);
    });
  }, [snapshot]);

  // Update React Flow nodes/edges on ANY snapshot change or layout change
  useEffect(() => {
    if (positionedGraph) {
      const { nodes: rfNodes, edges: rfEdges } = toReactFlowGraph(
        positionedGraph,
        snapshot,
      );
      setNodes(rfNodes);
      setEdges(rfEdges);
    }
  }, [positionedGraph, snapshot]);

  // Fit view after initial layout
  useEffect(() => {
    if (isLayoutReady) {
      setTimeout(() => fitView({ duration: 600, padding: 0.15 }), 50);
    }
  }, [isLayoutReady, fitView]);

  // Center viewport on active person without reconstructing layout
  const prevActivePersonId = useRef<string | null>(null);
  useEffect(() => {
    if (
      activePersonId &&
      activePersonId !== prevActivePersonId.current &&
      isLayoutReady
    ) {
      const node = nodes.find((n) => n.id === activePersonId);
      if (node) {
        setCenter(node.position.x + 60, node.position.y + 45, {
          duration: 500,
          zoom: 1.2,
        });
      }
    }
    prevActivePersonId.current = activePersonId;
  }, [activePersonId, nodes, isLayoutReady, setCenter]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type === "personNode") {
        setActivePerson(node.id);
      }
    },
    [setActivePerson],
  );

  const onPaneClick = useCallback(() => {
    setActivePerson(null);
    closeContextMenu();
  }, [setActivePerson, closeContextMenu]);

  const activePerson = useMemo(
    () => snapshot.people.find((p) => p.id === activePersonId),
    [snapshot.people, activePersonId],
  );

  // Pass nodes as-is — active state is handled inside PersonNode via the store
  const enrichedNodes = nodes;

  return (
    <div
      className={cn(
        "relative bg-[#faf9f7]",
        fullscreen ? "fixed inset-0 z-50" : "w-full h-full",
      )}
    >
      <ReactFlow
        nodes={enrichedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        minZoom={0.1}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag
        zoomOnScroll
        zoomOnDoubleClick={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#e2e8f0"
        />
        <TreeControls />
      </ReactFlow>

      {/* Active person menu — shown as overlay above active node */}
      {activePersonId && activePerson && isLayoutReady && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{ inset: 0 }}
        >
          {/* We position relative to the canvas — use floating menu at top */}
          <div className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2">
            <ActivePersonMenu
              personId={activePersonId}
              personName={`${activePerson.firstName}${activePerson.lastName ? ` ${activePerson.lastName}` : ""}`}
              onAddRelationship={() => onAddRelationship(activePersonId)}
              onEdit={() => onEdit(activePersonId)}
              onDelete={() => onDelete(activePersonId)}
            />
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!isLayoutReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#faf9f7]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-teal-700 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-500 font-medium">
              Laying out family tree…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function FamilyTreeCanvas(props: FamilyTreeCanvasInnerProps) {
  return (
    <ReactFlowProvider>
      <FamilyTreeCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
