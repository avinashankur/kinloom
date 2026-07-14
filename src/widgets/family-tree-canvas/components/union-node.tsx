import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { UnionNodeData } from "../graph/to-react-flow-graph";
import { UNION_SIZE } from "../config/constants";
import { cn } from "@/lib/utils";

export const UnionNode = memo(function UnionNode({
  data,
}: NodeProps & { data: UnionNodeData }) {
  const isMarried = data.status === "married";
  const isDivorced = data.status === "divorced";

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0" />

      <div
        style={{ width: UNION_SIZE, height: UNION_SIZE }}
        className={cn(
          "rounded-full flex items-center justify-center select-none",
          "border-2 bg-white shadow-sm",
          isMarried && "border-teal-600",
          isDivorced && "border-slate-400",
          !isMarried && !isDivorced && "border-slate-500",
        )}
        title={data.status}
      >
        <span
          className={cn(
            "font-bold leading-none",
            isMarried && "text-teal-700",
            isDivorced && "text-slate-400",
            !isMarried && !isDivorced && "text-slate-500",
          )}
          style={{ fontSize: 14 }}
        >
          +
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </>
  );
});
