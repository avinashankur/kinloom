import type { Partnership } from "@/entities/relationship/model/partnership";

export function getSpouses(
  personId: string,
  partnerships: Partnership[],
): Partnership[] {
  return partnerships.filter(
    (p) => p.personAId === personId || p.personBId === personId,
  );
}

export function getCurrentSpouse(
  personId: string,
  partnerships: Partnership[],
): Partnership | null {
  return (
    partnerships.find(
      (p) =>
        p.status === "married" &&
        (p.personAId === personId || p.personBId === personId),
    ) ?? null
  );
}

export function getSpouseId(
  personId: string,
  partnership: Partnership,
): string {
  return partnership.personAId === personId
    ? partnership.personBId
    : partnership.personAId;
}
