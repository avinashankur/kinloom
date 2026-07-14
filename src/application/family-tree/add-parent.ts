import type { Person } from "@/entities/person/model/person";
import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import type { ParentChildRelationship } from "@/entities/relationship/model/parent-child-relationship";
import { validateParentChild } from "@/domain/family-tree/rules/validate-parent-child";
import { IndexedDbFamilyTreeRepository } from "@/infrastructure/persistence/repositories/indexed-db-family-tree-repository";
import { generateId } from "@/shared/lib/ids";
import { nowIso } from "@/shared/lib/dates";

interface AddParentInput {
  snapshot: FamilyTreeSnapshot;
  childId: string;
  parent: Omit<Person, "id" | "treeId" | "createdAt" | "updatedAt">;
}

export async function addParent({
  snapshot,
  childId,
  parent,
}: AddParentInput): Promise<FamilyTreeSnapshot> {
  const treeId = snapshot.tree.id;
  const now = nowIso();

  const newPerson: Person = {
    ...parent,
    id: generateId("p"),
    treeId,
    createdAt: now,
    updatedAt: now,
  };

  const error = validateParentChild(
    newPerson.id,
    childId,
    treeId,
    snapshot.parentChildRelationships,
  );
  if (error) throw new Error(error);

  const newRelationship: ParentChildRelationship = {
    id: generateId("r"),
    treeId,
    parentId: newPerson.id,
    childId,
    createdAt: now,
  };

  await IndexedDbFamilyTreeRepository.savePerson(newPerson);
  await IndexedDbFamilyTreeRepository.saveParentChildRelationship(
    newRelationship,
  );

  return {
    ...snapshot,
    people: [...snapshot.people, newPerson],
    parentChildRelationships: [
      ...snapshot.parentChildRelationships,
      newRelationship,
    ],
  };
}
