import { create } from "zustand";
import { onSessionUpdate } from "../../../shared/tauri/client";
import type { LocalSession } from "../../../shared/types";

type SessionStoreState = {
  localSessions: LocalSession[];
  listenerReady: boolean;
  ensureListener: () => Promise<void>;
  reset: () => void;
};

let listenerPromise: Promise<void> | null = null;

export const useSessionStore = create<SessionStoreState>((set) => ({
  localSessions: [],
  listenerReady: false,
  ensureListener: async () => {
    if (!listenerPromise) {
      listenerPromise = onSessionUpdate((sessions) => {
        useSessionStore.setState({ localSessions: sessions, listenerReady: true });
      }).then(() => {
        useSessionStore.setState({ listenerReady: true });
      });
    }

    await listenerPromise;
  },
  reset: () => set({ localSessions: [], listenerReady: false }),
}));
