mod detectors;
mod models;
mod storage;
mod system;
mod tracker;

use crate::detectors::scan_all_games;
use crate::models::{LibraryIndexEntry, ProcessInfo, QueuedSessionEvent};
use crate::storage::Database;
use crate::system::SystemScanner;
use crate::tracker::SessionTracker;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{Emitter, Manager};

const DEFAULT_API_BASE_URL: &str = "http://127.0.0.1:3000";

#[derive(Debug, Clone)]
struct RuntimeState {
    api_base_url: String,
    library_index: HashMap<String, String>,
}

impl RuntimeState {
    fn new() -> Self {
        let api_base_url = std::env::var("TAURI_API_BASE_URL")
            .ok()
            .filter(|v| !v.trim().is_empty())
            .unwrap_or_else(|| DEFAULT_API_BASE_URL.to_string());
        Self {
            api_base_url: normalize_base_url(&api_base_url),
            library_index: HashMap::new(),
        }
    }
}

#[derive(Debug, Deserialize)]
struct Envelope<T> {
    success: bool,
    data: Option<T>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TokenPair {
    access_token: String,
    refresh_token: String,
}

#[derive(Debug, Deserialize)]
struct RefreshData {
    tokens: TokenPair,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionPayload {
    id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RefreshBody<'a> {
    refresh_token: &'a str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct StartBody<'a> {
    game_id: &'a str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SessionEventBody<'a> {
    session_id: &'a str,
    duration_seconds: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LogoutBody<'a> {
    refresh_token: &'a str,
}

#[tauri::command]
async fn scan_games() -> Result<Vec<crate::models::GameMetadata>, String> {
    let mut games = scan_all_games();
    games.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(games)
}

#[tauri::command]
fn set_auth_tokens(
    access_token: String,
    refresh_token: String,
    db: tauri::State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let db_lock = db.lock().map_err(|e| e.to_string())?;
    db_lock
        .set_auth_tokens(&access_token, &refresh_token)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_access_token(db: tauri::State<'_, Arc<Mutex<Database>>>) -> Result<Option<String>, String> {
    let db_lock = db.lock().map_err(|e| e.to_string())?;
    db_lock.get_access_token().map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_auth_tokens(db: tauri::State<'_, Arc<Mutex<Database>>>) -> Result<(), String> {
    let db_lock = db.lock().map_err(|e| e.to_string())?;
    db_lock.clear_auth_tokens().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_api_base_url(
    api_base_url: String,
    runtime_state: tauri::State<'_, Arc<Mutex<RuntimeState>>>,
) -> Result<(), String> {
    let mut state = runtime_state.lock().map_err(|e| e.to_string())?;
    state.api_base_url = normalize_base_url(&api_base_url);
    Ok(())
}

#[tauri::command]
fn set_library_index(
    entries: Vec<LibraryIndexEntry>,
    runtime_state: tauri::State<'_, Arc<Mutex<RuntimeState>>>,
) -> Result<(), String> {
    let mut state = runtime_state.lock().map_err(|e| e.to_string())?;
    state.library_index.clear();
    for entry in entries {
        state
            .library_index
            .insert(entry.exe_name.to_lowercase(), entry.game_id);
    }
    Ok(())
}

#[tauri::command]
async fn refresh_auth_tokens(
    api_base_url: String,
    db: tauri::State<'_, Arc<Mutex<Database>>>,
) -> Result<Option<String>, String> {
    let base_url = normalize_base_url(&api_base_url);
    refresh_tokens_from_db(&db, &base_url).map(|pair| pair.map(|t| t.access_token))
}

#[tauri::command]
async fn logout_auth(
    api_base_url: String,
    db: tauri::State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let base_url = normalize_base_url(&api_base_url);
    let tokens = {
        let db_lock = db.lock().map_err(|e| e.to_string())?;
        db_lock.get_auth_tokens().map_err(|e| e.to_string())?
    };

    if let Some((access_token, refresh_token)) = tokens {
        let client = reqwest::Client::new();
        let _ = client
            .post(format!("{base_url}/api/auth/logout"))
            .bearer_auth(access_token)
            .json(&LogoutBody {
                refresh_token: &refresh_token,
            })
            .send()
            .await;
    }

    let db_lock = db.lock().map_err(|e| e.to_string())?;
    db_lock.clear_auth_tokens().map_err(|e| e.to_string())
}

fn normalize_base_url(base_url: &str) -> String {
    base_url.trim().trim_end_matches('/').to_string()
}

fn execute_authed_post<TReq, TRes>(
    db: &Arc<Mutex<Database>>,
    base_url: &str,
    path: &str,
    body: &TReq,
) -> Result<TRes, String>
where
    TReq: Serialize + ?Sized,
    TRes: DeserializeOwned,
{
    let base_url = normalize_base_url(base_url);
    tauri::async_runtime::block_on(async {
        let client = reqwest::Client::new();
        let token = {
            let db_lock = db.lock().map_err(|e| e.to_string())?;
            db_lock
                .get_access_token()
                .map_err(|e| e.to_string())?
                .ok_or_else(|| "Missing access token".to_string())?
        };

        let url = format!("{base_url}{path}");
        let mut response = client
            .post(&url)
            .bearer_auth(&token)
            .json(body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status() == reqwest::StatusCode::UNAUTHORIZED {
            let refreshed = refresh_tokens_from_db_async(db, &base_url, &client).await?;
            if let Some(pair) = refreshed {
                response = client
                    .post(&url)
                    .bearer_auth(&pair.access_token)
                    .json(body)
                    .send()
                    .await
                    .map_err(|e| e.to_string())?;
            }
        }

        if !response.status().is_success() {
            return Err(format!("Server returned {}", response.status()));
        }

        let payload: Envelope<TRes> = response.json().await.map_err(|e| e.to_string())?;
        if !payload.success {
            return Err("Server returned unsuccessful response".to_string());
        }

        payload
            .data
            .ok_or_else(|| "Server returned empty data".to_string())
    })
}

fn refresh_tokens_from_db(
    db: &Arc<Mutex<Database>>,
    base_url: &str,
) -> Result<Option<TokenPair>, String> {
    tauri::async_runtime::block_on(async {
        let client = reqwest::Client::new();
        refresh_tokens_from_db_async(db, base_url, &client).await
    })
}

async fn refresh_tokens_from_db_async(
    db: &Arc<Mutex<Database>>,
    base_url: &str,
    client: &reqwest::Client,
) -> Result<Option<TokenPair>, String> {
    let refresh_token = {
        let db_lock = db.lock().map_err(|e| e.to_string())?;
        db_lock
            .get_auth_tokens()
            .map_err(|e| e.to_string())?
            .map(|(_, refresh)| refresh)
    };

    let Some(refresh_token) = refresh_token else {
        return Ok(None);
    };

    let response = client
        .post(format!("{base_url}/api/auth/refresh"))
        .json(&RefreshBody {
            refresh_token: &refresh_token,
        })
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        if response.status() == reqwest::StatusCode::UNAUTHORIZED {
            let db_lock = db.lock().map_err(|e| e.to_string())?;
            let _ = db_lock.clear_auth_tokens();
        }
        return Ok(None);
    }

    let payload: Envelope<RefreshData> = response.json().await.map_err(|e| e.to_string())?;
    if !payload.success {
        return Ok(None);
    }
    let Some(data) = payload.data else {
        return Ok(None);
    };

    {
        let db_lock = db.lock().map_err(|e| e.to_string())?;
        db_lock
            .set_auth_tokens(&data.tokens.access_token, &data.tokens.refresh_token)
            .map_err(|e| e.to_string())?;
    }

    Ok(Some(data.tokens))
}

fn sync_sessions_with_server(
    sessions: &mut [crate::models::GameSession],
    processes: &[ProcessInfo],
    db: &Arc<Mutex<Database>>,
    runtime_state: &Arc<Mutex<RuntimeState>>,
) {
    let state = match runtime_state.lock() {
        Ok(lock) => lock.clone(),
        Err(e) => {
            eprintln!("Failed to lock runtime state: {e}");
            return;
        }
    };

    if state.api_base_url.is_empty() {
        return;
    }

    let pid_to_exe: HashMap<u32, String> = processes
        .iter()
        .map(|p| (p.pid, p.name.to_lowercase()))
        .collect();

    for session in sessions.iter_mut() {
        if session.is_active {
            if session.remote_session_id.is_none() {
                if let Some(exe_name) = pid_to_exe.get(&session.process_id) {
                    if let Some(game_id) = state.library_index.get(exe_name) {
                        let start_result = execute_authed_post::<StartBody<'_>, SessionPayload>(
                            db,
                            &state.api_base_url,
                            "/api/sessions/start",
                            &StartBody { game_id },
                        );
                        if let Ok(payload) = start_result {
                            session.remote_session_id = Some(payload.id);
                            session.heartbeat_duration_sent = 0;
                        }
                    }
                }
            }

            if let Some(remote_session_id) = session.remote_session_id.clone() {
                if session.duration_seconds.saturating_sub(session.heartbeat_duration_sent) >= 60 {
                    let body = SessionEventBody {
                        session_id: &remote_session_id,
                        duration_seconds: session.duration_seconds.max(0),
                    };
                    let heartbeat_result = execute_authed_post::<SessionEventBody<'_>, serde_json::Value>(
                        db,
                        &state.api_base_url,
                        "/api/sessions/heartbeat",
                        &body,
                    );
                    if heartbeat_result.is_ok() {
                        session.heartbeat_duration_sent = session.duration_seconds;
                    } else {
                        session.heartbeat_duration_sent = session.duration_seconds;
                        if let Ok(db_lock) = db.lock() {
                            let _ = db_lock.enqueue_session_event(&QueuedSessionEvent::Heartbeat {
                                session_id: remote_session_id,
                                duration_seconds: session.duration_seconds.max(0),
                            });
                        }
                    }
                }
            }
        } else if !session.end_synced {
            if let Some(remote_session_id) = session.remote_session_id.clone() {
                let body = SessionEventBody {
                    session_id: &remote_session_id,
                    duration_seconds: session.duration_seconds.max(0),
                };
                let end_result = execute_authed_post::<SessionEventBody<'_>, serde_json::Value>(
                    db,
                    &state.api_base_url,
                    "/api/sessions/end",
                    &body,
                );
                if end_result.is_err() {
                    if let Ok(db_lock) = db.lock() {
                        let _ = db_lock.enqueue_session_event(&QueuedSessionEvent::End {
                            session_id: remote_session_id,
                            duration_seconds: session.duration_seconds.max(0),
                        });
                    }
                }
            }
            session.remote_session_id = None;
            session.end_synced = true;
        }
    }

    flush_queue(db, &state.api_base_url);
}

fn flush_queue(db: &Arc<Mutex<Database>>, base_url: &str) {
    let queued_events = {
        let db_lock = match db.lock() {
            Ok(lock) => lock,
            Err(e) => {
                eprintln!("Failed to lock DB for queue load: {e}");
                return;
            }
        };
        db_lock.load_queue_events(100).unwrap_or_default()
    };

    for (id, event) in queued_events {
        let flush_result = match event {
            QueuedSessionEvent::Heartbeat {
                ref session_id,
                duration_seconds,
            } => execute_authed_post::<SessionEventBody<'_>, serde_json::Value>(
                db,
                base_url,
                "/api/sessions/heartbeat",
                &SessionEventBody {
                    session_id,
                    duration_seconds,
                },
            ),
            QueuedSessionEvent::End {
                ref session_id,
                duration_seconds,
            } => execute_authed_post::<SessionEventBody<'_>, serde_json::Value>(
                db,
                base_url,
                "/api/sessions/end",
                &SessionEventBody {
                    session_id,
                    duration_seconds,
                },
            ),
        };

        if flush_result.is_err() {
            break;
        }

        if let Ok(db_lock) = db.lock() {
            let _ = db_lock.delete_queue_event(id);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();

            let db_path = crate::storage::get_db_path(&app_handle);
            if let Err(e) = std::fs::create_dir_all(&db_path) {
                eprintln!("Failed to create app data dir: {e}");
            }

            let db = match Database::new(db_path) {
                Ok(d) => Arc::new(Mutex::new(d)),
                Err(e) => {
                    eprintln!("Failed to init database: {e}");
                    panic!("Database failed to initialize");
                }
            };
            let runtime_state = Arc::new(Mutex::new(RuntimeState::new()));

            app.manage(db.clone());
            app.manage(runtime_state.clone());

            let db_for_thread = db.clone();
            let runtime_for_thread = runtime_state.clone();
            thread::spawn(move || {
                println!("Initializing Session Tracker...");

                let initial_sessions = {
                    let db_lock = db_for_thread.lock().unwrap();
                    db_lock.load_sessions().unwrap_or_else(|e| {
                        eprintln!("Failed to load sessions: {e}");
                        Vec::new()
                    })
                };

                let game_cache = scan_all_games();
                let mut session_tracker = SessionTracker::new(game_cache, initial_sessions);

                let mut system_scanner = match SystemScanner::new() {
                    Ok(s) => s,
                    Err(e) => {
                        eprintln!("Failed to init system scanner: {e}");
                        return;
                    }
                };

                println!("Session Tracker running...");

                loop {
                    match system_scanner.get_running_processes() {
                        Ok(processes) => {
                            session_tracker.update(&processes);

                            let needs_save = session_tracker.sessions.iter().any(|s| s.needs_save);
                            if needs_save {
                                match db_for_thread.lock() {
                                    Ok(db_lock) => {
                                        for session in &mut session_tracker.sessions {
                                            if session.needs_save {
                                                if let Err(e) = db_lock.save_or_update_session(session) {
                                                    eprintln!("Failed to save session: {e}");
                                                } else {
                                                    session.needs_save = false;
                                                }
                                            }
                                        }
                                    }
                                    Err(e) => eprintln!("Failed to lock DB: {e}"),
                                }
                            }

                            sync_sessions_with_server(
                                &mut session_tracker.sessions,
                                &processes,
                                &db_for_thread,
                                &runtime_for_thread,
                            );

                            if let Err(e) = app_handle.emit("session-update", &session_tracker.sessions) {
                                eprintln!("Failed to emit session update: {e}");
                            }
                        }
                        Err(e) => eprintln!("Error querying processes: {e}"),
                    }

                    thread::sleep(Duration::from_secs(2));
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_games,
            set_auth_tokens,
            get_access_token,
            clear_auth_tokens,
            set_api_base_url,
            set_library_index,
            refresh_auth_tokens,
            logout_auth
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
