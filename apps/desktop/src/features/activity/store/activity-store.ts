import { create } from "zustand";
import type { LocalActivityPost } from "../../../shared/types";

type ActivityStoreState = {
  localPosts: LocalActivityPost[];
  addLocalPost: (input: Omit<LocalActivityPost, "id" | "createdAt">) => void;
  reset: () => void;
};

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}`;
}

export const useActivityStore = create<ActivityStoreState>((set) => ({
  localPosts: [],
  addLocalPost: (input) =>
    set((state) => ({
      localPosts: [
        {
          id: createId(),
          createdAt: new Date().toISOString(),
          ...input,
        },
        ...state.localPosts,
      ],
    })),
  reset: () => set({ localPosts: [] }),
}));
