use rusqlite::{params, Connection, Result};
use crate::models::GameSession;
use chrono::{DateTime, Local};
use std::path::PathBuf;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(app_dir: PathBuf) -> Result<Self> {
        let db_path = app_dir.join("sessions.db");
        let conn = Connection::open(db_path)?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS game_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_name TEXT NOT NULL,
                process_id INTEGER NOT NULL,
                start_time TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                duration_seconds INTEGER NOT NULL,
                is_active BOOLEAN NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS game_metadata (
                exe_name TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                platform TEXT NOT NULL,
                app_id TEXT,
                icon TEXT,
                cover_image TEXT,
                developer TEXT,
                publisher TEXT,
                genres TEXT,
                description TEXT,
                release_date TEXT,
                last_updated TEXT NOT NULL
            )",
            [],
        )?;
        
        Ok(Self { conn })
    }

    pub fn save_or_update_session(&self, session: &mut GameSession) -> Result<()> {
        if let Some(id) = session.id {
            self.conn.execute(
                "UPDATE game_sessions SET 
                    last_seen = ?1, 
                    duration_seconds = ?2, 
                    is_active = ?3 
                 WHERE id = ?4",
                params![
                    session.last_seen.to_rfc3339(),
                    session.duration_seconds,
                    session.is_active,
                    id,
                ],
            )?;
        } else {
            self.conn.execute(
                "INSERT INTO game_sessions (game_name, process_id, start_time, last_seen, duration_seconds, is_active)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    session.game_name,
                    session.process_id,
                    session.start_time.to_rfc3339(),
                    session.last_seen.to_rfc3339(),
                    session.duration_seconds,
                    session.is_active,
                ],
            )?;
            session.id = Some(self.conn.last_insert_rowid());
        }
        Ok(())
    }

    pub fn save_metadata(&self, metadata: &crate::models::GameMetadata) -> Result<()> {
        let genres_json = serde_json::to_string(&metadata.genres).unwrap_or_else(|_| "[]".to_string());
        
        self.conn.execute(
            "INSERT OR REPLACE INTO game_metadata (
                exe_name, name, platform, app_id, icon, cover_image, 
                developer, publisher, genres, description, release_date, last_updated
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                metadata.exe_name,
                metadata.name,
                metadata.platform,
                metadata.app_id,
                metadata.icon,
                metadata.cover_image,
                metadata.developer,
                metadata.publisher,
                genres_json,
                metadata.description,
                metadata.release_date,
                Local::now().to_rfc3339(),
            ],
        )?;
        Ok(())
    }

    pub fn clear_metadata_cache(&self) -> Result<()> {
        self.conn.execute("DELETE FROM game_metadata", [])?;
        Ok(())
    }

    pub fn get_metadata(&self, exe_name: &str) -> Result<Option<crate::models::GameMetadata>> {
        const CACHE_TTL_DAYS: i64 = 7;
        
        let mut stmt = self.conn.prepare(
            "SELECT name, platform, app_id, icon, cover_image, developer, publisher, genres, description, release_date, last_updated FROM game_metadata WHERE exe_name = ?1",
        )?;
        
        let mut rows = stmt.query(params![exe_name])?;
        
        if let Some(row) = rows.next()? {
            let last_updated: String = row.get(10)?;
            if let Ok(cached_time) = DateTime::parse_from_rfc3339(&last_updated) {
                let age = Local::now().signed_duration_since(cached_time.with_timezone(&Local));
                if age.num_days() > CACHE_TTL_DAYS {
                    return Ok(None);
                }
            }
            
            let genres_json: String = row.get(7)?;
            let genres: Vec<String> = serde_json::from_str(&genres_json).unwrap_or_default();
            
            Ok(Some(crate::models::GameMetadata {
                exe_name: exe_name.to_string(),
                name: row.get(0)?,
                platform: row.get(1)?,
                app_id: row.get(2)?,
                icon: row.get(3)?,
                cover_image: row.get(4)?,
                developer: row.get(5)?,
                publisher: row.get(6)?,
                genres,
                description: row.get(8)?,
                release_date: row.get(9)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn load_sessions(&self) -> Result<Vec<GameSession>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, game_name, process_id, start_time, last_seen, duration_seconds, is_active FROM game_sessions ORDER BY start_time DESC",
        )?;
        let session_iter = stmt.query_map([], |row| {
            let start_time_str: String = row.get(3)?;
            let last_seen_str: String = row.get(4)?;
            
            let start_time = DateTime::parse_from_rfc3339(&start_time_str)
                .map(|dt| dt.with_timezone(&Local))
                .unwrap_or_else(|_| Local::now());
            let last_seen = DateTime::parse_from_rfc3339(&last_seen_str)
                .map(|dt| dt.with_timezone(&Local))
                .unwrap_or_else(|_| Local::now());

            Ok(GameSession {
                id: Some(row.get(0)?),
                game_name: row.get(1)?,
                process_id: row.get(2)?,
                start_time,
                last_seen,
                duration_seconds: row.get(5)?,
                is_active: row.get(6)?,
                needs_save: false,
            })
        })?;

        let mut sessions = Vec::new();
        for session in session_iter {
            sessions.push(session?);
        }
        Ok(sessions)
    }
}

use tauri::Manager;

pub fn get_db_path(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."))
}
