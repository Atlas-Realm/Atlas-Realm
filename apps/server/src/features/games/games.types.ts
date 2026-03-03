import type { Game, NewGame } from "@/db/schema";

export interface IGamesRepository {
  findByExternalId(externalId: string, source: string): Promise<Game | undefined>;
  findById(id: string): Promise<Game | undefined>;
  upsert(data: NewGame): Promise<Game>;
  findUserGames(userId: string): Promise<Game[]>;
}

export interface IGamesService {
  search(query: string, source?: "rawg" | "steam"): Promise<GameSearchResult[]>;
  getById(id: string): Promise<Game | undefined>;
}

export type GameSearchResult = {
  externalId: string;
  source: "rawg" | "steam";
  name: string;
  metadata: Record<string, unknown>;
};
