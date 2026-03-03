import { sign } from "hono/jwt";
import { env } from "@/config/env";
import { ConflictError, UnauthorizedError } from "@/lib/errors";
import type { ICacheService } from "@/cache";
import type { IAuthRepository, IAuthService } from "./auth.types";

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * multipliers[unit];
}

export class AuthService implements IAuthService {
  constructor(
    private readonly repo: IAuthRepository,
    private readonly cache: ICacheService,
  ) {}

  private async createTokenPair(userId: string, email: string, username: string) {
    const jti = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const accessExpiresIn = parseExpiry(env.JWT_ACCESS_EXPIRES_IN);
    const refreshExpiresIn = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

    const accessToken = await sign(
      { sub: userId, email, username, jti, iat: now, exp: now + accessExpiresIn },
      env.JWT_ACCESS_SECRET,
    );

    const refreshJti = crypto.randomUUID();
    const refreshToken = await sign(
      { sub: userId, jti: refreshJti, iat: now, exp: now + refreshExpiresIn },
      env.JWT_REFRESH_SECRET,
    );

    await this.cache.set(`refresh:${userId}:${refreshJti}`, { userId }, refreshExpiresIn);

    return { accessToken, refreshToken, refreshJti };
  }

  async register(email: string, username: string, password: string) {
    const [existingEmail, existingUsername] = await Promise.all([
      this.repo.findByEmail(email),
      this.repo.findByUsername(username),
    ]);

    if (existingEmail) throw new ConflictError("auth.email_in_use");
    if (existingUsername) throw new ConflictError("auth.username_taken");

    const passwordHash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 12 });
    const user = await this.repo.create({ email, username, passwordHash });

    const tokens = await this.createTokenPair(user.id, user.email, user.username);
    return { user: { id: user.id, email: user.email, username: user.username }, tokens };
  }

  async login(email: string, password: string) {
    const user = await this.repo.findByEmail(email);
    if (!user) throw new UnauthorizedError("auth.invalid_credentials");

    const valid = await Bun.password.verify(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("auth.invalid_credentials");

    const tokens = await this.createTokenPair(user.id, user.email, user.username);
    return { user: { id: user.id, email: user.email, username: user.username }, tokens };
  }

  async refresh(refreshToken: string) {
    const { verify } = await import("hono/jwt"); // dynamic import matches original pattern (static verify has TS arity issue in this hono version)
    let payload: { sub: string; jti: string };
    try {
      payload = (await verify(refreshToken, env.JWT_REFRESH_SECRET)) as typeof payload;
    } catch {
      throw new UnauthorizedError("auth.invalid_refresh_token");
    }

    const key = `refresh:${payload.sub}:${payload.jti}`;
    const stored = await this.cache.get(key);
    if (!stored) throw new UnauthorizedError("auth.refresh_token_expired");

    await this.cache.del(key);

    const user = await this.repo.findById(payload.sub);
    if (!user) throw new UnauthorizedError("auth.user_not_found");

    const tokens = await this.createTokenPair(user.id, user.email, user.username);
    return { tokens };
  }

  async logout(userId: string, refreshJti: string) {
    await this.cache.del(`refresh:${userId}:${refreshJti}`);
  }
}
