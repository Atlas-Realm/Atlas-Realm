pub fn is_blacklisted_exe(name: &str) -> bool {
    let name_lower = name.to_lowercase();
    let excluded_patterns = [
        "crash", 
        "reporter", 
        "unitycrashhandler", 
        "easyanticheat", 
        "launcher", 
        "setup", 
        "install", 
        "unins", 
        "redist", 
        "prerequisite",
        "update", 
        "patcher", 
        "config",
        "dedicated",
        "server",
        "overlay",
        "helper",
        "cefprocess",
        "cleanup",
        "register",
        "support",
        "repair",
        "fix",
        "socialclub",
        "uninstal", // handles both uninstall and uninstaller
        "steamworks", // matches Steamworks Common Redistributables
        "ndp", // matches .NET Framework installers (e.g., ndp48-...)
        "dotnet", // matches .NET runtimes
    ];

    excluded_patterns.iter().any(|&pattern| name_lower.contains(pattern))
}

pub fn find_best_exe_recursive(dir_path: &std::path::Path) -> Option<String> {
    if !dir_path.exists() {
        return None;
    }

    let mut candidates: Vec<(String, u64)> = Vec::new();

    for entry in walkdir::WalkDir::new(dir_path)
        .max_depth(4) // Sufficient depth for most games
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().and_then(|s| s.to_str()) == Some("exe"))
    {
        let name = entry.file_name().to_string_lossy().to_string();
        if is_blacklisted_exe(&name) {
            continue;
        }

        if let Ok(meta) = entry.metadata() {
            if meta.is_file() {
                candidates.push((name, meta.len()));
            }
        }
    }

    // Sort by size descending (largest is usually the main game)
    candidates.sort_by(|a, b| b.1.cmp(&a.1));
    candidates.first().map(|(name, _)| name.clone())
}
