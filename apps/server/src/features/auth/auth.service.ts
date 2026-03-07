import { verify, sign } from "hono/jwt";
import { env } from "@/config/env";
import { ConflictError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import type { ICacheService } from "@/cache";
import type { AuthUser, IAuthRepository, IAuthService } from "./auth.types";

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * multipliers[unit];
}

function toAuthUser(user: {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

export class AuthService implements IAuthService {
  constructor(
    private readonly repo: IAuthRepository,
    private readonly cache: ICacheService,
  ) {}

  private async createTokenPair(userId: string, email: string, username: string) {
    const accessJti = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const accessExpiresIn = parseExpiry(env.JWT_ACCESS_EXPIRES_IN);
    const refreshExpiresIn = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

    const accessToken = await sign(
      { sub: userId, email, username, jti: accessJti, iat: now, exp: now + accessExpiresIn },
      env.JWT_ACCESS_SECRET,
    );

    const refreshToken = await sign(
      { sub: userId, jti: refreshJti, iat: now, exp: now + refreshExpiresIn },
      env.JWT_REFRESH_SECRET,
    );

    await this.cache.set(`refresh:${userId}:${refreshJti}`, { userId }, refreshExpiresIn);

    return { accessToken, refreshToken };
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
    return { user: toAuthUser(user), tokens };
  }

  async login(email: string, password: string) {
    const user = await this.repo.findByEmail(email);
    if (!user) throw new UnauthorizedError("auth.invalid_credentials");

    const valid = await Bun.password.verify(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("auth.invalid_credentials");

    const tokens = await this.createTokenPair(user.id, user.email, user.username);
    return { user: toAuthUser(user), tokens };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; jti: string };

    try {
      payload = (await verify(refreshToken, env.JWT_REFRESH_SECRET, "HS256")) as { sub: string; jti: string };
    } catch {
      throw new UnauthorizedError("auth.invalid_refresh_token");
    }

    const key = `refresh:${payload.sub}:${payload.jti}`;
    const stored = await this.cache.get<{ userId: string }>(key);
    if (!stored) throw new UnauthorizedError("auth.refresh_token_expired");

    await this.cache.del(key);

    const user = await this.repo.findById(payload.sub);
    if (!user) throw new UnauthorizedError("auth.user_not_found");

    const tokens = await this.createTokenPair(user.id, user.email, user.username);
    return { tokens };
  }

  async logout(userId: string, refreshToken: string) {
    let payload: { sub: string; jti: string };

    try {
      payload = (await verify(refreshToken, env.JWT_REFRESH_SECRET, "HS256")) as { sub: string; jti: string };
    } catch {
      throw new UnauthorizedError("auth.invalid_refresh_token");
    }

    if (payload.sub !== userId) {
      throw new UnauthorizedError("auth.invalid_refresh_token");
    }

    await this.cache.del(`refresh:${payload.sub}:${payload.jti}`);
  }

  async me(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError("auth.user_not_found");
    return toAuthUser(user);
  }

  async getOAuthUrl(provider: "google" | "discord") {
    const oauthUrls: Record<"google" | "discord", string | undefined> = {
      google: env.GOOGLE_OAUTH_URL,
      discord: env.DISCORD_OAUTH_URL,
    };

    return { provider, url: oauthUrls[provider] ?? null };
  }
}
