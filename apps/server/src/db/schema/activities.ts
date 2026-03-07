import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const activityVisibilityEnum = pgEnum("activity_visibility", [
  "public",
  "friends",
  "private",
]);

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  payload: jsonb("payload"),
  visibility: activityVisibilityEnum("visibility").notNull().default("friends"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
