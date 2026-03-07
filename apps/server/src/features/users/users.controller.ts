import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import type { JWTPayload } from "@/middleware/auth";
import type { IUsersService } from "./users.types";

export class UsersController {
  constructor(private readonly usersService: IUsersService) {}

  getMe = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const result = await this.usersService.getMe(user.sub);
    return c.json(successResponse(result), 200);
  };

  updateMe = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const body = c.req.valid("json" as never) as {
      displayName?: string | null;
      bio?: string | null;
      avatarUrl?: string | null;
    };

    const result = await this.usersService.updateMe(user.sub, body);
    return c.json(successResponse(result), 200);
  };

  search = async (c: Context) => {
    const { q, limit } = c.req.valid("query" as never) as { q: string; limit?: number };
    const result = await this.usersService.search(q, limit);
    return c.json(successResponse(result), 200);
  };

  getByUsername = async (c: Context) => {
    const { username } = c.req.valid("param" as never) as { username: string };
    const result = await this.usersService.getPublicProfile(username);
    return c.json(successResponse(result), 200);
  };
}
