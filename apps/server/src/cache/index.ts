import Redis from "ioredis";
import { env } from "@/config/env";

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  cachedFetch<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T>;
}

export class CacheService implements ICacheService {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (value === null) return null;
    return JSON.parse(value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.redis.exists(key);
    return count > 0;
  }

  async cachedFetch<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) return cached;
    } catch {
      console.warn("[Cache] Redis read failed, fetching live");
    }

    const data = await fetcher();

    try {
      await this.set(key, data, ttlSeconds);
    } catch {
      console.warn("[Cache] Redis write failed, continuing without cache");
    }

    return data;
  }
}

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

redis.on("connect", () => {
  console.log("[Redis] Connected");
});
