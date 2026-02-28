export interface GameSession {
  id?: number;
  game_name: string;
  process_id: number;
  start_time: string;
  last_seen: string;
  duration_seconds: number;
  is_active: boolean;
}

export interface GameMetadata {
  name: string;
  exe_name: string;
  platform: string;
  app_id?: string;
  icon?: string;
  cover_image?: string;
  developer?: string;
  publisher?: string;
  genres?: string[];
  description?: string;
  release_date?: string;
}
