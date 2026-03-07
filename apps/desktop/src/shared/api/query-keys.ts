export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  library: {
    list: ["library", "list"] as const,
    search: (query: string, source: "rawg" | "steam") =>
      ["library", "search", query, source] as const,
  },
  sessions: {
    active: ["sessions", "active"] as const,
    history: ["sessions", "history"] as const,
    stats: (gameId: string) => ["sessions", "stats", gameId] as const,
  },
  profile: {
    me: ["profile", "me"] as const,
  },
};
