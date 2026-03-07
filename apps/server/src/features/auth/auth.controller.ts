import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import type { JWTPayload } from "@/middleware/auth";
import type { IAuthService } from "./auth.types";

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  register = async (c: Context) => {
    const body = c.req.valid("json" as never) as {
      email: string;
      username: string;
      password: string;
    };

    const result = await this.authService.register(body.email, body.username, body.password);
    return c.json(successResponse(result), 201);
  };

  login = async (c: Context) => {
    const body = c.req.valid("json" as never) as {
      email: string;
      password: string;
    };

    const result = await this.authService.login(body.email, body.password);
    return c.json(successResponse(result), 200);
  };

  refresh = async (c: Context) => {
    const body = c.req.valid("json" as never) as { refreshToken: string };
    const result = await this.authService.refresh(body.refreshToken);
    return c.json(successResponse(result), 200);
  };

  logout = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const body = c.req.valid("json" as never) as { refreshToken: string };
    await this.authService.logout(user.sub, body.refreshToken);
    return c.json(successResponse({ loggedOut: true as const }), 200);
  };

  me = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const result = await this.authService.me(user.sub);
    return c.json(successResponse(result), 200);
  };

  google = async (c: Context) => {
    const result = await this.authService.getOAuthUrl("google");
    return c.json(successResponse(result), 200);
  };

  discord = async (c: Context) => {
    const result = await this.authService.getOAuthUrl("discord");
    return c.json(successResponse(result), 200);
  };
}
