import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { games } from "./games";
import { users } from "./users";

export const userGames = pgTable(
  "user_games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    platform: text("platform").notNull().default("manual"),
    isInstalled: boolean("is_installed").notNull().default(false),
    installPath: text("install_path"),
    lastPlayedAt: timestamp("last_played_at"),
    totalPlaytimeSeconds: integer("total_playtime_seconds").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userGameUnique: uniqueIndex("user_games_user_id_game_id_unique").on(table.userId, table.gameId),
  }),
);

export type UserGame = typeof userGames.$inferSelect;
export type NewUserGame = typeof userGames.$inferInsert;
