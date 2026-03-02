import { integer, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { games } from "./games";
import { users } from "./users";

export const sessionStatusEnum = pgEnum("session_status", ["active", "paused", "completed"]);

export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),
  status: sessionStatusEnum("status").notNull().default("active"),
});

export type GameSession = typeof gameSessions.$inferSelect;
export type NewGameSession = typeof gameSessions.$inferInsert;
