use crate::models::{GameSession, QueuedSessionEvent};
use chrono::{DateTime, Local};
use rusqlite::{params, Connection, OptionalExtension, Result};
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
            "CREATE TABLE IF NOT EXISTS auth_tokens (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                access_token TEXT NOT NULL,
                refresh_token TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS api_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            [],
        )?;

        // Legacy table cleanup from metadata enrichment era.
        conn.execute("DROP TABLE IF EXISTS game_metadata", [])?;

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

    pub fn load_sessions(&self) -> Result<Vec<GameSession>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, game_name, process_id, start_time, last_seen, duration_seconds, is_active
             FROM game_sessions
             ORDER BY start_time DESC",
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
                remote_session_id: None,
                heartbeat_duration_sent: 0,
                end_synced: false,
                needs_save: false,
            })
        })?;

        let mut sessions = Vec::new();
        for session in session_iter {
            sessions.push(session?);
        }
        Ok(sessions)
    }

    pub fn set_auth_tokens(&self, access_token: &str, refresh_token: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO auth_tokens (id, access_token, refresh_token, updated_at)
             VALUES (1, ?1, ?2, ?3)
             ON CONFLICT(id) DO UPDATE SET
                access_token = excluded.access_token,
                refresh_token = excluded.refresh_token,
                updated_at = excluded.updated_at",
            params![access_token, refresh_token, Local::now().to_rfc3339()],
        )?;
        Ok(())
    }

    pub fn get_auth_tokens(&self) -> Result<Option<(String, String)>> {
        self.conn
            .query_row(
                "SELECT access_token, refresh_token FROM auth_tokens WHERE id = 1",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()
    }

    pub fn get_access_token(&self) -> Result<Option<String>> {
        self.conn
            .query_row(
                "SELECT access_token FROM auth_tokens WHERE id = 1",
                [],
                |row| row.get(0),
            )
            .optional()
    }

    pub fn clear_auth_tokens(&self) -> Result<()> {
        self.conn.execute("DELETE FROM auth_tokens WHERE id = 1", [])?;
        Ok(())
    }

    pub fn enqueue_session_event(&self, event: &QueuedSessionEvent) -> Result<()> {
        let event_type = match event {
            QueuedSessionEvent::Heartbeat { .. } => "heartbeat",
            QueuedSessionEvent::End { .. } => "end",
        };
        let payload = serde_json::to_string(event).unwrap_or_else(|_| "{}".to_string());
        self.conn.execute(
            "INSERT INTO api_queue (event_type, payload, created_at) VALUES (?1, ?2, ?3)",
            params![event_type, payload, Local::now().to_rfc3339()],
        )?;
        Ok(())
    }

    pub fn load_queue_events(&self, limit: i64) -> Result<Vec<(i64, QueuedSessionEvent)>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, payload
             FROM api_queue
             ORDER BY id ASC
             LIMIT ?1",
        )?;
        let rows = stmt.query_map([limit], |row| {
            let id: i64 = row.get(0)?;
            let payload: String = row.get(1)?;
            let parsed = serde_json::from_str::<QueuedSessionEvent>(&payload)
                .unwrap_or(QueuedSessionEvent::Heartbeat {
                    session_id: String::new(),
                    duration_seconds: 0,
                });
            Ok((id, parsed))
        })?;

        let mut events = Vec::new();
        for row in rows {
            let (id, event) = row?;
            match &event {
                QueuedSessionEvent::Heartbeat { session_id, .. }
                | QueuedSessionEvent::End { session_id, .. } => {
                    if !session_id.is_empty() {
                        events.push((id, event));
                    }
                }
            }
        }

        Ok(events)
    }

    pub fn delete_queue_event(&self, id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM api_queue WHERE id = ?1", [id])?;
        Ok(())
    }
}

use tauri::Manager;

pub fn get_db_path(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
}
