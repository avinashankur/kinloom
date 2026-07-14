import type { Person } from "@/entities/person/model/person";
import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import type { ParentChildRelationship } from "@/entities/relationship/model/parent-child-relationship";
import { validateParentChild } from "@/domain/family-tree/rules/validate-parent-child";
import { IndexedDbFamilyTreeRepository } from "@/infrastructure/persistence/repositories/indexed-db-family-tree-repository";
import { generateId } from "@/shared/lib/ids";
import { nowIso } from "@/shared/lib/dates";

interface AddChildInput {
  snapshot: FamilyTreeSnapshot;
  parentIds: string[]; // at least one
  child: Omit<Person, "id" | "treeId" | "createdAt" | "updatedAt">;
}

export async function addChild({
  snapshot,
  parentIds,
  child,
}: AddChildInput): Promise<FamilyTreeSnapshot> {
  const treeId = snapshot.tree.id;
  const now = nowIso();

  const newPerson: Person = {
    ...child,
    id: generateId("p"),
    treeId,
    createdAt: now,
    updatedAt: now,
  };

  const newRelationships: ParentChildRelationship[] = [];
  const allRelationships = [...snapshot.parentChildRelationships];

  for (const parentId of parentIds) {
    const error = validateParentChild(
      parentId,
      newPerson.id,
      treeId,
      allRelationships,
    );
    if (error) throw new Error(error);
    const rel: ParentChildRelationship = {
      id: generateId("r"),
      treeId,
      parentId,
      childId: newPerson.id,
      createdAt: now,
    };
    newRelationships.push(rel);
    allRelationships.push(rel);
  }

  await IndexedDbFamilyTreeRepository.savePerson(newPerson);
  for (const rel of newRelationships) {
    await IndexedDbFamilyTreeRepository.saveParentChildRelationship(rel);
  }

  return {
    ...snapshot,
    people: [...snapshot.people, newPerson],
    parentChildRelationships: [
      ...snapshot.parentChildRelationships,
      ...newRelationships,
    ],
  };
}
