import { apiJson } from "../../lib/apiClient";

type CacheEntry = { ts: number; data: unknown };

const cache = new Map<string, CacheEntry>();
const TTL_MS = 30_000;

export async function cachedDashboardJson<T>(path: string, force = false): Promise<T> {
  const now = Date.now();
  const cached = cache.get(path);
  if (!force && cached && now - cached.ts < TTL_MS) return cached.data as T;

  const data = await apiJson<T>(path);
  cache.set(path, { ts: now, data });
  return data;
}
