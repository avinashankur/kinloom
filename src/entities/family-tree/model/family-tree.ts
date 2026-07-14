import type { Partnership } from "@/entities/relationship/model/partnership";
import type { ParentChildRelationship } from "@/entities/relationship/model/parent-child-relationship";
import type { Person } from "@/entities/person/model/person";

export interface FamilyTree {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyTreeSnapshot {
  tree: FamilyTree;
  people: Person[];
  partnerships: Partnership[];
  parentChildRelationships: ParentChildRelationship[];
}
