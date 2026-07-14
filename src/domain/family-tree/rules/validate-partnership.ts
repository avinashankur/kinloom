import type { Partnership } from "@/entities/relationship/model/partnership";

export type PartnershipValidationError =
  | "SELF_PARTNER"
  | "DUPLICATE_PARTNERSHIP"
  | "ALREADY_MARRIED";

export function validatePartnership(
  personAId: string,
  personBId: string,
  status: "married" | "divorced" | "widowed",
  existing: Partnership[],
): PartnershipValidationError | null {
  if (personAId === personBId) return "SELF_PARTNER";

  const duplicate = existing.some(
    (p) =>
      (p.personAId === personAId && p.personBId === personBId) ||
      (p.personAId === personBId && p.personBId === personAId),
  );
  if (duplicate) return "DUPLICATE_PARTNERSHIP";

  if (status === "married") {
    const alreadyMarried = existing.some(
      (p) =>
        p.status === "married" &&
        (p.personAId === personAId ||
          p.personBId === personAId ||
          p.personAId === personBId ||
          p.personBId === personBId),
    );
    if (alreadyMarried) return "ALREADY_MARRIED";
  }

  return null;
}
