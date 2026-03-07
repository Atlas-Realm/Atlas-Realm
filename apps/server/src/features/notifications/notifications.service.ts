import { NotFoundError } from "@/lib/errors";
import type { INotificationsRepository, INotificationsService } from "./notifications.types";

export class NotificationsService implements INotificationsService {
  constructor(private readonly repo: INotificationsRepository) {}

  async notify(input: {
    userId: string;
    type: "friend_request" | "friend_accept" | "chat_message" | "activity" | "system";
    title: string;
    message: string;
    data?: Record<string, unknown> | null;
  }) {
    return this.repo.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data ?? null,
    });
  }

  async list(userId: string, limit = 50, offset = 0) {
    return this.repo.findByUser(userId, limit, offset);
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.repo.markRead(userId, notificationId);
    if (!notification) throw new NotFoundError("notifications.not_found");
    return notification;
  }

  async markAllRead(userId: string) {
    const updated = await this.repo.markAllRead(userId);
    return { updated };
  }
}
