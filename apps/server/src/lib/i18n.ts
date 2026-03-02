const translations = {
  en: {
    // auth
    "auth.email_in_use": "Email already in use",
    "auth.username_taken": "Username already taken",
    "auth.invalid_credentials": "Invalid credentials",
    "auth.invalid_refresh_token": "Invalid refresh token",
    "auth.refresh_token_expired": "Refresh token revoked or expired",
    "auth.user_not_found": "User not found",
    // games
    "games.not_found": "Game not found",
    // sessions
    "sessions.active_exists": "An active session already exists",
    "sessions.not_found": "Session not found",
    "sessions.forbidden": "Not your session",
    "sessions.already_completed": "Session already completed",
    "sessions.not_active": "Session is not active",
    "sessions.not_paused": "Session is not paused",
    // general errors
    "errors.unauthorized": "Unauthorized",
    "errors.forbidden": "Forbidden",
    "errors.not_found": "Not found",
    "errors.conflict": "Conflict",
    "errors.external_api": "External API error",
    "errors.validation_failed": "Validation failed",
    "errors.internal": "Internal server error",
    "errors.route_not_found": "Route not found",
  },
  tr: {
    // auth
    "auth.email_in_use": "Bu e-posta adresi zaten kullanımda",
    "auth.username_taken": "Bu kullanıcı adı zaten alınmış",
    "auth.invalid_credentials": "Geçersiz kimlik bilgileri",
    "auth.invalid_refresh_token": "Geçersiz yenileme token'ı",
    "auth.refresh_token_expired": "Yenileme token'ı iptal edilmiş veya süresi dolmuş",
    "auth.user_not_found": "Kullanıcı bulunamadı",
    // games
    "games.not_found": "Oyun bulunamadı",
    // sessions
    "sessions.active_exists": "Zaten aktif bir oturum mevcut",
    "sessions.not_found": "Oturum bulunamadı",
    "sessions.forbidden": "Bu oturum size ait değil",
    "sessions.already_completed": "Oturum zaten tamamlandı",
    "sessions.not_active": "Oturum aktif değil",
    "sessions.not_paused": "Oturum duraklatılmış değil",
    // general errors
    "errors.unauthorized": "Yetkisiz erişim",
    "errors.forbidden": "Erişim reddedildi",
    "errors.not_found": "Bulunamadı",
    "errors.conflict": "Çakışma",
    "errors.external_api": "Harici API hatası",
    "errors.validation_failed": "Doğrulama başarısız",
    "errors.internal": "Sunucu hatası",
    "errors.route_not_found": "Rota bulunamadı",
  },
} as const;

type Lang = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

export function t(lang: string, key: TranslationKey): string {
  const l: Lang = lang === "tr" ? "tr" : "en";
  return translations[l][key] ?? translations.en[key] ?? key;
}
