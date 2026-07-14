import type { Person } from "@/entities/person/model/person";
import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import { IndexedDbFamilyTreeRepository } from "@/infrastructure/persistence/repositories/indexed-db-family-tree-repository";
import { generateId } from "@/shared/lib/ids";
import { nowIso } from "@/shared/lib/dates";

interface AddPersonInput {
  snapshot: FamilyTreeSnapshot;
  person: Omit<Person, "id" | "treeId" | "createdAt" | "updatedAt">;
}

export async function addPerson({
  snapshot,
  person,
}: AddPersonInput): Promise<FamilyTreeSnapshot> {
  const treeId = snapshot.tree.id;
  const now = nowIso();

  const newPerson: Person = {
    ...person,
    id: generateId("p"),
    treeId,
    createdAt: now,
    updatedAt: now,
  };

  await IndexedDbFamilyTreeRepository.savePerson(newPerson);

  return {
    ...snapshot,
    people: [...snapshot.people, newPerson],
  };
}
