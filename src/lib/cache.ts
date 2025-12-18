// src/lib/cache.ts

type CacheValue = unknown;

class SimpleCache {
  private store = new Map<string, { value: CacheValue; expiresAt: number }>();

  constructor(private defaultTtlMs = 24 * 60 * 60 * 1000) {}

  get<T = CacheValue>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set(key: string, value: CacheValue, ttlMs?: number) {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
  }
}

export const cache = new SimpleCache();
