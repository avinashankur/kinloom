import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PersonNodeData } from "../graph/to-react-flow-graph";
import { useTreeUIStore } from "@/stores/tree-ui-store";
import { cn } from "@/lib/utils";

export const PersonNode = memo(function PersonNode({
  data,
  id,
}: NodeProps & { data: PersonNodeData }) {
  const activePersonId = useTreeUIStore((s) => s.activePersonId);
  const isActive = activePersonId === id;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0" />

      <div
        className={cn(
          "relative flex flex-col items-center gap-1.5 cursor-pointer select-none",
          "transition-transform duration-150",
          isActive && "scale-105"
        )}
        style={{ width: 120 }}
      >
        {/* Avatar circle */}
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold",
            "border-2 transition-all duration-200",
            data.gender === "male"
              ? "bg-sky-100 border-sky-300 text-sky-800"
              : "bg-rose-100 border-rose-300 text-rose-800",
            isActive &&
              (data.gender === "male"
                ? "border-sky-600 shadow-lg shadow-sky-200"
                : "border-rose-500 shadow-lg shadow-rose-200"),
            data.isDeceased && "opacity-60"
          )}
        >
          {data.label.charAt(0).toUpperCase()}
        </div>

        {/* Name + deceased */}
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={cn(
              "text-xs font-semibold text-center leading-tight max-w-[110px] truncate",
              "text-slate-800",
              isActive && "text-slate-900"
            )}
          >
            {data.label}
            {data.isDeceased && (
              <span className="ml-0.5 text-slate-400">†</span>
            )}
          </span>
          {data.birthYear && (
            <span className="text-[10px] text-slate-400">{data.birthYear}</span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0!" />
    </>
  );
});
