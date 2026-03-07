import { create } from "zustand";

type UiStoreState = {
  mobileDrawerOpen: boolean;
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
};

export const useUiStore = create<UiStoreState>((set) => ({
  mobileDrawerOpen: false,
  toggleMobileDrawer: () => set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
  closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
}));
