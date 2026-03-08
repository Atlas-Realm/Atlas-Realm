export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  games: {
    detail: (gameId: string) => ["games", "detail", gameId] as const,
  },
  library: {
    list: ["library", "list"] as const,
    search: (query: string, source: "rawg" | "steam") =>
      ["library", "search", query, source] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (limit: number, offset: number) => ["notifications", "list", limit, offset] as const,
  },
  social: {
    friends: ["social", "friends"] as const,
    pendingRequests: ["social", "pending-requests"] as const,
  },
  activities: {
    feed: (limit: number, offset: number) => ["activities", "feed", limit, offset] as const,
    me: (limit: number, offset: number) => ["activities", "me", limit, offset] as const,
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
