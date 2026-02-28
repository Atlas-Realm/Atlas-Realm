mod detectors;
mod models;
mod storage;
mod system;
mod tracker;

use std::thread;
use std::time::Duration;
use tauri::{Emitter, Manager};
use crate::tracker::SessionTracker;
use crate::system::SystemScanner;
use crate::detectors::scan_all_games;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn scan_games(
    db: tauri::State<'_, std::sync::Arc<std::sync::Mutex<crate::storage::Database>>>,
    app: tauri::AppHandle,
) -> Result<Vec<crate::models::GameMetadata>, String> {
    let games = detectors::scan_all_games();
    let mut final_games = Vec::new();
    let mut games_to_enrich = Vec::new();

    {
        let db_lock = db.lock().map_err(|e| e.to_string())?;
        for game in games {
            if let Ok(Some(cached)) = db_lock.get_metadata(&game.exe_name) {
                final_games.push(cached);
            } else {
                // Not in cache, send basic info and queue for background enrichment
                final_games.push(game.clone());
                games_to_enrich.push(game);
            }
        }
    }

    // Background Enrichment Task
    if !games_to_enrich.is_empty() {
        let db_inner = db.inner().clone();
        let app_handle = app.clone();
        
        tauri::async_runtime::spawn(async move {
            println!("Starting background enrichment for {} games...", games_to_enrich.len());
            
            for game in games_to_enrich {
                // Enrich games one by one to send updates immediately
                let single_game_vec = vec![game];
                let enriched = detectors::metadata::enrich_metadata(single_game_vec).await;
                
                if let Some(enriched_game) = enriched.into_iter().next() {
                    // 1. Save to DB
                    if let Ok(db_lock) = db_inner.lock() {
                        let _ = db_lock.save_metadata(&enriched_game);
                    }
                    
                    // 2. Emit event to frontend
                    use tauri::Emitter;
                    let _ = app_handle.emit("metadata-update", enriched_game);
                }
            }
            println!("Background enrichment complete.");
        });
    }

    final_games.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(final_games)
}

#[tauri::command]
async fn clear_cache(db: tauri::State<'_, std::sync::Arc<std::sync::Mutex<crate::storage::Database>>>) -> Result<(), String> {
    let db_lock = db.lock().map_err(|e| e.to_string())?;
    db_lock.clear_metadata_cache().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            let db_path = crate::storage::get_db_path(&app_handle);
            if let Err(e) = std::fs::create_dir_all(&db_path) {
                eprintln!("Failed to create app data dir: {}", e);
            }

            let db = match crate::storage::Database::new(db_path) {
                Ok(d) => std::sync::Arc::new(std::sync::Mutex::new(d)),
                Err(e) => {
                    eprintln!("Failed to init database: {}", e);
                    panic!("Database failed to initialize");
                }
            };

            app.manage(db.clone());

            let db_for_thread = db.clone();
            thread::spawn(move || {
                println!("Initializing Session Tracker...");
                
                let initial_sessions = {
                    let db_lock = db_for_thread.lock().unwrap();
                    db_lock.load_sessions().unwrap_or_else(|e| {
                        eprintln!("Failed to load sessions: {}", e);
                        Vec::new()
                    })
                };

                // Initialize game cache for tracking
                let game_cache = scan_all_games();
                let mut session_tracker = SessionTracker::new(game_cache, initial_sessions);
                
                let mut system_scanner = match SystemScanner::new() {
                    Ok(s) => s,
                    Err(e) => {
                        eprintln!("Failed to init system scanner: {}", e);
                        return;
                    }
                };

                println!("Session Tracker running...");

                loop {
                    // Poll running processes
                    // Using sysinfo which is much faster than WMI
                    match system_scanner.get_running_processes() {
                        Ok(processes) => {
                            session_tracker.update(&processes);
                            
                            // Optimization: Check for pending saves cleanly
                            let needs_save = session_tracker.sessions.iter().any(|s| s.needs_save);
                            
                            if needs_save {
                                match db_for_thread.lock() {
                                    Ok(db_lock) => {
                                        for session in &mut session_tracker.sessions {
                                            if session.needs_save {
                                                if let Err(e) = db_lock.save_or_update_session(session) {
                                                    eprintln!("Failed to save session: {}", e);
                                                } else {
                                                    session.needs_save = false; // Reset flag after successful save
                                                }
                                            }
                                        }
                                    }
                                    Err(e) => eprintln!("Failed to lock DB: {}", e),
                                }
                            }

                            // Emit event to frontend
                            if let Err(e) = app_handle.emit("session-update", &session_tracker.sessions) {
                                eprintln!("Failed to emit session update: {}", e);
                            }
                        },
                        Err(e) => eprintln!("Error querying processes: {}", e),
                    }
                    
                    thread::sleep(Duration::from_secs(2));
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, scan_games, clear_cache])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
