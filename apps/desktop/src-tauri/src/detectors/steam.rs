use crate::models::GameMetadata;
use std::path::Path;

#[cfg(target_os = "windows")]
fn get_steam_path() -> Option<String> {
    use winreg::RegKey;
    use winreg::enums::*;

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    if let Ok(steam_key) = hklm.open_subkey(r"SOFTWARE\WOW6432Node\Valve\Steam") {
        if let Ok(install_path) = steam_key.get_value::<String, _>("InstallPath") {
            return Some(format!(r"{}\steamapps", install_path));
        }
    }

    Some(r"C:\Program Files (x86)\Steam\steamapps".to_string())
}

#[cfg(not(target_os = "windows"))]
fn get_steam_path() -> Option<String> {
    None
}

pub fn discover_steam_games() -> Vec<GameMetadata> {
    let mut games = Vec::new();

    let steam_path = get_steam_path()
        .unwrap_or_else(|| r"C:\Program Files (x86)\Steam\steamapps".to_string());

    let library_folders = get_steam_library_folders(&steam_path);

    for library_path in library_folders {
        if let Ok(entries) = std::fs::read_dir(&library_path) {
            for entry in entries.flatten() {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("acf") {
                    let steam_common = Path::new(&library_path).join("common");
                    if let Some(metadata) = parse_acf_file(&entry.path(), &steam_common) {
                        games.push(metadata);
                    }
                }
            }
        }
    }

    println!("-> Total {} Steam games cached.", games.len());
    games
}

fn get_steam_library_folders(steam_path: &str) -> Vec<String> {
    let mut folders = vec![steam_path.to_string()];

    let vdf_path = Path::new(steam_path).join("libraryfolders.vdf");
    if let Ok(content) = std::fs::read_to_string(vdf_path) {
        for line in content.lines() {
            if line.contains("\"path\"") {
                if let Some(path) = line.split('"').nth(3) {
                    let library_path = format!(r"{}\steamapps", path.replace("\\\\", "\\"));
                    folders.push(library_path);
                }
            }
        }
    }
    folders
}

fn parse_acf_file(path: &Path, steam_common: &Path) -> Option<GameMetadata> {
    let content = std::fs::read_to_string(path).ok()?;
    
    let app_id = content.lines()
        .find(|l| l.to_lowercase().contains("\"appid\""))?
        .split('"').nth(3)?
        .to_string();

    let display_name = content.lines()
        .find(|l| l.to_lowercase().contains("\"name\""))?
        .split('"').nth(3)?
        .to_string();

    let install_dir = content.lines()
        .find(|l| l.to_lowercase().contains("\"installdir\""))?
        .split('"').nth(3)?;

    let game_folder = steam_common.join(install_dir);

    if let Some(exe_name) = crate::detectors::utils::find_best_exe_recursive(&game_folder) {
        return Some(GameMetadata {
            name: display_name,
            exe_name,
            platform: "Steam".to_string(),
            app_id: Some(app_id),
            icon: None,
            cover_image: None,
            developer: None,
            publisher: None,
            genres: Vec::new(),
            description: None,
            release_date: None,
        });
    }
    
    None
}
