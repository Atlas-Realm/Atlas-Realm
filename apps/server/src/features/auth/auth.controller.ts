import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import type { IAuthService } from "./auth.types";

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  register = async (c: Context) => {
    const body = c.req.valid("json" as never);
    const result = await this.authService.register(
      (body as any).email,
      (body as any).username,
      (body as any).password,
    );
    return c.json(successResponse(result), 201);
  };

  login = async (c: Context) => {
    const body = c.req.valid("json" as never);
    const result = await this.authService.login((body as any).email, (body as any).password);
    return c.json(successResponse(result), 200);
  };

  refresh = async (c: Context) => {
    const body = c.req.valid("json" as never);
    const result = await this.authService.refresh((body as any).refreshToken);
    return c.json(successResponse(result), 200);
  };
}
