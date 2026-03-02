import { RedisCache } from "@/cache";

export async function cachedFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await RedisCache.get<T>(key);
    if (cached !== null) return cached;
  } catch {
    console.warn("[Cache] Redis read failed, fetching live");
  }

  const data = await fetcher();

  try {
    await RedisCache.set(key, data, ttlSeconds);
  } catch {
    console.warn("[Cache] Redis write failed, continuing without cache");
  }

  return data;
}
