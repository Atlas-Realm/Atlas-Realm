export interface ApiErrorShape {
  success: false;
  error: string;
  code?: string;
}

export interface ApiSuccessShape<T> {
  success: true;
  data: T;
}

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
