import { useRef, useState } from "react";
import { Download, Upload, RotateCcw, Check, AlertCircle } from "lucide-react";
import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import { exportTree } from "../services/export-service";
import { importTree } from "../services/import-service";
import { cn } from "@/lib/utils";

interface ImportExportPanelProps {
  snapshot: FamilyTreeSnapshot;
  onImport: (snapshot: FamilyTreeSnapshot) => Promise<void>;
  onReset: () => Promise<void>;
}

export function ImportExportPanel({
  snapshot,
  onImport,
  onReset,
}: ImportExportPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleExport = () => {
    exportTree(snapshot);
    setStatus("ok");
    setMessage("Tree exported successfully");
    setTimeout(() => setStatus("idle"), 3000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importTree(file);
    if (result.ok) {
      await onImport(result.snapshot);
      setStatus("ok");
      setMessage(`Imported ${result.snapshot.people.length} people`);
    } else {
      setStatus("error");
      setMessage(result.error);
    }
    setTimeout(() => setStatus("idle"), 5000);
    e.target.value = "";
  };

  const handleReset = async () => {
    if (!confirm("Reset to seed data? All local changes will be lost.")) return;
    setIsResetting(true);
    await onReset();
    setIsResetting(false);
    setStatus("ok");
    setMessage("Reset to seed data");
    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelect}
      />

      <ActionButton
        icon={<Download size={14} />}
        label="Export JSON"
        onClick={handleExport}
      />
      <ActionButton
        icon={<Upload size={14} />}
        label="Import JSON"
        onClick={() => fileRef.current?.click()}
      />
      <ActionButton
        icon={<RotateCcw size={14} />}
        label={isResetting ? "Resetting…" : "Reset to seed"}
        onClick={handleReset}
        variant="danger"
        disabled={isResetting}
      />

      {status !== "idle" && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium",
            status === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200",
          )}
        >
          {status === "ok" ? (
            <Check size={12} />
          ) : (
            <AlertCircle size={12} />
          )}
          {message}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = "default",
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium w-full",
        "transition-colors duration-150 disabled:opacity-50",
        variant === "danger"
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-100",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
