import Redis from "ioredis";
import { env } from "@/config/env";

const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

redis.on("connect", () => {
  console.log("[Redis] Connected");
});

export { redis };

export const RedisCache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (value === null) return null;
    return JSON.parse(value) as T;
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async exists(key: string): Promise<boolean> {
    const count = await redis.exists(key);
    return count > 0;
  },
};
