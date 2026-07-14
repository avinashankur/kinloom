import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save } from "lucide-react";
import type { Person } from "@/entities/person/model/person";
import {
  editPersonSchema,
  type EditPersonFormValues,
} from "../schemas/edit-person-schema";
import { cn } from "@/lib/utils";

interface EditPersonDialogProps {
  person?: Person | null;
  onSave: (personId: string | null, values: EditPersonFormValues) => Promise<void>;
  onClose: () => void;
}

export function EditPersonDialog({
  person,
  onSave,
  onClose,
}: EditPersonDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditPersonFormValues>({
    resolver: zodResolver(editPersonSchema),
    defaultValues: {
      gender: "male",
    },
  });

  useEffect(() => {
    if (person) {
      reset({
        firstName: person.firstName,
        lastName: person.lastName ?? "",
        nickname: person.nickname ?? "",
        gender: person.gender,
        birthDate: person.birthDate ?? "",
        deathDate: person.deathDate ?? "",
        notes: person.notes ?? "",
      });
    }
  }, [person, reset]);

  const onSubmit = async (values: EditPersonFormValues) => {
    await onSave(person?.id ?? null, values);
    onClose();
  };

  const isEditing = !!person;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "bg-white rounded-2xl shadow-2xl w-full max-w-md",
            "border border-slate-200",
            "animate-in fade-in zoom-in-95 duration-200",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                {isEditing ? "Edit Person Details" : "Start Family Tree"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {isEditing ? "Update the information for this family member." : "Add the very first person to this tree."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name *" error={errors.firstName?.message}>
                <input {...register("firstName")} className={inputClass} />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <input {...register("lastName")} className={inputClass} />
              </Field>
            </div>

            <Field label="Nickname" error={errors.nickname?.message}>
              <input {...register("nickname")} className={inputClass} />
            </Field>

            <Field label="Gender" error={errors.gender?.message}>
              <select {...register("gender")} className={inputClass}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Birth date" error={errors.birthDate?.message}>
                <input
                  {...register("birthDate")}
                  placeholder="YYYY-MM-DD"
                  className={inputClass}
                />
              </Field>
              <Field label="Death date" error={errors.deathDate?.message}>
                <input
                  {...register("deathDate")}
                  placeholder="YYYY-MM-DD"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Notes" error={errors.notes?.message}>
              <textarea
                {...register("notes")}
                rows={3}
                className={cn(inputClass, "resize-none")}
              />
            </Field>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                  "bg-slate-900 text-white text-sm font-semibold",
                  "hover:bg-slate-800 disabled:opacity-50 transition-colors",
                )}
              >
                <Save size={14} />
                {isSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass = cn(
  "w-full px-3 py-2 rounded-lg border border-slate-200 bg-white",
  "text-sm text-slate-900 placeholder-slate-400",
  "focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500",
  "transition-colors duration-150",
);
