use crate::models::GameMetadata;
use std::path::Path;
use serde_json::Value;

pub fn discover_epic_games() -> Vec<GameMetadata> {
    let mut games = Vec::new();
    
    #[cfg(target_os = "windows")]
    let epic_path = get_epic_manifests_path()
        .unwrap_or_else(|| r"C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests".to_string());
    
    #[cfg(not(target_os = "windows"))]
    let epic_path = "".to_string();

    if !epic_path.is_empty() && Path::new(&epic_path).exists() {
        if let Ok(entries) = std::fs::read_dir(&epic_path) {
            for entry in entries.flatten() {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("item") {
                    if let Some(metadata) = parse_epic_manifest(&entry.path()) {
                        games.push(metadata);
                    }
                }
            }
        }
    }
    println!("-> Total {} Epic Games cached.", games.len());
    games
}

#[cfg(target_os = "windows")]
fn get_epic_manifests_path() -> Option<String> {
    use winreg::RegKey;
    use winreg::enums::*;

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    if let Ok(epic_key) = hklm.open_subkey(r"SOFTWARE\WOW6432Node\Epic Games\EpicGamesLauncher") {
        if let Ok(install_location) = epic_key.get_value::<String, _>("AppDataPath") {
            println!("Location found: {}", install_location);
            return Some(format!(r"{}\Manifests", install_location));
        }
    }

    Some(r"C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests".to_string())
}

fn parse_epic_manifest(path: &Path) -> Option<GameMetadata> {
    let content = std::fs::read_to_string(path).ok()?;
    let json: Value = serde_json::from_str(&content).ok()?;

    let display_name = json.get("DisplayName")?.as_str()?.to_string();
    let app_id = json.get("AppName").and_then(|v| v.as_str()).map(|s| s.to_string());
    let developer = json.get("DeveloperName").and_then(|v| v.as_str()).map(|s| s.to_string());
    let publisher = json.get("PublisherName").and_then(|v| v.as_str()).map(|s| s.to_string());
    
    let exe_path = json.get("LaunchExecutable")?.as_str()?;
    let exe_name = Path::new(exe_path)
        .file_name()?
        .to_string_lossy()
        .to_string();

    Some(GameMetadata {
        name: display_name,
        exe_name,
        platform: "Epic Games".to_string(),
        app_id,
        icon: None,
        cover_image: None,
        developer,
        publisher,
        genres: Vec::new(),
        description: None,
        release_date: None,
    })
}