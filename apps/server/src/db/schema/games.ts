import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const gameSourceEnum = pgEnum("game_source", ["steam", "rawg", "igdb", "manual"]);

export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id"),
  source: gameSourceEnum("source").notNull(),
  name: text("name").notNull(),
  metadata: jsonb("metadata"),
  lastFetchedAt: timestamp("last_fetched_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
