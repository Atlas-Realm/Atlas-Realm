import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { env } from "@/config/env";
import { UnauthorizedError } from "@/lib/errors";

export type JWTPayload = {
  sub: string;
  email: string;
  username: string;
  jti: string;
  exp: number;
  iat: number;
};

export const authMiddleware = createMiddleware<{
  Variables: { user: JWTPayload };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("errors.invalid_auth_header");
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verify(token, env.JWT_ACCESS_SECRET, "HS256");
    c.set("user", payload as JWTPayload);
  } catch {
    throw new UnauthorizedError("errors.invalid_token");
  }

  await next();
});
