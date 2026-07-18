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
import { toReactFlowGraph } from "../graph/to-react-flow-graph";
import { PersonNode } from "./person-node";
import { UnionNode } from "./union-node";
import { FamilyEdge } from "./family-edge";
import { TreeControls } from "./tree-controls";
import { ActivePersonMenu } from "./active-person-menu";
import { useTreeUIStore } from "@/stores/tree-ui-store";
import { cn } from "@/lib/utils";

// ── Pure graph helpers (person IDs only) ───────────────────────────────────

/** BFS upward — returns every ancestor person ID, including startId itself. */
function collectAncestorPersonIds(
  personId: string,
  snapshot: FamilyTreeSnapshot,
): Set<string> {
  const visited = new Set<string>();
  const queue = [personId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const parentIds = snapshot.parentChildRelationships
      .filter((r) => r.childId === current)
      .map((r) => r.parentId);
    for (const pid of parentIds) {
      if (!visited.has(pid)) queue.push(pid);
    }
  }
  return visited;
}

/** BFS downward — returns every descendant person ID, including startId itself. */
function collectDescendantPersonIds(
  startId: string,
  snapshot: FamilyTreeSnapshot,
): Set<string> {
  const visited = new Set<string>();
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const childIds = snapshot.parentChildRelationships
      .filter((r) => r.parentId === current)
      .map((r) => r.childId);
    for (const childId of childIds) {
      if (!visited.has(childId)) queue.push(childId);
    }
  }
  return visited;
}

/**
 * Given the focused person, returns the set of person IDs to REMOVE from
 * the snapshot before layout.
 *
 * keepVisible anchors (never removed):
 *   • Focused person + all their ancestors
 *   • Each spouse (visible as bridge)
 *   • All children shared between (focused ↔ spouse) and their full subtrees
 *
 * Hidden = everything reachable from a spouse's exclusive ancestry that is
 * NOT in keepVisible:  parents, siblings, siblings' spouses/children, etc.
 * In-laws of siblings are caught by iterative partnership propagation.
 */
function computeHiddenPersonIds(
  activePersonId: string,
  snapshot: FamilyTreeSnapshot,
): Set<string> {
  const spouseIds = snapshot.partnerships
    .filter(
      (p) => p.personAId === activePersonId || p.personBId === activePersonId,
    )
    .map((p) =>
      p.personAId === activePersonId ? p.personBId : p.personAId,
    );

  if (spouseIds.length === 0) return new Set();

  // ── 1. Build keepVisible ──────────────────────────────────────────────────
  const keepVisible = new Set<string>();

  // Focused person + full ancestry
  for (const id of collectAncestorPersonIds(activePersonId, snapshot)) {
    keepVisible.add(id);
  }

  for (const spouseId of spouseIds) {
    keepVisible.add(spouseId); // spouse always visible as bridge

    // Shared children (both active and spouse are parents) + their subtrees
    for (const person of snapshot.people) {
      const parentIds = snapshot.parentChildRelationships
        .filter((r) => r.childId === person.id)
        .map((r) => r.parentId);
      if (
        parentIds.includes(activePersonId) &&
        parentIds.includes(spouseId)
      ) {
        keepVisible.add(person.id);
        for (const d of collectDescendantPersonIds(person.id, snapshot)) {
          keepVisible.add(d);
        }
      }
    }
  }

  // ── 2. Collect hidden person IDs ──────────────────────────────────────────
  const hidden = new Set<string>();

  for (const spouseId of spouseIds) {
    // Walk up spouse's ancestry; each exclusive ancestor triggers a downward sweep
    for (const ancId of collectAncestorPersonIds(spouseId, snapshot)) {
      if (keepVisible.has(ancId)) continue;
      hidden.add(ancId);
      // Descend from each hidden ancestor → catches siblings, cousins, etc.
      for (const d of collectDescendantPersonIds(ancId, snapshot)) {
        if (!keepVisible.has(d)) hidden.add(d);
      }
    }
  }

  // ── 3. Propagate through partnerships (catches in-laws of siblings) ────────
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of snapshot.partnerships) {
      if (hidden.has(p.personAId) && !keepVisible.has(p.personBId) && !hidden.has(p.personBId)) {
        hidden.add(p.personBId);
        for (const d of collectDescendantPersonIds(p.personBId, snapshot)) {
          if (!keepVisible.has(d)) hidden.add(d);
        }
        changed = true;
      }
      if (hidden.has(p.personBId) && !keepVisible.has(p.personAId) && !hidden.has(p.personAId)) {
        hidden.add(p.personAId);
        for (const d of collectDescendantPersonIds(p.personAId, snapshot)) {
          if (!keepVisible.has(d)) hidden.add(d);
        }
        changed = true;
      }
    }
  }

  return hidden;
}

/**
 * Returns a filtered FamilyTreeSnapshot with the hidden people (and their
 * exclusive relationships) stripped out. The layout engine runs on this
 * filtered snapshot, producing a compact, gap-free tree.
 */
function filterSnapshot(
  snapshot: FamilyTreeSnapshot,
  hiddenPersonIds: Set<string>,
): FamilyTreeSnapshot {
  if (hiddenPersonIds.size === 0) return snapshot;

  const visibleIds = new Set(
    snapshot.people.filter((p) => !hiddenPersonIds.has(p.id)).map((p) => p.id),
  );

  return {
    ...snapshot,
    people: snapshot.people.filter((p) => !hiddenPersonIds.has(p.id)),
    // Keep a partnership only if both partners are visible
    partnerships: snapshot.partnerships.filter(
      (p) => visibleIds.has(p.personAId) && visibleIds.has(p.personBId),
    ),
    // Keep a parent-child link only if both ends are visible
    parentChildRelationships: snapshot.parentChildRelationships.filter(
      (r) => visibleIds.has(r.parentId) && visibleIds.has(r.childId),
    ),
  };
}

// ── React Flow types ────────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  personNode: PersonNode as never,
  unionNode: UnionNode as never,
};

const edgeTypes: EdgeTypes = {
  familyEdge: FamilyEdge as never,
};

const layoutEngine = new GenealogyLayoutEngine();

// ── Component ───────────────────────────────────────────────────────────────

interface FamilyTreeCanvasInnerProps {
  snapshot: FamilyTreeSnapshot;
  onAddPerson: () => void;
  onAddRelationship: (personId: string, type?: "parent" | "child" | "spouse") => void;
  onEdit: (personId: string) => void;
  onDelete: (personId: string) => void;
}

function FamilyTreeCanvasInner({
  snapshot,
  onAddPerson,
  onAddRelationship,
  onEdit,
  onDelete,
}: FamilyTreeCanvasInnerProps) {
  const { fitView, setCenter, zoomIn, zoomOut } = useReactFlow();
  const {
    activePersonId,
    setActivePerson,
    fullscreen,
    closeContextMenu,
  } = useTreeUIStore();

  const [nodes, setNodes] = useState<ReturnType<typeof toReactFlowGraph>["nodes"]>([]);
  const [edges, setEdges] = useState<ReturnType<typeof toReactFlowGraph>["edges"]>([]);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // ── Persistent focus ─────────────────────────────────────────────────────
  // When nobody is focused, fall back to the last focused person so the
  // hiding state never collapses back to "show everything".
  const [lastActivePersonId, setLastActivePersonId] = useState<string | null>(null);
  useEffect(() => {
    if (activePersonId) setLastActivePersonId(activePersonId);
  }, [activePersonId]);

  const effectivePersonId = activePersonId ?? lastActivePersonId;

  // ── Unified layout effect ─────────────────────────────────────────────────
  // Runs when snapshot structure changes OR the effective focused person changes.
  // Structural changes: show spinner + fit view.
  // Focus-only changes: silent re-layout, keep current viewport.
  const prevStructKeyRef = useRef<string>("");
  const prevEffectivePersonRef = useRef<string | null>(null);

  useEffect(() => {
    const structKey = JSON.stringify({
      people: snapshot.people.map((p) => p.id),
      partnerships: snapshot.partnerships.map((p) => p.id),
      rels: snapshot.parentChildRelationships.map((r) => r.id),
    });

    const isStructural = structKey !== prevStructKeyRef.current;
    const isFocusChange = effectivePersonId !== prevEffectivePersonRef.current;

    if (!isStructural && !isFocusChange) return;

    prevStructKeyRef.current = structKey;
    prevEffectivePersonRef.current = effectivePersonId;

    // Show spinner only for structural changes (adding/removing people)
    if (isStructural) setIsLayoutReady(false);

    const hiddenPersonIds = effectivePersonId
      ? computeHiddenPersonIds(effectivePersonId, snapshot)
      : new Set<string>();

    // Filter the snapshot — the layout engine sees only what should be visible
    const displaySnapshot = filterSnapshot(snapshot, hiddenPersonIds);
    const layoutGraph = projectFamilyGraph(displaySnapshot);

    layoutEngine.layout(layoutGraph).then((positioned) => {
      const { nodes: rfNodes, edges: rfEdges } = toReactFlowGraph(
        positioned,
        displaySnapshot,
      );
      setNodes(rfNodes);
      setEdges(rfEdges);
      setIsLayoutReady(true);

      // Fit the viewport only after a structural change, not focus switches
      if (isStructural) {
        setTimeout(() => fitView({ duration: 600, padding: 0.15 }), 50);
      }
    });
  }, [snapshot, effectivePersonId, fitView]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const { activePersonId, setActivePerson } = useTreeUIStore.getState();

      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomIn({ duration: 200 });
      } else if (e.key === "-") {
        e.preventDefault();
        zoomOut({ duration: 200 });
      } else if (e.key === "f" || e.key === "0") {
        e.preventDefault();
        fitView({ duration: 600, padding: 0.15 });
      }

      if (activePersonId) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (e.shiftKey) {
            onAddRelationship(activePersonId, "child");
          } else if (e.ctrlKey || e.metaKey) {
            onAddRelationship(activePersonId, "spouse");
          } else {
            onEdit(activePersonId);
          }
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          onDelete(activePersonId);
        } else if (e.key === "Escape") {
          e.preventDefault();
          setActivePerson(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onEdit, onAddRelationship, onDelete, fitView, zoomIn, zoomOut]);

  // ── Center viewport on newly focused person ───────────────────────────────
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

  // ── Click handlers ────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "relative bg-[#faf9f7]",
        fullscreen ? "fixed inset-0 z-50" : "w-full h-full",
      )}
    >
      <ReactFlow
        nodes={nodes}
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

      {/* Empty State Overlay */}
      {snapshot.people.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#faf9f7] pointer-events-none">
          <div className="pointer-events-auto text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-4 text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Blank Canvas</h2>
            <p className="text-slate-500 mb-6 max-w-sm">
              Your family tree is currently empty. Start by adding the very first person to begin mapping your genealogy.
            </p>
            <button
              onClick={() => onAddPerson()}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-medium transition-colors shadow-sm"
            >
              Add First Person
            </button>
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
