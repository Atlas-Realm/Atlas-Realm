# Atlas Realm Desktop API Gap Notes

Bu dosya, desktop UI tarafinda dummy veri ile gecici olarak doldurulan alanlari listeler.

## Activity
- `POST /api/activities` benzeri text post create endpoint'i yok.
- `GET /api/activities/feed` cevabi actor profil bilgilerini icermiyor; UI actor kartlarini local profile/friends listesi ve fallback dummy ile zenginlestiriyor.

## Social / Friends
- `GET /api/social/friends` presence, online state, current game, away duration gibi alanlari donmuyor.
- UI sag sidebar'da presence bilgisi deterministik dummy katmandan uretiliyor.

## Games / Library Detail
- `GET /api/games/:id` media gallery, screenshots, achievements, completion ratio, social rank gibi detay alanlarini donmuyor.
- Library detail sayfasi bu alanlari theme-aligned dummy bloklarla gosteriyor.

## Profile
- Profile analytics/stats icin ayri endpoint yok.
- Profil sayfasindaki launcher level, favorite vibe, current focus gibi alanlar dummy durumunda.
