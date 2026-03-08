export interface ApiErrorShape {
  success: false;
  error: string;
  code?: string;
}

export interface ApiSuccessShape<T> {
  success: true;
  data: T;
}

export type UILocale = "tr" | "en";

export type UITheme = "atlas-glass" | "atlas-ocean" | "atlas-frost" | "atlas-carbon";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: "friend_request" | "friend_accept" | "chat_message" | "activity" | "system";
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface FriendListItem {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface PendingFriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  sender: FriendListItem;
}

export interface ActivityRecord {
  id: string;
  actorId: string;
  type: string;
  payload: Record<string, unknown> | null;
  visibility: "public" | "friends" | "private";
  createdAt: string;
}

export interface ActivityFeedItem {
  id: string;
  actorId: string;
  actorName: string;
  actorAvatarUrl: string | null;
  createdAt: string;
  body: string;
  title: string;
  source: "server" | "local";
  accentLabel: string;
}

export interface LocalActivityPost {
  id: string;
  actorId: string;
  actorName: string;
  actorAvatarUrl: string | null;
  body: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface GameMetadata {
  name: string;
  exe_name: string;
  platform: string;
  app_id?: string | null;
  icon?: string | null;
  cover_image?: string | null;
  developer?: string | null;
  publisher?: string | null;
  genres?: string[];
  description?: string | null;
  release_date?: string | null;
}

export interface LocalSession {
  id?: number;
  game_name: string;
  process_id: number;
  start_time: string;
  last_seen: string;
  duration_seconds: number;
  is_active: boolean;
}

export interface ServerGame {
  id: string;
  externalId: string | null;
  source: "steam" | "rawg" | "igdb" | "manual";
  name: string;
  metadata: Record<string, unknown> | null;
  lastFetchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameDetailViewModel {
  game: ServerGame;
  library: LibraryRow | null;
  heroImage: string | null;
  description: string | null;
  developer: string | null;
  publisher: string | null;
  releaseDate: string | null;
  genres: string[];
}

export interface LibraryRow {
  id: string;
  userId: string;
  gameId: string;
  platform: string;
  isInstalled: boolean;
  installPath: string | null;
  lastPlayedAt: string | null;
  totalPlaytimeSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryItem {
  library: LibraryRow;
  game: ServerGame;
}

export interface GameSearchResult {
  externalId: string;
  source: "rawg" | "steam";
  name: string;
  metadata: Record<string, unknown>;
}

export interface SessionModel {
  id: string;
  userId: string;
  gameId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  lastHeartbeatAt: string | null;
  status: "active" | "paused" | "completed";
}

export interface SessionStats {
  gameId: string;
  totalSessions: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  lastSessionAt: string | null;
}

export interface LibraryIndexEntry {
  exe_name: string;
  game_id: string;
}
