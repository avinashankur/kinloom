import type { Person } from "@/entities/person/model/person";
import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import { IndexedDbFamilyTreeRepository } from "@/infrastructure/persistence/repositories/indexed-db-family-tree-repository";
import { nowIso } from "@/shared/lib/dates";

type EditableFields = Partial<
  Pick<
    Person,
    | "firstName"
    | "lastName"
    | "nickname"
    | "gender"
    | "birthDate"
    | "deathDate"
    | "notes"
  >
>;

interface EditPersonInput {
  snapshot: FamilyTreeSnapshot;
  personId: string;
  updates: EditableFields;
}

export async function editPerson({
  snapshot,
  personId,
  updates,
}: EditPersonInput): Promise<FamilyTreeSnapshot> {
  const existing = snapshot.people.find((p) => p.id === personId);
  if (!existing) throw new Error("PERSON_NOT_FOUND");

  const updated: Person = {
    ...existing,
    ...updates,
    updatedAt: nowIso(),
  };

  await IndexedDbFamilyTreeRepository.savePerson(updated);

  return {
    ...snapshot,
    people: snapshot.people.map((p) => (p.id === personId ? updated : p)),
  };
}
