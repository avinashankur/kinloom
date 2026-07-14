import { create } from "zustand";
import type { FamilyTreeSnapshot } from "@/entities/family-tree/model/family-tree";

interface FamilyTreeStoreState {
  snapshot: FamilyTreeSnapshot | null;
  isLoading: boolean;
  error: string | null;

  setSnapshot: (snapshot: FamilyTreeSnapshot) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFamilyTreeStore = create<FamilyTreeStoreState>((set) => ({
  snapshot: null,
  isLoading: true,
  error: null,

  setSnapshot: (snapshot) => set({ snapshot, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));
