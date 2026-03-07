import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import type { JWTPayload } from "@/middleware/auth";
import type { ISocialService } from "./social.types";

export class SocialController {
  constructor(private readonly socialService: ISocialService) {}

  getFriends = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const friends = await this.socialService.getFriends(user.sub);
    return c.json(successResponse(friends), 200);
  };

  sendRequest = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { userId } = c.req.valid("json" as never) as { userId: string };
    const result = await this.socialService.sendFriendRequest(user.sub, userId);
    return c.json(successResponse(result), 201);
  };

  getPendingRequests = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const requests = await this.socialService.getPendingRequests(user.sub);
    return c.json(successResponse(requests), 200);
  };

  acceptRequest = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { id } = c.req.valid("param" as never) as { id: string };
    const result = await this.socialService.acceptRequest(user.sub, id);
    return c.json(successResponse(result), 200);
  };

  rejectRequest = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { id } = c.req.valid("param" as never) as { id: string };
    const result = await this.socialService.rejectRequest(user.sub, id);
    return c.json(successResponse(result), 200);
  };

  removeFriend = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { friendId } = c.req.valid("param" as never) as { friendId: string };
    const result = await this.socialService.removeFriend(user.sub, friendId);
    return c.json(successResponse(result), 200);
  };
}
