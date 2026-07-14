export type PartnershipStatus = "married" | "divorced" | "widowed";

export interface Partnership {
  id: string;
  treeId: string;

  personAId: string;
  personBId: string;

  status: PartnershipStatus;

  createdAt: string;
  updatedAt: string;
}
