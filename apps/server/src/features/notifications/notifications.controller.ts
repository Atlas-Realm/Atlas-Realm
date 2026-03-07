import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import type { JWTPayload } from "@/middleware/auth";
import type { INotificationsService } from "./notifications.types";

export class NotificationsController {
  constructor(private readonly notificationsService: INotificationsService) {}

  listNotifications = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { limit, offset } = c.req.valid("query" as never) as { limit?: number; offset?: number };
    const notifications = await this.notificationsService.list(user.sub, limit, offset);
    return c.json(successResponse(notifications), 200);
  };

  markRead = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { id } = c.req.valid("param" as never) as { id: string };
    const notification = await this.notificationsService.markRead(user.sub, id);
    return c.json(successResponse(notification), 200);
  };

  markAllRead = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const result = await this.notificationsService.markAllRead(user.sub);
    return c.json(successResponse(result), 200);
  };
}
