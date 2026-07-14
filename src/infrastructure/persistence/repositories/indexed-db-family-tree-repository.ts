import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import type { Person } from "@/entities/person/model/person";
import type { Partnership } from "@/entities/relationship/model/partnership";
import type { ParentChildRelationship } from "@/entities/relationship/model/parent-child-relationship";
import { db } from "../database/family-tree-db";

/**
 * All persistence operations are isolated behind this repository.
 * The rest of the application never calls Dexie directly.
 */
export const IndexedDbFamilyTreeRepository = {
  async load(): Promise<FamilyTreeSnapshot | null> {
    const trees = await db.familyTrees.toArray();
    if (trees.length === 0) return null;
    const tree = trees[0];
    const [people, partnerships, parentChildRelationships] = await Promise.all([
      db.people.where("treeId").equals(tree.id).toArray(),
      db.partnerships.where("treeId").equals(tree.id).toArray(),
      db.parentChildRelationships.where("treeId").equals(tree.id).toArray(),
    ]);
    return { tree, people, partnerships, parentChildRelationships };
  },

  async savePerson(person: Person): Promise<void> {
    await db.people.put(person);
  },



  async savePartnership(partnership: Partnership): Promise<void> {
    await db.partnerships.put(partnership);
  },

  async updatePartnership(
    partnershipId: string,
    status: Partnership["status"],
  ): Promise<void> {
    await db.partnerships.update(partnershipId, {
      status,
      updatedAt: new Date().toISOString(),
    });
  },

  async saveParentChildRelationship(
    relationship: ParentChildRelationship,
  ): Promise<void> {
    await db.parentChildRelationships.put(relationship);
  },

  async replace(snapshot: FamilyTreeSnapshot): Promise<void> {
    await db.transaction(
      "rw",
      db.familyTrees,
      db.people,
      db.partnerships,
      db.parentChildRelationships,
      async () => {
        await db.familyTrees.clear();
        await db.people.clear();
        await db.partnerships.clear();
        await db.parentChildRelationships.clear();
        await db.familyTrees.add(snapshot.tree);
        await db.people.bulkAdd(snapshot.people);
        await db.partnerships.bulkAdd(snapshot.partnerships);
        await db.parentChildRelationships.bulkAdd(
          snapshot.parentChildRelationships,
        );
      },
    );
  },

  async clear(): Promise<void> {
    await db.transaction(
      "rw",
      db.familyTrees,
      db.people,
      db.partnerships,
      db.parentChildRelationships,
      async () => {
        await db.familyTrees.clear();
        await db.people.clear();
        await db.partnerships.clear();
        await db.parentChildRelationships.clear();
      },
    );
  },
};
