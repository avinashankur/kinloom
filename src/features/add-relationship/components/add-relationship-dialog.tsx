import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, UserPlus } from "lucide-react";
import {
  addRelationshipSchema,
  type AddRelationshipFormValues,
} from "../schemas/add-relationship-schema";
import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import { getCurrentSpouse } from "@/domain/family-tree/queries/get-spouses";
import { cn } from "@/lib/utils";

interface AddRelationshipDialogProps {
  personId: string;
  snapshot: FamilyTreeSnapshot;
  defaultType?: "parent" | "child" | "spouse";
  onSave: (values: AddRelationshipFormValues, parentIds?: string[]) => Promise<void>;
  onClose: () => void;
}

const RELATIONSHIP_TYPES = [
  { value: "parent", label: "Parent", desc: "Add a parent to this person" },
  { value: "child", label: "Child", desc: "Add a child of this person" },
  { value: "spouse", label: "Spouse", desc: "Add a partner/spouse" },
] as const;

export function AddRelationshipDialog({
  personId,
  snapshot,
  defaultType,
  onSave,
  onClose,
}: AddRelationshipDialogProps) {
  const [step, setStep] = useState<"type" | "form">(defaultType ? "form" : "type");
  const currentPerson = snapshot.people.find((p) => p.id === personId);
  const currentSpouse = getCurrentSpouse(personId, snapshot.partnerships);
  const currentSpousePerson = currentSpouse
    ? snapshot.people.find(
        (p) =>
          p.id ===
          (currentSpouse.personAId === personId
            ? currentSpouse.personBId
            : currentSpouse.personAId),
      )
    : null;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddRelationshipFormValues>({
    resolver: zodResolver(addRelationshipSchema),
    defaultValues: {
      relationshipType: defaultType ?? "child",
      gender: "male",
      partnershipStatus: "married",
      includeSpouseAsParent: !!currentSpouse,
    },
  });

  const relType = watch("relationshipType");

  const onSubmit = async (values: AddRelationshipFormValues) => {
    let parentIds: string[] | undefined;
    if (values.relationshipType === "child") {
      parentIds = [personId];
      if (values.includeSpouseAsParent && currentSpousePerson) {
        parentIds.push(currentSpousePerson.id);
      }
    }
    await onSave(values, parentIds);
    onClose();
  };

  if (step === "type") {
    return (
      <DialogShell title="Add relationship" onClose={onClose}>
        <p className="text-sm text-slate-500 mb-4">
          Select the type of relationship to add for{" "}
          <strong>{currentPerson?.firstName}</strong>:
        </p>
        <div className="space-y-2">
          {RELATIONSHIP_TYPES.map((rt) => (
            <button
              key={rt.value}
              className={cn(
                "w-full flex items-start gap-3 p-3.5 rounded-xl text-left border",
                "border-slate-200 hover:border-teal-500 hover:bg-teal-50/50",
                "transition-all duration-150 group",
              )}
              onClick={() => {
                setValue("relationshipType", rt.value);
                setStep("form");
              }}
              onPointerDown={() => {
                // Trigger react-hook-form field
              }}
            >
              <Controller
                control={control}
                name="relationshipType"
                render={({ field }) => (
                  <input
                    type="radio"
                    {...field}
                    value={rt.value}
                    className="mt-1 accent-teal-700"
                    onClick={() => {
                      field.onChange(rt.value);
                      setStep("form");
                    }}
                  />
                )}
              />
              <div>
                <div className="text-sm font-semibold text-slate-800 group-hover:text-teal-700">
                  {rt.label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{rt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogShell>
    );
  }

  return (
    <DialogShell
      title={`Add ${relType}`}
      onClose={onClose}
      onBack={() => setStep("type")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name *" error={errors.firstName?.message}>
            <input {...register("firstName")} className={inputClass} autoFocus />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <input {...register("lastName")} className={inputClass} />
          </Field>
        </div>

        <Field label="Gender" error={errors.gender?.message}>
          <select {...register("gender")} className={inputClass}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>

        {relType === "spouse" && (
          <Field label="Partnership status" error={errors.partnershipStatus?.message}>
            <select {...register("partnershipStatus")} className={inputClass}>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </Field>
        )}

        {relType === "child" && currentSpousePerson && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
            <input
              type="checkbox"
              id="include-spouse"
              {...register("includeSpouseAsParent")}
              className="accent-teal-700"
            />
            <label htmlFor="include-spouse" className="text-sm text-slate-700">
              Also add{" "}
              <strong>{currentSpousePerson.firstName}</strong> as a parent
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Birth date" error={errors.birthDate?.message}>
            <input {...register("birthDate")} placeholder="YYYY-MM-DD" className={inputClass} />
          </Field>
          <Field label="Death date" error={errors.deathDate?.message}>
            <input {...register("deathDate")} placeholder="YYYY-MM-DD" className={inputClass} />
          </Field>
        </div>

        <Field label="Notes" error={errors.notes?.message}>
          <textarea {...register("notes")} rows={2} className={cn(inputClass, "resize-none")} />
        </Field>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
              "bg-teal-700 text-white text-sm font-semibold",
              "hover:bg-teal-800 disabled:opacity-50 transition-colors",
            )}
          >
            <UserPlus size={14} />
            {isSubmitting ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function DialogShell({
  title,
  children,
  onClose,
  onBack,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onBack?: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200",
            "animate-in fade-in-0 zoom-in-95 duration-200",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-lg"
                >
                  ←
                </button>
              )}
              <h2 className="text-base font-semibold text-slate-900 capitalize">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-6">{children}</div>
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
