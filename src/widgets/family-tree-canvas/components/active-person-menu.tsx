import { Eye, UserPlus, Pencil, Trash2 } from "lucide-react";
import { useTreeUIStore } from "@/stores/tree-ui-store";
import { cn } from "@/lib/utils";

interface ActivePersonMenuProps {
  personId: string;
  personName: string;
  onAddRelationship: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ActivePersonMenu({
  personName,
  onAddRelationship,
  onEdit,
  onDelete,
}: ActivePersonMenuProps) {
  const { openDetails } = useTreeUIStore();

  const menuItem = cn(
    "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left",
    "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
    "transition-colors duration-100 rounded-md",
  );

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/60",
        "min-w-[180px] p-1.5 animate-in fade-in-0 zoom-in-95 duration-150",
      )}
    >
      <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100 mb-1">
        {personName}
      </div>

      <button id="menu-view-details" className={menuItem} onClick={openDetails}>
        <Eye size={14} className="text-slate-400" />
        View details
      </button>

      <button
        id="menu-add-relationship"
        className={menuItem}
        onClick={onAddRelationship}
      >
        <UserPlus size={14} className="text-slate-400" />
        Add relationship
      </button>

      <button id="menu-edit" className={menuItem} onClick={onEdit}>
        <Pencil size={14} className="text-slate-400" />
        Edit
      </button>

      <div className="border-t border-slate-100 my-1" />

      <button
        id="menu-delete"
        className={cn(menuItem, "text-red-600 hover:bg-red-50 hover:text-red-700")}
        onClick={onDelete}
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  );
}
