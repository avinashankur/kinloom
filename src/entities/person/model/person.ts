export type Gender = "male" | "female";

export interface Person {
  id: string;
  treeId: string;

  firstName: string;
  lastName?: string;
  nickname?: string;

  gender: Gender;

  birthDate?: string; // YYYY-MM-DD
  deathDate?: string; // YYYY-MM-DD

  notes?: string;

  createdAt: string;
  updatedAt: string;
}
