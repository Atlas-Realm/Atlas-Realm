use std::collections::{HashMap, HashSet};
use chrono::Local;
use crate::models::{GameMetadata, GameSession, ProcessInfo};

pub struct SessionTracker {
    pub sessions: Vec<GameSession>,
    active_sessions: HashMap<u32, usize>, // Matches PID to index in sessions
    game_cache: HashMap<String, GameMetadata>,
}

impl SessionTracker {
    pub fn new(games: Vec<GameMetadata>, initial_sessions: Vec<GameSession>) -> Self {
        let mut game_cache = HashMap::new();
        for game in games {
            game_cache.insert(game.exe_name.to_lowercase(), game);
        }

        let mut active_sessions = HashMap::new();
        for (index, session) in initial_sessions.iter().enumerate() {
            if session.is_active {
                active_sessions.insert(session.process_id, index);
            }
        }
        
        Self {
            sessions: initial_sessions,
            active_sessions,
            game_cache,
        }
    }

    pub fn update(&mut self, processes: &[ProcessInfo]) -> &Vec<GameSession> {
        let now = Local::now();
        let mut found_pids: HashSet<u32> = HashSet::new();

        for process in processes {
            // Check if this process is already being tracked
            if let Some(&index) = self.active_sessions.get(&process.pid) {
                // Update existing session
                if let Some(session) = self.sessions.get_mut(index) {
                    let old_duration = session.duration_seconds;
                    session.last_seen = now;
                    session.duration_seconds = (now - session.start_time).num_seconds();
                    
                    // Optimization: Only flag for save every 60 seconds to reduce disk I/O
                    if session.duration_seconds > 0 && session.duration_seconds / 60 > old_duration / 60 {
                        session.needs_save = true;
                    }
                    
                    found_pids.insert(process.pid);
                }
                continue;
            }

            // Process not tracked, check if it matches a game in our library
            // We use to_lowercase only here, avoiding it for already tracked processes if possible
            // But we need to match name.
            let p_name_lower = process.name.to_lowercase();

            if let Some(metadata) = self.game_cache.get(&p_name_lower) {
                println!("🚀 GAME STARTED: {} (PID: {})", metadata.name, process.pid);
                
                let new_session = GameSession {
                    id: None,
                    game_name: metadata.name.clone(),
                    process_id: process.pid,
                    start_time: now,
                    last_seen: now,
                    duration_seconds: 0,
                    is_active: true,
                    remote_session_id: None,
                    heartbeat_duration_sent: 0,
                    end_synced: false,
                    needs_save: true,
                };

                let new_index = self.sessions.len();
                self.sessions.push(new_session);
                self.active_sessions.insert(process.pid, new_index);
                found_pids.insert(process.pid);
            }
        }

        // Handle game exits
        // Identify PIDs that are in active_sessions but not in found_pids
        let dead_pids: Vec<u32> = self.active_sessions.keys()
            .filter(|pid| !found_pids.contains(pid))
            .cloned()
            .collect();

        for pid in dead_pids {
            if let Some(&index) = self.active_sessions.get(&pid) {
                if let Some(session) = self.sessions.get_mut(index) {
                    session.is_active = false;
                    session.needs_save = true; // Always save on exit
                    session.end_synced = false;
                    println!("🛑 GAME ENDED: {} (Duration: {} sec)", session.game_name, session.duration_seconds);
                }
            }
            self.active_sessions.remove(&pid);
        }

        &self.sessions
    }
}
