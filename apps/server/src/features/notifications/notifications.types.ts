import type { NewNotification, Notification } from "@/db/schema";

export type NotificationData = Record<string, unknown> | null | undefined;

export interface INotificationsRepository {
  create(data: NewNotification): Promise<Notification>;
  findByUser(userId: string, limit: number, offset: number): Promise<Notification[]>;
  markRead(userId: string, notificationId: string): Promise<Notification | undefined>;
  markAllRead(userId: string): Promise<number>;
}

export interface INotificationPublisher {
  notify(input: {
    userId: string;
    type: Notification["type"];
    title: string;
    message: string;
    data?: NotificationData;
  }): Promise<Notification>;
}

export interface INotificationsService extends INotificationPublisher {
  list(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  markRead(userId: string, notificationId: string): Promise<Notification>;
  markAllRead(userId: string): Promise<{ updated: number }>;
}
