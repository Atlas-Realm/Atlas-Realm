import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import { authService } from "./auth.service";

export const register = async (c: Context) => {
  const body = c.req.valid("json" as never);
  const result = await authService.register(
    (body as any).email,
    (body as any).username,
    (body as any).password,
  );
  return c.json(successResponse(result), 201);
};

export const login = async (c: Context) => {
  const body = c.req.valid("json" as never);
  const result = await authService.login((body as any).email, (body as any).password);
  return c.json(successResponse(result), 200);
};

export const refresh = async (c: Context) => {
  const body = c.req.valid("json" as never);
  const result = await authService.refresh((body as any).refreshToken);
  return c.json(successResponse(result), 200);
};
