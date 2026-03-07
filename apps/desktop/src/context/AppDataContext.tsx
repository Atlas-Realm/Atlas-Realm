import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { gamesApi } from "../lib/api";
import { buildLibraryIndex, mapDetectedGamesToSyncItems } from "../lib/library-sync";
import { onSessionUpdate, scanGames, setLibraryIndex } from "../lib/tauri";
import type { LibraryItem, LocalSession } from "../types";
import { useAuth } from "./AuthContext";

type AppDataContextValue = {
  library: LibraryItem[];
  libraryLoading: boolean;
  syncing: boolean;
  localSessions: LocalSession[];
  refreshLibrary: () => Promise<void>;
  syncLocalLibrary: () => Promise<void>;
  setLibrary: (items: LibraryItem[]) => void;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [localSessions, setLocalSessions] = useState<LocalSession[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const refreshLibrary = useCallback(async () => {
    if (!isAuthenticated) {
      setLibrary([]);
      await setLibraryIndex([]);
      return;
    }

    setLibraryLoading(true);
    try {
      const libraryItems = await gamesApi.listLibrary();
      setLibrary(libraryItems);
      await setLibraryIndex(buildLibraryIndex(libraryItems));
    } finally {
      setLibraryLoading(false);
    }
  }, [isAuthenticated]);

  const syncLocalLibrary = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setSyncing(true);
    try {
      const detected = await scanGames();
      const items = mapDetectedGamesToSyncItems(detected);
      if (items.length > 0) {
        await gamesApi.syncLibrary(items);
      }
      await refreshLibrary();
    } finally {
      setSyncing(false);
    }
  }, [isAuthenticated, refreshLibrary]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLibrary([]);
      setLocalSessions([]);
      void setLibraryIndex([]);
      return;
    }

    void syncLocalLibrary();
  }, [isAuthenticated, syncLocalLibrary]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setup = async () => {
      unlisten = await onSessionUpdate((sessions) => {
        setLocalSessions(sessions);
      });
    };

    void setup();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      library,
      libraryLoading,
      syncing,
      localSessions,
      refreshLibrary,
      syncLocalLibrary,
      setLibrary,
    }),
    [library, libraryLoading, syncing, localSessions, refreshLibrary, syncLocalLibrary],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
