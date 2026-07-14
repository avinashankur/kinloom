import Dexie, { type Table } from "dexie";
import type { FamilyTree } from "@/entities/family-tree/model/family-tree";
import type { Person } from "@/entities/person/model/person";
import type { Partnership } from "@/entities/relationship/model/partnership";
import type { ParentChildRelationship } from "@/entities/relationship/model/parent-child-relationship";

export class FamilyTreeDatabase extends Dexie {
  familyTrees!: Table<FamilyTree>;
  people!: Table<Person>;
  partnerships!: Table<Partnership>;
  parentChildRelationships!: Table<ParentChildRelationship>;

  constructor() {
    super("FamilyTreeDB");
    this.version(1).stores({
      familyTrees: "id",
      people: "id, treeId",
      partnerships: "id, treeId, personAId, personBId",
      parentChildRelationships: "id, treeId, parentId, childId",
    });
  }
}

export const db = new FamilyTreeDatabase();
