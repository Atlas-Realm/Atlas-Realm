# GameVault Server MVP

Steam/Epic/GOG benzeri oyun kütüphanesi ve tracker uygulamasının backend'i.

## API Endpoints

### Auth `/api/auth`

| Method | Endpoint    | Açıklama         |
| ------ | ----------- | ---------------- |
| POST   | `/register` | Kayıt ol         |
| POST   | `/login`    | Giriş yap        |
| POST   | `/refresh`  | Token yenile     |
| POST   | `/logout`   | Çıkış yap        |
| GET    | `/me`       | Mevcut kullanıcı |
| GET    | `/google`   | Google OAuth     |
| GET    | `/discord`  | Discord OAuth    |

### Users `/api/users`

| Method | Endpoint     | Açıklama            |
| ------ | ------------ | ------------------- |
| GET    | `/me`        | Profil bilgisi      |
| PATCH  | `/me`        | Profil güncelle     |
| GET    | `/search?q=` | Kullanıcı ara       |
| GET    | `/:username` | Herkese açık profil |

### Games `/api/games`

| Method | Endpoint           | Açıklama                |
| ------ | ------------------ | ----------------------- |
| GET    | `/library`         | Kütüphane listesi       |
| POST   | `/library`         | Oyun ekle               |
| POST   | `/library/sync`    | Toplu sync (client'tan) |
| PATCH  | `/library/:gameId` | Oyun güncelle           |
| DELETE | `/library/:gameId` | Oyun sil                |
| GET    | `/search?q=`       | Oyun ara                |

### Sessions `/api/sessions`

| Method | Endpoint         | Açıklama            |
| ------ | ---------------- | ------------------- |
| POST   | `/start`         | Oturum başlat       |
| POST   | `/heartbeat`     | Heartbeat (~60s)    |
| POST   | `/end`           | Oturum bitir        |
| GET    | `/active`        | Aktif oturum        |
| GET    | `/history`       | Oturum geçmişi      |
| GET    | `/stats/:gameId` | Oyun istatistikleri |

### Activities `/api/activities`

| Method | Endpoint        | Açıklama               |
| ------ | --------------- | ---------------------- |
| GET    | `/feed`         | Arkadaş aktiviteleri   |
| GET    | `/me`           | Kendi aktiviteleri     |
| GET    | `/user/:userId` | Kullanıcı aktiviteleri |

### Social `/api/social`

| Method | Endpoint                      | Açıklama              |
| ------ | ----------------------------- | --------------------- |
| GET    | `/friends`                    | Arkadaş listesi       |
| POST   | `/friends/request`            | Arkadaş isteği gönder |
| GET    | `/friends/requests/pending`   | Bekleyen istekler     |
| POST   | `/friends/request/:id/accept` | İsteği kabul et       |
| POST   | `/friends/request/:id/reject` | İsteği reddet         |
| DELETE | `/friends/:friendId`          | Arkadaşı sil          |

### Chat `/api/chat`

| Method | Endpoint                | Açıklama            |
| ------ | ----------------------- | ------------------- |
| GET    | `/conversations`        | Son sohbetler       |
| GET    | `/conversation/:userId` | Sohbet geçmişi      |
| POST   | `/send`                 | Mesaj gönder (REST) |
| POST   | `/read/:senderId`       | Okundu işaretle     |

### Notifications `/api/notifications`

| Method | Endpoint    | Açıklama           |
| ------ | ----------- | ------------------ |
| GET    | `/`         | Bildirimleri getir |
| PATCH  | `/:id/read` | Okundu işaretle    |
| PATCH  | `/read-all` | Tümünü okundu yap  |

## Socket.IO Events

### Client → Server

| Event               | Data                      | Açıklama           |
| ------------------- | ------------------------- | ------------------ |
| `chat:send`         | `{ receiverId, content }` | Mesaj gönder       |
| `chat:typing`       | `{ receiverId }`          | Yazıyor göstergesi |
| `chat:read`         | `{ senderId }`            | Okundu bilgisi     |
| `session:heartbeat` | `{ sessionId, duration }` | Oturum heartbeat   |

### Server → Client

| Event              | Data              | Açıklama           |
| ------------------ | ----------------- | ------------------ |
| `chat:message`     | `ChatMessage`     | Yeni mesaj         |
| `chat:typing`      | `{ userId }`      | Yazıyor göstergesi |
| `chat:read`        | `{ userId }`      | Okundu bilgisi     |
| `friend:online`    | `{ userId }`      | Arkadaş çevrimiçi  |
| `friend:offline`   | `{ userId }`      | Arkadaş çevrimdışı |
| `friend:playing`   | `{ userId, ... }` | Arkadaş oynuyor    |
| `notification:new` | `Notification`    | Yeni bildirim      |

## Session Tracking Mimarisi

```
Desktop Client (local)     Server
┌──────────────────┐      ┌────────────────┐
│ Her 5s: SQLite'a │      │                │
│ kaydet (offline)  │─60s─▶│ POST /heartbeat│
│                  │      │ → Redis cache  │
│                  │      │ → PostgreSQL   │
│ Oyun kapanınca:  │      │                │
│ POST /end        │─────▶│ Final kayıt    │
└──────────────────┘      └────────────────┘
```
