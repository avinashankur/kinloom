import type { Person } from "@/entities/person/model/person";
import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import type { Partnership } from "@/entities/relationship/model/partnership";
import { validatePartnership } from "@/domain/family-tree/rules/validate-partnership";
import { IndexedDbFamilyTreeRepository } from "@/infrastructure/persistence/repositories/indexed-db-family-tree-repository";
import { generateId } from "@/shared/lib/ids";
import { nowIso } from "@/shared/lib/dates";

interface AddSpouseInput {
  snapshot: FamilyTreeSnapshot;
  personId: string;
  spouse: Omit<Person, "id" | "treeId" | "createdAt" | "updatedAt">;
  status: Partnership["status"];
}

export async function addSpouse({
  snapshot,
  personId,
  spouse,
  status,
}: AddSpouseInput): Promise<FamilyTreeSnapshot> {
  const treeId = snapshot.tree.id;
  const now = nowIso();

  const newPerson: Person = {
    ...spouse,
    id: generateId("p"),
    treeId,
    createdAt: now,
    updatedAt: now,
  };

  const error = validatePartnership(
    personId,
    newPerson.id,
    status,
    snapshot.partnerships,
  );
  if (error) throw new Error(error);

  const newPartnership: Partnership = {
    id: generateId("ps"),
    treeId,
    personAId: personId,
    personBId: newPerson.id,
    status,
    createdAt: now,
    updatedAt: now,
  };

  await IndexedDbFamilyTreeRepository.savePerson(newPerson);
  await IndexedDbFamilyTreeRepository.savePartnership(newPartnership);

  return {
    ...snapshot,
    people: [...snapshot.people, newPerson],
    partnerships: [...snapshot.partnerships, newPartnership],
  };
}
