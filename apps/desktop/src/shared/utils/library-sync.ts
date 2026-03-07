import type { GameMetadata, LibraryIndexEntry, LibraryItem } from "../types";

export function mapDetectedGamesToSyncItems(games: GameMetadata[]) {
  return games.map((game) => {
    const normalizedPlatform = game.platform?.trim() || "Manual";
    const source = normalizedPlatform === "Steam" ? "steam" : "manual";
    const externalId = source === "steam" ? game.app_id || game.exe_name : game.exe_name;

    return {
      game: {
        externalId,
        source,
        name: game.name,
        metadata: {
          exeName: game.exe_name,
          detectedPlatform: normalizedPlatform,
          appId: game.app_id || null,
          icon: game.icon || null,
        },
      },
      library: {
        platform: normalizedPlatform,
        isInstalled: true,
      },
    };
  });
}

export function buildLibraryIndex(library: LibraryItem[]): LibraryIndexEntry[] {
  const entries: LibraryIndexEntry[] = [];

  for (const item of library) {
    const metadata = item.game.metadata;
    if (!metadata || typeof metadata !== "object") {
      continue;
    }

    const exeNameCandidate = (metadata as Record<string, unknown>).exeName;
    if (typeof exeNameCandidate !== "string" || exeNameCandidate.trim().length === 0) {
      continue;
    }

    entries.push({
      exe_name: exeNameCandidate,
      game_id: item.game.id,
    });
  }

  return entries;
}
