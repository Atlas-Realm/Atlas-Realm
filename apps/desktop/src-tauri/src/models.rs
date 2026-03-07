use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Debug, Clone)]
pub struct GameSession {
    pub id: Option<i64>,
    pub game_name: String,
    pub process_id: u32,
    pub start_time: DateTime<Local>,
    pub last_seen: DateTime<Local>,
    pub duration_seconds: i64,
    pub is_active: bool,
    #[serde(skip)]
    pub remote_session_id: Option<String>,
    #[serde(skip)]
    pub heartbeat_duration_sent: i64,
    #[serde(skip)]
    pub end_synced: bool,
    #[serde(skip)]
    pub needs_save: bool,
}

#[derive(Serialize, Debug, Clone)]
pub struct GameMetadata {
    pub name: String,
    pub exe_name: String,
    pub platform: String,
    pub app_id: Option<String>,
    pub icon: Option<String>,
    pub cover_image: Option<String>,
    pub developer: Option<String>,
    pub publisher: Option<String>,
    pub genres: Vec<String>,
    pub description: Option<String>,
    pub release_date: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ProcessInfo {
    pub name: String,
    pub pid: u32,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct LibraryIndexEntry {
    pub exe_name: String,
    pub game_id: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum QueuedSessionEvent {
    Heartbeat { session_id: String, duration_seconds: i64 },
    End { session_id: String, duration_seconds: i64 },
}
