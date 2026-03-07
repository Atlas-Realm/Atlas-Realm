import type { Game, NewGame, NewUserGame, UserGame } from "@/db/schema";

export type GameSearchSource = "rawg" | "steam";

export type GameSearchResult = {
  externalId: string;
  source: GameSearchSource;
  name: string;
  metadata: Record<string, unknown>;
};

export type LibraryGameInput = {
  id?: string;
  externalId?: string | null;
  source: "steam" | "rawg" | "igdb" | "manual";
  name: string;
  metadata?: Record<string, unknown> | null;
};

export type LibraryEntryInput = {
  game: LibraryGameInput;
  library?: {
    platform?: string;
    isInstalled?: boolean;
    installPath?: string | null;
    lastPlayedAt?: Date | null;
    totalPlaytimeSeconds?: number;
  };
};

export type UserLibraryItem = {
  library: UserGame;
  game: Game;
};

export interface IGamesRepository {
  findByExternalId(externalId: string, source: Game["source"]): Promise<Game | undefined>;
  findById(id: string): Promise<Game | undefined>;
  upsertGame(data: NewGame): Promise<Game>;
  upsertUserGame(data: NewUserGame): Promise<UserGame>;
  findUserLibrary(userId: string): Promise<UserLibraryItem[]>;
  findUserGame(userId: string, gameId: string): Promise<UserGame | undefined>;
  updateUserGame(
    userId: string,
    gameId: string,
    data: Partial<Pick<NewUserGame, "platform" | "isInstalled" | "installPath" | "lastPlayedAt" | "totalPlaytimeSeconds">>,
  ): Promise<UserGame | undefined>;
  deleteUserGame(userId: string, gameId: string): Promise<boolean>;
}

export interface IGamesService {
  search(query: string, source?: GameSearchSource): Promise<GameSearchResult[]>;
  getById(id: string): Promise<Game | undefined>;
  getLibrary(userId: string): Promise<UserLibraryItem[]>;
  addToLibrary(userId: string, input: LibraryEntryInput): Promise<UserLibraryItem>;
  syncLibrary(userId: string, items: LibraryEntryInput[]): Promise<{ synced: number }>;
  updateLibraryItem(
    userId: string,
    gameId: string,
    input: {
      platform?: string;
      isInstalled?: boolean;
      installPath?: string | null;
      lastPlayedAt?: Date | null;
      totalPlaytimeSeconds?: number;
    },
  ): Promise<UserLibraryItem>;
  removeLibraryItem(userId: string, gameId: string): Promise<{ deleted: true }>;
}
