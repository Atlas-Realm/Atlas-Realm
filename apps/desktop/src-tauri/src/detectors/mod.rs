pub mod amazon;
pub mod epic;
pub mod registry;
pub mod steam;
pub mod ubisoft;
pub mod xbox;
pub mod utils;
pub mod metadata;

use crate::models::GameMetadata;

const ENABLE_REGISTRY_SCAN: bool = false;

pub fn scan_all_games() -> Vec<GameMetadata> {
    println!("1. Preparing game list...");

    let mut all_games = Vec::new();

    let steam_games = steam::discover_steam_games();
    all_games.extend(steam_games);

    let epic_games = epic::discover_epic_games();
    all_games.extend(epic_games);

    let ubisoft_games = ubisoft::discover_ubisoft_games();
    all_games.extend(ubisoft_games);

    let xbox_games = xbox::discover_xbox_games();
    all_games.extend(xbox_games);

    let amazon_games = amazon::discover_amazon_games();
    all_games.extend(amazon_games);

    if ENABLE_REGISTRY_SCAN {
        let registry_games = registry::discover_registry_games();
        // Registry currently returns HashSet<String> of exe names, need to wrap in metadata
        for exe in registry_games {
            all_games.push(GameMetadata {
                name: exe.clone(),
                exe_name: exe.clone(),
                platform: "Manual / Registry".to_string(),
                app_id: Some(exe),
                icon: None,
                cover_image: None,
                developer: None,
                publisher: None,
                genres: Vec::new(),
                description: None,
                release_date: None,
            });
        }
    }

    // Filter duplicates by lowercase exe_name
    let mut unique_games = Vec::new();
    let mut seen_exes = std::collections::HashSet::new();

    for game in all_games {
        let exe_lower = game.exe_name.to_lowercase();
        if !seen_exes.contains(&exe_lower) {
            seen_exes.insert(exe_lower);
            unique_games.push(game);
        }
    }

    unique_games
}
