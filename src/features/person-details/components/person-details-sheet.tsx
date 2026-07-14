import { X, Calendar, Heart, StickyNote, Edit2 } from "lucide-react";
import type { Person } from "@/entities/person/model/person";
import { formatDate } from "@/shared/lib/dates";
import { useTreeUIStore } from "@/stores/tree-ui-store";
import { cn } from "@/lib/utils";

interface PersonDetailsSheetProps {
  person: Person | null;
  onEdit: (personId: string) => void;
}

export function PersonDetailsSheet({ person, onEdit }: PersonDetailsSheetProps) {
  const { detailsOpen, closeDetails } = useTreeUIStore();

  if (!detailsOpen || !person) return null;

  const displayName = [person.firstName, person.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
        onClick={closeDetails}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-80",
          "bg-white border-l border-slate-200 shadow-2xl shadow-slate-200/50",
          "flex flex-col overflow-hidden",
          "animate-in slide-in-from-right duration-300",
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {displayName}
              {person.deathDate && (
                <span className="ml-1.5 text-slate-400">†</span>
              )}
            </h2>
            {person.nickname && (
              <p className="text-sm text-slate-400 mt-0.5">
                &ldquo;{person.nickname}&rdquo;
              </p>
            )}
          </div>
          <button
            onClick={closeDetails}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Avatar */}
          <div className="flex justify-center py-2">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold",
                person.gender === "male"
                  ? "bg-sky-100 text-sky-700"
                  : "bg-rose-100 text-rose-700",
                person.deathDate && "opacity-60",
              )}
            >
              {displayName.charAt(0)}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <DetailRow
              icon={<Heart size={14} />}
              label="Gender"
              value={person.gender === "male" ? "Male" : "Female"}
            />
            {person.birthDate && (
              <DetailRow
                icon={<Calendar size={14} />}
                label="Born"
                value={formatDate(person.birthDate)}
              />
            )}
            {person.deathDate && (
              <DetailRow
                icon={<Calendar size={14} />}
                label="Died"
                value={formatDate(person.deathDate)}
              />
            )}
            {person.notes && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                  <StickyNote size={14} />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Notes
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {person.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            id="details-edit-btn"
            onClick={() => onEdit(person.id)}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl",
              "bg-slate-900 text-white text-sm font-semibold",
              "hover:bg-slate-800 transition-colors duration-150",
              "active:scale-[0.98]",
            )}
          >
            <Edit2 size={14} />
            Edit person
          </button>
        </div>
      </div>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-1.5 text-slate-400 mt-0.5 min-w-[70px]">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-sm text-slate-700 font-medium">{value}</span>
    </div>
  );
}
