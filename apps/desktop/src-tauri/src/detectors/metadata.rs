use crate::models::GameMetadata;
use crate::detectors::utils::clean_game_name;
use serde_json::Value;
use std::time::{Duration, Instant};
use std::sync::Mutex;
use once_cell::sync::Lazy;

static DOTENV_INIT: Lazy<()> = Lazy::new(|| {
    let _ = dotenvy::dotenv();
});

fn get_env_var(name: &str) -> Option<String> {
    Lazy::force(&DOTENV_INIT);
    std::env::var(name).ok()
}

struct IgdbAuth {
    token: String,
    expires_at: Instant,
}

static AUTH_CACHE: Lazy<Mutex<Option<IgdbAuth>>> = Lazy::new(|| Mutex::new(None));

async fn get_igdb_access_token(client: &reqwest::Client) -> Option<String> {
    {
        let cache = AUTH_CACHE.lock().unwrap();
        if let Some(ref auth) = *cache {
            if auth.expires_at > Instant::now() {
                return Some(auth.token.clone());
            }
        }
    }

    let client_id = get_env_var("TWITCH_CLIENT_ID")?;
    let client_secret = get_env_var("TWITCH_CLIENT_SECRET")?;

    let url = "https://id.twitch.tv/oauth2/token";
    let params = [
        ("client_id", client_id.as_str()),
        ("client_secret", client_secret.as_str()),
        ("grant_type", "client_credentials"),
    ];

    let response = client.post(url).form(&params).send().await.ok()?.json::<Value>().await.ok()?;
    let token = response.get("access_token")?.as_str()?.to_string();
    let expires_in = response.get("expires_in")?.as_u64().unwrap_or(3600);
    
    let auth = IgdbAuth {
        token: token.clone(),
        expires_at: Instant::now() + Duration::from_secs(expires_in - 60),
    };

    {
        let mut cache = AUTH_CACHE.lock().unwrap();
        *cache = Some(auth);
    }
    
    Some(token)
}

async fn validate_image_url(client: &reqwest::Client, url: &str) -> bool {
    if url.is_empty() { return false; }
    
    match client.head(url)
        .timeout(Duration::from_secs(2))
        .send()
        .await {
            Ok(res) => res.status().is_success(),
            Err(_) => false
        }
}

pub async fn enrich_metadata(games: Vec<GameMetadata>) -> Vec<GameMetadata> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .unwrap_or_default();

    let igdb_token = get_igdb_access_token(&client).await;
    let steamgriddb_key = get_env_var("STEAMGRIDDB_API_KEY");

    let mut enriched_games = Vec::new();

    for mut game in games {
        let cleaned_name = clean_game_name(&game.name);
        
        match game.platform.as_str() {
            "Steam" => {
                enrich_steam_game(&client, &mut game, &igdb_token).await;
            }
            "Epic Games" | "Xbox / Microsoft Store" | _ => {
                enrich_other_platform_game(&client, &mut game, &cleaned_name, &igdb_token).await;
            }
        }

        if let Some(ref url) = game.cover_image {
            if !validate_image_url(&client, url).await {
                game.cover_image = None;
            }
        }

        if game.cover_image.is_none() {
            if let Some(ref token) = igdb_token {
                if let Some(igdb_data) = search_igdb(&client, token, &cleaned_name).await {
                    if let Some(url) = igdb_data.cover_url {
                        if validate_image_url(&client, &url).await {
                            game.cover_image = Some(url);
                        }
                    }
                }
            }
        }

        if game.cover_image.is_none() {
            if let Some(steam_app_id) = search_steam_app_id(&client, &cleaned_name).await {
                let url = format!(
                    "https://cdn.akamai.steamstatic.com/steam/apps/{}/library_600x900.jpg",
                    steam_app_id
                );
                if validate_image_url(&client, &url).await {
                    game.cover_image = Some(url);
                }
            }
        }

        if game.cover_image.is_none() {
            if let Some(ref api_key) = steamgriddb_key {
                enrich_from_steamgriddb(&client, &mut game, &cleaned_name, api_key).await;
            }
        }

        convert_local_icon_to_base64(&mut game);
        enriched_games.push(game);
    }

    enriched_games
}

async fn enrich_steam_game(client: &reqwest::Client, game: &mut GameMetadata, igdb_token: &Option<String>) {
    if let Some(ref app_id) = game.app_id {
        if game.cover_image.is_none() {
            game.cover_image = Some(format!(
                "https://cdn.akamai.steamstatic.com/steam/apps/{}/library_600x900.jpg",
                app_id
            ));
        }
        if game.icon.is_none() {
            game.icon = Some(format!(
                "https://cdn.akamai.steamstatic.com/steam/apps/{}/header.jpg",
                app_id
            ));
        }

        if game.description.is_none() || game.developer.is_none() {
            if let Some(details) = fetch_steam_details(client, app_id).await {
                if game.developer.is_none() { game.developer = details.developer; }
                if game.publisher.is_none() { game.publisher = details.publisher; }
                if game.genres.is_empty() { game.genres = details.genres; }
                if game.description.is_none() { game.description = details.description; }
                if game.release_date.is_none() { game.release_date = details.release_date; }
            }
        }
    }

    if game.description.is_none() || game.genres.is_empty() || game.cover_image.is_none() {
        if let Some(ref token) = igdb_token {
            let cleaned_name = clean_game_name(&game.name);
            if let Some(igdb_data) = search_igdb(client, token, &cleaned_name).await {
                if game.description.is_none() { game.description = igdb_data.summary; }
                if game.genres.is_empty() { game.genres = igdb_data.genres; }
                if game.developer.is_none() { game.developer = igdb_data.developer; }
                if game.publisher.is_none() { game.publisher = igdb_data.publisher; }
                if game.cover_image.is_none() { game.cover_image = igdb_data.cover_url; }
            }
        }
    }
}

async fn enrich_other_platform_game(
    client: &reqwest::Client,
    game: &mut GameMetadata,
    cleaned_name: &str,
    igdb_token: &Option<String>,
) {
    if let Some(ref token) = igdb_token {
        if let Some(igdb_data) = search_igdb(client, token, cleaned_name).await {
            if game.description.is_none() { game.description = igdb_data.summary; }
            if game.cover_image.is_none() { game.cover_image = igdb_data.cover_url; }
            if game.genres.is_empty() { game.genres = igdb_data.genres; }
            if game.developer.is_none() { game.developer = igdb_data.developer; }
            if game.publisher.is_none() { game.publisher = igdb_data.publisher; }
        }
    }

    if game.cover_image.is_none() || game.description.is_none() {
        if let Some(steam_app_id) = search_steam_app_id(client, cleaned_name).await {
            if game.cover_image.is_none() {
                game.cover_image = Some(format!(
                    "https://cdn.akamai.steamstatic.com/steam/apps/{}/library_600x900.jpg",
                    steam_app_id
                ));
            }
            if game.icon.is_none() {
                game.icon = Some(format!(
                    "https://cdn.akamai.steamstatic.com/steam/apps/{}/header.jpg",
                    steam_app_id
                ));
            }
            if game.description.is_none() {
                if let Some(details) = fetch_steam_details(client, &steam_app_id).await {
                    if game.developer.is_none() { game.developer = details.developer; }
                    if game.publisher.is_none() { game.publisher = details.publisher; }
                    if game.genres.is_empty() { game.genres = details.genres; }
                    game.description = details.description;
                    if game.release_date.is_none() { game.release_date = details.release_date; }
                }
            }
        }
    }
}

async fn enrich_from_steamgriddb(
    client: &reqwest::Client,
    game: &mut GameMetadata,
    cleaned_name: &str,
    api_key: &str,
) {
    let search_url = format!(
        "https://www.steamgriddb.com/api/v2/search/autocomplete/{}",
        urlencoding::encode(cleaned_name)
    );

    let response = client
        .get(&search_url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await;

    let game_id = match response {
        Ok(resp) => {
            if let Ok(json) = resp.json::<Value>().await {
                json.get("data")
                    .and_then(|d| d.as_array())
                    .and_then(|a| a.first())
                    .and_then(|g| g.get("id"))
                    .and_then(|id| id.as_i64())
            } else {
                None
            }
        }
        Err(_) => None,
    };

    if let Some(id) = game_id {
        let grids_url = format!(
            "https://www.steamgriddb.com/api/v2/grids/game/{}?dimensions=600x900",
            id
        );

        if let Ok(resp) = client
            .get(&grids_url)
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
        {
            if let Ok(json) = resp.json::<Value>().await {
                if let Some(url) = json
                    .get("data")
                    .and_then(|d| d.as_array())
                    .and_then(|a| a.first())
                    .and_then(|g| g.get("url"))
                    .and_then(|u| u.as_str())
                {
                    game.cover_image = Some(url.to_string());
                }
            }
        }
    }
}

fn convert_local_icon_to_base64(game: &mut GameMetadata) {
    if let Some(ref icon_path) = game.icon {
        if !icon_path.starts_with("http") && !icon_path.starts_with("data:") {
            if std::path::Path::new(icon_path).exists() {
                if let Ok(bytes) = std::fs::read(icon_path) {
                    let encoded = base64::encode(&bytes);
                    let mime = if icon_path.ends_with(".png") { "image/png" } else { "image/jpeg" };
                    game.icon = Some(format!("data:{};base64,{}", mime, encoded));
                }
            }
        }
    }
}

struct IgdbGameData {
    summary: Option<String>,
    cover_url: Option<String>,
    genres: Vec<String>,
    developer: Option<String>,
    publisher: Option<String>,
}

async fn search_igdb(client: &reqwest::Client, token: &str, name: &str) -> Option<IgdbGameData> {
    let client_id = get_env_var("TWITCH_CLIENT_ID")?;
    let url = "https://api.igdb.com/v4/games";
    
    let query = format!(
        "search \"{}\"; fields summary, cover.url, genres.name, involved_companies.company.name, involved_companies.developer, involved_companies.publisher; limit 1;",
        name.replace("\"", "\\\"")
    );

    let response = client.post(url)
        .header("Client-ID", client_id)
        .header("Authorization", format!("Bearer {}", token))
        .body(query)
        .send().await.ok()?.json::<Value>().await.ok()?;

    let game = response.as_array()?.first()?;

    let summary = game.get("summary").and_then(|v| v.as_str()).map(|s| s.to_string());
    
    let cover_url = game.get("cover").and_then(|c| c.get("url")).and_then(|u| u.as_str()).map(|u| {
        format!("https:{}", u.replace("t_thumb", "t_cover_big"))
    });

    let genres = game.get("genres").and_then(|g| g.as_array())
        .map(|a| a.iter().filter_map(|v| v.get("name").and_then(|n| n.as_str()).map(|s| s.to_string())).collect())
        .unwrap_or_default();

    let companies = game.get("involved_companies").and_then(|c| c.as_array());
    let mut developer = None;
    let mut publisher = None;

    if let Some(comps) = companies {
        for comp in comps {
            let name = comp.get("company").and_then(|c| c.get("name")).and_then(|n| n.as_str()).map(|s| s.to_string());
            if comp.get("developer").and_then(|v| v.as_bool()).unwrap_or(false) {
                developer = name.clone();
            }
            if comp.get("publisher").and_then(|v| v.as_bool()).unwrap_or(false) {
                publisher = name;
            }
        }
    }

    Some(IgdbGameData {
        summary,
        cover_url,
        genres,
        developer,
        publisher,
    })
}

async fn search_steam_app_id(client: &reqwest::Client, name: &str) -> Option<String> {
    let url = format!(
        "https://store.steampowered.com/api/storesearch/?term={}&l=english&cc=US",
        urlencoding::encode(name)
    );
    let response = client.get(&url).send().await.ok()?.json::<Value>().await.ok()?;

    let items = response.get("items")?.as_array()?;
    if items.is_empty() {
        return None;
    }

    let best_match = items.iter().find(|item| {
        let item_name = item.get("name").and_then(|v| v.as_str()).unwrap_or("").to_lowercase();
        item_name == name.to_lowercase()
    }).or_else(|| items.first());

    best_match?.get("id")?.as_u64().map(|id| id.to_string())
}

struct SteamDetails {
    developer: Option<String>,
    publisher: Option<String>,
    genres: Vec<String>,
    description: Option<String>,
    release_date: Option<String>,
}

async fn fetch_steam_details(client: &reqwest::Client, app_id: &str) -> Option<SteamDetails> {
    let url = format!("https://store.steampowered.com/api/appdetails?appids={}", app_id);
    let response = client.get(&url).send().await.ok()?.json::<Value>().await.ok()?;

    let data = response.get(app_id)?.get("data")?;

    let developer = data.get("developers").and_then(|v| v.as_array())
        .and_then(|a| a.first()).and_then(|v| v.as_str()).map(|s| s.to_string());
    
    let publisher = data.get("publishers").and_then(|v| v.as_array())
        .and_then(|a| a.first()).and_then(|v| v.as_str()).map(|s| s.to_string());

    let genres = data.get("genres").and_then(|v| v.as_array())
        .map(|a| a.iter().filter_map(|g| g.get("description").and_then(|v| v.as_str()).map(|s| s.to_string())).collect())
        .unwrap_or_default();

    let description = data.get("short_description").and_then(|v| v.as_str()).map(|s| s.to_string());
    let release_date = data.get("release_date").and_then(|v| v.get("date")).and_then(|v| v.as_str()).map(|s| s.to_string());

    Some(SteamDetails {
        developer,
        publisher,
        genres,
        description,
        release_date,
    })
}
