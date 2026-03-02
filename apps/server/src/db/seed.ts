import { db } from "@/db";
import { gameSessions, games, users } from "@/db/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // --- Temizle (FK sırasına göre) ---
  await db.delete(gameSessions);
  await db.delete(games);
  await db.delete(users);
  console.log("  ✓ Tables cleared");

  // --- Users ---
  const passwordHash = await Bun.password.hash("atlas123", { algorithm: "bcrypt", cost: 10 });

  const [atlas, demo] = await db
    .insert(users)
    .values([
      {
        email: "atlas@example.com",
        username: "atlas",
        passwordHash,
      },
      {
        email: "demo@example.com",
        username: "demo",
        passwordHash: await Bun.password.hash("demo123", { algorithm: "bcrypt", cost: 10 }),
      },
    ])
    .returning();

  console.log(`  ✓ Users: ${atlas.username}, ${demo.username}`);

  // --- Games ---
  const now = new Date();

  const insertedGames = await db
    .insert(games)
    .values([
      {
        externalId: "1245620",
        source: "steam",
        name: "Elden Ring",
        metadata: {
          coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
          genres: ["Action RPG", "Open World"],
          developer: "FromSoftware",
          releaseYear: 2022,
        },
        lastFetchedAt: now,
      },
      {
        externalId: "292030",
        source: "steam",
        name: "The Witcher 3: Wild Hunt",
        metadata: {
          coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg",
          genres: ["RPG", "Open World"],
          developer: "CD Projekt Red",
          releaseYear: 2015,
        },
        lastFetchedAt: now,
      },
      {
        externalId: "1091500",
        source: "steam",
        name: "Cyberpunk 2077",
        metadata: {
          coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
          genres: ["Action RPG", "Open World"],
          developer: "CD Projekt Red",
          releaseYear: 2020,
        },
        lastFetchedAt: now,
      },
      {
        externalId: "367520",
        source: "steam",
        name: "Hollow Knight",
        metadata: {
          coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg",
          genres: ["Metroidvania", "Indie"],
          developer: "Team Cherry",
          releaseYear: 2017,
        },
        lastFetchedAt: now,
      },
      {
        externalId: "413150",
        source: "steam",
        name: "Stardew Valley",
        metadata: {
          coverUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg",
          genres: ["Simulation", "RPG"],
          developer: "ConcernedApe",
          releaseYear: 2016,
        },
        lastFetchedAt: now,
      },
    ])
    .returning();

  const [eldenRing, witcher3, cyberpunk, hollowKnight, stardew] = insertedGames;
  console.log(`  ✓ Games: ${insertedGames.map((g) => g.name).join(", ")}`);

  // --- Game Sessions ---
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000);

  await db.insert(gameSessions).values([
    // atlas — tamamlanmış oturumlar
    {
      userId: atlas.id,
      gameId: eldenRing.id,
      startedAt: hoursAgo(72),
      endedAt: hoursAgo(69),
      durationSeconds: 3 * 3600,
      status: "completed",
    },
    {
      userId: atlas.id,
      gameId: eldenRing.id,
      startedAt: hoursAgo(48),
      endedAt: hoursAgo(43),
      durationSeconds: 5 * 3600,
      status: "completed",
    },
    {
      userId: atlas.id,
      gameId: witcher3.id,
      startedAt: hoursAgo(24),
      endedAt: hoursAgo(20),
      durationSeconds: 4 * 3600,
      status: "completed",
    },
    // atlas — aktif oturum
    {
      userId: atlas.id,
      gameId: cyberpunk.id,
      startedAt: hoursAgo(1),
      status: "active",
    },
    // demo — tamamlanmış
    {
      userId: demo.id,
      gameId: hollowKnight.id,
      startedAt: hoursAgo(36),
      endedAt: hoursAgo(34),
      durationSeconds: 2 * 3600,
      status: "completed",
    },
    // demo — duraklatılmış
    {
      userId: demo.id,
      gameId: stardew.id,
      startedAt: hoursAgo(5),
      status: "paused",
    },
  ]);

  console.log("  ✓ Game sessions created");
  console.log("\n✅ Seed complete!\n");
  console.log("  📧 atlas@example.com  / 🔑 atlas123");
  console.log("  📧 demo@example.com   / 🔑 demo123");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
