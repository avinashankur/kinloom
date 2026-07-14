import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";
import type { Partnership } from "@/entities/relationship/model/partnership";
import { IndexedDbFamilyTreeRepository } from "@/infrastructure/persistence/repositories/indexed-db-family-tree-repository";

interface UpdatePartnershipInput {
  snapshot: FamilyTreeSnapshot;
  partnershipId: string;
  status: Partnership["status"];
}

export async function updatePartnership({
  snapshot,
  partnershipId,
  status,
}: UpdatePartnershipInput): Promise<FamilyTreeSnapshot> {
  const existing = snapshot.partnerships.find((p) => p.id === partnershipId);
  if (!existing) throw new Error("PARTNERSHIP_NOT_FOUND");

  await IndexedDbFamilyTreeRepository.updatePartnership(partnershipId, status);

  return {
    ...snapshot,
    partnerships: snapshot.partnerships.map((p) =>
      p.id === partnershipId ? { ...p, status } : p,
    ),
  };
}
