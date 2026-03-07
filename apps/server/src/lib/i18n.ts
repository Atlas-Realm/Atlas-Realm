const translations = {
  en: {
    // auth
    "auth.email_in_use": "Email already in use",
    "auth.username_taken": "Username already taken",
    "auth.invalid_credentials": "Invalid credentials",
    "auth.invalid_refresh_token": "Invalid refresh token",
    "auth.refresh_token_expired": "Refresh token revoked or expired",
    "auth.user_not_found": "User not found",

    // users
    "users.not_found": "User not found",

    // games
    "games.not_found": "Game not found",
    "games.search_failed": "Game search provider request failed",
    "games.rawg_not_configured": "RAWG API key is not configured",
    "games.library_item_not_found": "Game is not in your library",

    // sessions
    "sessions.active_exists": "An active session already exists",
    "sessions.not_found": "Session not found",
    "sessions.forbidden": "Not your session",
    "sessions.already_completed": "Session already completed",
    "sessions.not_active": "Session is not active",
    "sessions.not_paused": "Session is not paused",

    // social
    "social.cannot_friend_self": "You cannot send a friend request to yourself",
    "social.already_friends": "You are already friends",
    "social.request_already_exists": "A pending friend request already exists",
    "social.request_not_found": "Friend request not found",
    "social.request_forbidden": "You are not allowed to manage this friend request",
    "social.request_not_pending": "Friend request is no longer pending",
    "social.friend_not_found": "Friend relationship not found",

    // notifications
    "notifications.not_found": "Notification not found",

    // chat
    "chat.self_message_forbidden": "You cannot send a message to yourself",

    // general errors
    "errors.bad_request": "Bad request",
    "errors.unauthorized": "Unauthorized",
    "errors.forbidden": "Forbidden",
    "errors.not_found": "Not found",
    "errors.conflict": "Conflict",
    "errors.external_api": "External API error",
    "errors.validation_failed": "Validation failed",
    "errors.internal": "Internal server error",
    "errors.route_not_found": "Route not found",
    "errors.invalid_auth_header": "Missing or invalid authorization header",
    "errors.invalid_token": "Invalid or expired token",
  },
  tr: {
    // auth
    "auth.email_in_use": "Bu e-posta adresi zaten kullanımda",
    "auth.username_taken": "Bu kullanıcı adı zaten alınmış",
    "auth.invalid_credentials": "Geçersiz kimlik bilgileri",
    "auth.invalid_refresh_token": "Geçersiz yenileme token'ı",
    "auth.refresh_token_expired": "Yenileme token'ı iptal edilmiş veya süresi dolmuş",
    "auth.user_not_found": "Kullanıcı bulunamadı",

    // users
    "users.not_found": "Kullanıcı bulunamadı",

    // games
    "games.not_found": "Oyun bulunamadı",
    "games.search_failed": "Oyun arama sağlayıcısı isteği başarısız oldu",
    "games.rawg_not_configured": "RAWG API anahtarı yapılandırılmamış",
    "games.library_item_not_found": "Oyun kütüphanenizde bulunamadı",

    // sessions
    "sessions.active_exists": "Zaten aktif bir oturum mevcut",
    "sessions.not_found": "Oturum bulunamadı",
    "sessions.forbidden": "Bu oturum size ait değil",
    "sessions.already_completed": "Oturum zaten tamamlandı",
    "sessions.not_active": "Oturum aktif değil",
    "sessions.not_paused": "Oturum duraklatılmış değil",

    // social
    "social.cannot_friend_self": "Kendinize arkadaşlık isteği gönderemezsiniz",
    "social.already_friends": "Zaten arkadaşsınız",
    "social.request_already_exists": "Zaten bekleyen bir arkadaşlık isteği var",
    "social.request_not_found": "Arkadaşlık isteği bulunamadı",
    "social.request_forbidden": "Bu arkadaşlık isteğini yönetme izniniz yok",
    "social.request_not_pending": "Arkadaşlık isteği artık beklemede değil",
    "social.friend_not_found": "Arkadaşlık ilişkisi bulunamadı",

    // notifications
    "notifications.not_found": "Bildirim bulunamadı",

    // chat
    "chat.self_message_forbidden": "Kendinize mesaj gönderemezsiniz",

    // general errors
    "errors.bad_request": "Geçersiz istek",
    "errors.unauthorized": "Yetkisiz erişim",
    "errors.forbidden": "Erişim reddedildi",
    "errors.not_found": "Bulunamadı",
    "errors.conflict": "Çakışma",
    "errors.external_api": "Harici API hatası",
    "errors.validation_failed": "Doğrulama başarısız",
    "errors.internal": "Sunucu hatası",
    "errors.route_not_found": "Rota bulunamadı",
    "errors.invalid_auth_header": "Authorization başlığı eksik veya hatalı",
    "errors.invalid_token": "Token geçersiz veya süresi dolmuş",
  },
} as const;

type Lang = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

export function t(lang: string, key: TranslationKey): string {
  const l: Lang = lang === "tr" ? "tr" : "en";
  return translations[l][key] ?? translations.en[key] ?? key;
}
