import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import type { JWTPayload } from "@/middleware/auth";
import type { IActivitiesService } from "./activities.types";

export class ActivitiesController {
  constructor(private readonly activitiesService: IActivitiesService) {}

  feed = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { limit, offset } = c.req.valid("query" as never) as { limit?: number; offset?: number };
    const activities = await this.activitiesService.getFeed(user.sub, limit, offset);
    return c.json(successResponse(activities), 200);
  };

  me = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { limit, offset } = c.req.valid("query" as never) as { limit?: number; offset?: number };
    const activities = await this.activitiesService.getMine(user.sub, limit, offset);
    return c.json(successResponse(activities), 200);
  };

  byUser = async (c: Context) => {
    const { userId } = c.req.valid("param" as never) as { userId: string };
    const { limit, offset } = c.req.valid("query" as never) as { limit?: number; offset?: number };
    const activities = await this.activitiesService.getByUser(userId, limit, offset);
    return c.json(successResponse(activities), 200);
  };
}
