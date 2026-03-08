import type {
  ActivityFeedItem,
  ActivityRecord,
  FriendListItem,
  GameDetailViewModel,
  LibraryItem,
  LocalActivityPost,
  NotificationItem,
  ServerGame,
  UserProfile,
} from "../types";

export function formatHours(totalSeconds: number): string {
  return `${(totalSeconds / 3600).toFixed(1)}h`;
}

export function formatLargeHours(totalSeconds: number): string {
  return `${Math.round(totalSeconds / 3600)}h`;
}

export function formatDate(date: string | null | undefined, locale: string): string {
  if (!date) return locale === "tr" ? "Bilinmiyor" : "Unknown";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string, locale: string): string {
  const diffSeconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const thresholds: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unit, size] of thresholds) {
    if (Math.abs(diffSeconds) >= size) {
      return rtf.format(Math.round(diffSeconds / size), unit);
    }
  }

  return rtf.format(diffSeconds, "second");
}

export function displayName(value: { displayName?: string | null; username?: string | null; email?: string | null }) {
  return value.displayName || value.username || value.email || "Atlas User";
}

export function extractMetadataValue(metadata: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return null;
}

export function extractGenres(metadata: Record<string, unknown> | null | undefined): string[] {
  if (!metadata) return [];

  const raw = metadata.genres;
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object" && "name" in entry && typeof entry.name === "string") {
          return entry.name;
        }
        return null;
      })
      .filter((entry): entry is string => Boolean(entry));
  }

  return [];
}

export function deriveCategory(item: LibraryItem): string {
  const genres = extractGenres(item.game.metadata as Record<string, unknown> | null | undefined);
  if (genres.length > 0) return genres[0];

  const name = item.game.name.toLowerCase();
  if (name.includes("ring") || name.includes("souls")) return "Action RPG";
  if (name.includes("cyber") || name.includes("neon")) return "Cyberpunk";
  if (name.includes("star") || name.includes("space")) return "Sci-Fi";
  if (name.includes("forest") || name.includes("myst")) return "Adventure";
  return "Collection";
}

export function resolveGameImage(game: ServerGame): string | null {
  const metadata = game.metadata as Record<string, unknown> | null | undefined;
  if (!metadata) return null;

  const candidates = [
    metadata.backgroundImage,
    metadata.background_image,
    metadata.cover_image,
    metadata.coverUrl,
    metadata.heroImage,
    metadata.tinyImage,
    metadata.icon,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }

  return null;
}

export function buildGameDetailViewModel(game: ServerGame, library: LibraryItem["library"] | null): GameDetailViewModel {
  const metadata = game.metadata as Record<string, unknown> | null | undefined;

  return {
    game,
    library,
    heroImage: resolveGameImage(game),
    description: extractMetadataValue(metadata, ["description", "short_description", "summary"]),
    developer: extractMetadataValue(metadata, ["developer", "developers"]),
    publisher: extractMetadataValue(metadata, ["publisher", "publishers"]),
    releaseDate: extractMetadataValue(metadata, ["release_date", "released"]),
    genres: extractGenres(metadata),
  };
}

export function enrichFriendPresence(friend: FriendListItem) {
  // TODO(api-gap): online status and current game are not returned by the friends API yet.
  const seed = friend.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const variants = [
    { status: "online" as const, label: "Online now", game: null },
    { status: "away" as const, label: "Away", game: null },
    { status: "playing" as const, label: "Playing now", game: seed % 2 === 0 ? "Cyberpunk 2077" : "Valorant" },
    { status: "offline" as const, label: "Offline", game: null },
  ];
  return variants[seed % variants.length];
}

export function mapActivitiesToFeedItems(input: {
  activities: ActivityRecord[];
  localPosts: LocalActivityPost[];
  friends: FriendListItem[];
  me: UserProfile | null | undefined;
}): ActivityFeedItem[] {
  const friendMap = new Map(input.friends.map((friend) => [friend.id, friend]));

  const serverItems = input.activities.map((activity) => {
    const actor = activity.actorId === input.me?.id ? input.me : friendMap.get(activity.actorId);
    const payload = activity.payload ?? {};
    const gameName = typeof payload.gameName === "string" ? payload.gameName : null;
    const body =
      typeof payload.body === "string"
        ? payload.body
        : activity.type === "games.library.added"
          ? `${gameName ?? "A game"} was added to the library.`
          : activity.type === "games.library.removed"
            ? `A title was removed from the library.`
            : activity.type === "social.friend.accepted"
              ? `Accepted a new friend request.`
              : `Shared a launcher update.`;

    return {
      id: activity.id,
      actorId: activity.actorId,
      actorName: displayName(actor ?? { username: `Player ${activity.actorId.slice(0, 6)}` }),
      actorAvatarUrl: actor?.avatarUrl ?? null,
      createdAt: activity.createdAt,
      body,
      title: gameName ? gameName : activity.type.split(".").join(" "),
      source: "server" as const,
      accentLabel: activity.visibility,
    };
  });

  const localItems = input.localPosts.map((post) => ({
    id: post.id,
    actorId: post.actorId,
    actorName: post.actorName,
    actorAvatarUrl: post.actorAvatarUrl,
    createdAt: post.createdAt,
    body: post.body,
    title: "Status Update",
    source: "local" as const,
    accentLabel: "local",
  }));

  return [...localItems, ...serverItems].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function notificationUnreadCount(notifications: NotificationItem[]) {
  return notifications.filter((item) => !item.readAt).length;
}
