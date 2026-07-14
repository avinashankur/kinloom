import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import { IndexedDbFamilyTreeRepository } from "@/infrastructure/persistence/repositories/indexed-db-family-tree-repository";

interface DeletePersonInput {
  snapshot: FamilyTreeSnapshot;
  personId: string;
}

export async function deletePerson({
  snapshot,
  personId,
}: DeletePersonInput): Promise<FamilyTreeSnapshot> {
  // Find all descendants to delete
  const toDelete = new Set<string>();
  
  function collectDescendants(id: string) {
    if (toDelete.has(id)) return;
    toDelete.add(id);
    
    // Find all children of this person
    const children = snapshot.parentChildRelationships
      .filter((r) => r.parentId === id)
      .map((r) => r.childId);
      
    for (const childId of children) {
      collectDescendants(childId);
    }
  }
  
  collectDescendants(personId);

  const newSnapshot = {
    ...snapshot,
    people: snapshot.people.filter((p) => !toDelete.has(p.id)),
    partnerships: snapshot.partnerships.filter(
      (p) => !toDelete.has(p.personAId) && !toDelete.has(p.personBId),
    ),
    parentChildRelationships: snapshot.parentChildRelationships.filter(
      (r) => !toDelete.has(r.parentId) && !toDelete.has(r.childId),
    ),
  };

  await IndexedDbFamilyTreeRepository.replace(newSnapshot);

  return newSnapshot;
}
