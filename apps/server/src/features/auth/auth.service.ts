import { sign } from "hono/jwt";
import { RedisCache } from "@/cache";
import { env } from "@/config/env";
import { ConflictError, UnauthorizedError } from "@/lib/errors";
import { authRepository } from "./auth.repository";

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * multipliers[unit];
}

function generateTokenId(): string {
  return crypto.randomUUID();
}

async function createTokenPair(userId: string, email: string, username: string) {
  const jti = generateTokenId();
  const now = Math.floor(Date.now() / 1000);
  const accessExpiresIn = parseExpiry(env.JWT_ACCESS_EXPIRES_IN);
  const refreshExpiresIn = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

  const accessToken = await sign(
    { sub: userId, email, username, jti, iat: now, exp: now + accessExpiresIn },
    env.JWT_ACCESS_SECRET,
  );

  const refreshJti = generateTokenId();
  const refreshToken = await sign(
    { sub: userId, jti: refreshJti, iat: now, exp: now + refreshExpiresIn },
    env.JWT_REFRESH_SECRET,
  );

  await RedisCache.set(`refresh:${userId}:${refreshJti}`, { userId }, refreshExpiresIn);

  return { accessToken, refreshToken, refreshJti };
}

export const authService = {
  async register(email: string, username: string, password: string) {
    const [existingEmail, existingUsername] = await Promise.all([
      authRepository.findByEmail(email),
      authRepository.findByUsername(username),
    ]);

    if (existingEmail) throw new ConflictError("auth.email_in_use");
    if (existingUsername) throw new ConflictError("auth.username_taken");

    const passwordHash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 12 });
    const user = await authRepository.create({ email, username, passwordHash });

    const tokens = await createTokenPair(user.id, user.email, user.username);
    return { user: { id: user.id, email: user.email, username: user.username }, tokens };
  },

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw new UnauthorizedError("auth.invalid_credentials");

    const valid = await Bun.password.verify(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("auth.invalid_credentials");

    const tokens = await createTokenPair(user.id, user.email, user.username);
    return { user: { id: user.id, email: user.email, username: user.username }, tokens };
  },

  async refresh(refreshToken: string) {
    const { verify } = await import("hono/jwt");
    let payload: { sub: string; jti: string };
    try {
      payload = (await verify(refreshToken, env.JWT_REFRESH_SECRET)) as typeof payload;
    } catch {
      throw new UnauthorizedError("auth.invalid_refresh_token");
    }

    const key = `refresh:${payload.sub}:${payload.jti}`;
    const stored = await RedisCache.get(key);
    if (!stored) throw new UnauthorizedError("auth.refresh_token_expired");

    await RedisCache.del(key);

    const user = await authRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedError("auth.user_not_found");

    const tokens = await createTokenPair(user.id, user.email, user.username);
    return { tokens };
  },

  async logout(userId: string, refreshJti: string) {
    await RedisCache.del(`refresh:${userId}:${refreshJti}`);
  },
};
