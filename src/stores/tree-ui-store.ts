import { create } from "zustand";

interface TreeUIState {
  activePersonId: string | null;
  searchOpen: boolean;
  detailsOpen: boolean;
  fullscreen: boolean;
  contextMenuPersonId: string | null;

  setActivePerson: (personId: string | null) => void;
  openSearch: () => void;
  closeSearch: () => void;
  openDetails: () => void;
  closeDetails: () => void;
  setFullscreen: (value: boolean) => void;
  openContextMenu: (personId: string) => void;
  closeContextMenu: () => void;
}

export const useTreeUIStore = create<TreeUIState>((set) => ({
  activePersonId: null,
  searchOpen: false,
  detailsOpen: false,
  fullscreen: false,
  contextMenuPersonId: null,

  setActivePerson: (personId) => set({ activePersonId: personId }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  openDetails: () => set({ detailsOpen: true }),
  closeDetails: () => set({ detailsOpen: false }),
  setFullscreen: (value) => set({ fullscreen: value }),
  openContextMenu: (personId) => set({ contextMenuPersonId: personId }),
  closeContextMenu: () => set({ contextMenuPersonId: null }),
}));
