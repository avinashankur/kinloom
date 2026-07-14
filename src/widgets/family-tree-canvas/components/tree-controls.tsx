import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Search,
  Scan,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useTreeUIStore } from "@/stores/tree-ui-store";
import { cn } from "@/lib/utils";

export function TreeControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { fullscreen, setFullscreen, openSearch } = useTreeUIStore();

  const btnClass = cn(
    "w-9 h-9 flex items-center justify-center rounded-lg",
    "bg-white/90 backdrop-blur-sm border border-slate-200",
    "text-slate-600 hover:text-slate-900 hover:bg-white",
    "shadow-sm transition-all duration-150 hover:shadow",
    "active:scale-95",
  );

  return (
    <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-1.5">
      <button
        id="tree-search-btn"
        className={btnClass}
        onClick={openSearch}
        title="Search people (Ctrl+K)"
      >
        <Search size={16} />
      </button>

      <div className="w-px h-3 bg-slate-200 mx-auto" />

      <button
        id="tree-zoom-in-btn"
        className={btnClass}
        onClick={() => zoomIn({ duration: 300 })}
        title="Zoom in"
      >
        <ZoomIn size={16} />
      </button>
      <button
        id="tree-zoom-out-btn"
        className={btnClass}
        onClick={() => zoomOut({ duration: 300 })}
        title="Zoom out"
      >
        <ZoomOut size={16} />
      </button>
      <button
        id="tree-fit-view-btn"
        className={btnClass}
        onClick={() => fitView({ duration: 600, padding: 0.15 })}
        title="Fit to screen"
      >
        <Scan size={16} />
      </button>

      <div className="w-px h-3 bg-slate-200 mx-auto" />

      <button
        id="tree-fullscreen-btn"
        className={btnClass}
        onClick={() => setFullscreen(!fullscreen)}
        title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
}
