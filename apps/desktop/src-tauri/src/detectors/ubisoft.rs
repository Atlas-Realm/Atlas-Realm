use crate::models::GameMetadata;
use std::path::Path;
#[cfg(target_os = "windows")]
use winreg::enums::*;
#[cfg(target_os = "windows")]
use winreg::RegKey;

pub fn discover_ubisoft_games() -> Vec<GameMetadata> {
    let mut games = Vec::new();

    #[cfg(target_os = "windows")]
    {
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);

        let registry_paths = vec![
            r"SOFTWARE\Ubisoft\Launcher\Installs",
            r"SOFTWARE\WOW6432Node\Ubisoft\Launcher\Installs",
        ];

        for reg_path in registry_paths {
            if let Ok(installs_key) = hklm.open_subkey(reg_path) {
                for install_id in installs_key.enum_keys().flatten() {
                    if let Ok(game_key) = installs_key.open_subkey(&install_id) {
                        if let Ok(install_dir) = game_key.get_value::<String, _>("InstallDir") {
                            if let Some(exe_name) = find_largest_exe_in_dir(&install_dir) {
                                // Try to get a nicer name from the path if possible
                                let name = Path::new(&install_dir)
                                    .file_name()
                                    .map(|s| s.to_string_lossy().to_string())
                                    .unwrap_or_else(|| install_id.clone());

                                games.push(GameMetadata {
                                    name,
                                    exe_name,
                                    platform: "Ubisoft".to_string(),
                                    app_id: Some(install_id.clone()),
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
                    }
                }
            }
        }
    }

    println!("-> Total {} Ubisoft games cached.", games.len());
    games
}

fn find_largest_exe_in_dir(dir_path: &str) -> Option<String> {
    let path = Path::new(dir_path);
    crate::detectors::utils::find_best_exe_recursive(path)
}
