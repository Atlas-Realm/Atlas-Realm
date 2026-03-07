import { and, desc, eq, inArray, ne } from "drizzle-orm";
import type { db as DB } from "@/db";
import { activities, friends, type Activity, type NewActivity } from "@/db/schema";
import type { IActivitiesRepository } from "./activities.types";

export class ActivitiesRepository implements IActivitiesRepository {
  constructor(private readonly db: typeof DB) {}

  async create(data: NewActivity): Promise<Activity> {
    const [activity] = await this.db.insert(activities).values(data).returning();
    return activity;
  }

  async findByActor(actorId: string, limit: number, offset: number): Promise<Activity[]> {
    return this.db.query.activities.findMany({
      where: eq(activities.actorId, actorId),
      orderBy: [desc(activities.createdAt)],
      limit,
      offset,
    });
  }

  async findFeedByUser(userId: string, limit: number, offset: number): Promise<Activity[]> {
    const connections = await this.db
      .select({ friendId: friends.friendId })
      .from(friends)
      .where(and(eq(friends.userId, userId), ne(friends.friendId, userId)));

    const actorIds = connections.map((item) => item.friendId);
    if (actorIds.length === 0) return [];

    return this.db.query.activities.findMany({
      where: and(inArray(activities.actorId, actorIds), ne(activities.visibility, "private")),
      orderBy: [desc(activities.createdAt)],
      limit,
      offset,
    });
  }
}
