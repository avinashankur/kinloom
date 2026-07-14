import { AlertTriangle, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeletePersonDialogProps {
  personName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDeleting?: boolean;
}

export function DeletePersonDialog({
  personName,
  onConfirm,
  onClose,
  isDeleting,
}: DeletePersonDialogProps) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "bg-white rounded-2xl shadow-2xl w-full max-w-sm",
            "border border-slate-200 p-6",
            "animate-in fade-in-0 zoom-in-95 duration-200",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Delete {personName}?
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                This action cannot be undone
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-sm text-slate-600 mb-5 leading-relaxed bg-slate-50 rounded-xl p-3">
            This will delete <strong>{personName}</strong> and all relationships
            directly connected to them. Other family members will{" "}
            <strong>not</strong> be deleted.
          </p>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                "bg-red-600 text-white text-sm font-semibold",
                "hover:bg-red-700 disabled:opacity-50 transition-colors",
              )}
            >
              <Trash2 size={14} />
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
