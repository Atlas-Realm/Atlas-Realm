import { and, desc, eq, isNull } from "drizzle-orm";
import type { db as DB } from "@/db";
import { notifications, type NewNotification, type Notification } from "@/db/schema";
import type { INotificationsRepository } from "./notifications.types";

export class NotificationsRepository implements INotificationsRepository {
  constructor(private readonly db: typeof DB) {}

  async create(data: NewNotification): Promise<Notification> {
    const [notification] = await this.db.insert(notifications).values(data).returning();
    return notification;
  }

  async findByUser(userId: string, limit: number, offset: number): Promise<Notification[]> {
    return this.db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit,
      offset,
    });
  }

  async markRead(userId: string, notificationId: string): Promise<Notification | undefined> {
    const [notification] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning();
    return notification;
  }

  async markAllRead(userId: string): Promise<number> {
    const updated = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
      .returning({ id: notifications.id });

    return updated.length;
  }
}
