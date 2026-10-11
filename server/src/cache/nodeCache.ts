import NodeCache from 'node-cache';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Process-local cache with maximum keys and bounded TTL
export const memoryCache = new NodeCache({
  stdTTL: env.CACHE_TTL_SECONDS,
  checkperiod: 60,
  maxKeys: 5000,
  useClones: false,
});

memoryCache.on('expired', (key) => {
  logger.debug({ key }, 'NodeCache key expired');
});

/**
 * Tenant-scoped centralized cache key builders.
 * Enforces organizational boundary in every cached item.
 */
export const CacheKeys = {
  orgSettings: (orgId: string) => `tenant:${orgId}:settings`,
  dashboardSummary: (orgId: string) => `tenant:${orgId}:dashboard:summary`,
  complianceMetrics: (orgId: string) => `tenant:${orgId}:compliance:metrics`,
  riskMatrix: (orgId: string) => `tenant:${orgId}:risks:matrix`,
  platformStats: () => `platform:super-admin:stats`,
};

export class CacheService {
  /**
   * Get cached item or fetch and populate atomically.
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = env.CACHE_TTL_SECONDS
  ): Promise<T> {
    try {
      const cached = memoryCache.get<T>(key);
      if (cached !== undefined) {
        return cached;
      }
    } catch (err) {
      logger.warn({ key, err }, 'Cache read error, falling back to fetcher');
    }

    const fresh = await fetcher();
    try {
      if (fresh !== undefined && fresh !== null) {
        memoryCache.set(key, fresh, ttlSeconds);
      }
    } catch (err) {
      logger.warn({ key, err }, 'Cache write error');
    }

    return fresh;
  }

  /**
   * Invalidate specific key
   */
  static invalidate(key: string): void {
    memoryCache.del(key);
    logger.debug({ key }, 'Cache invalidated key');
  }

  /**
   * Invalidate all keys belonging to a specific tenant
   */
  static invalidateTenant(orgId: string): void {
    const keys = memoryCache.keys();
    const tenantPrefix = `tenant:${orgId}:`;
    const toDelete = keys.filter((k) => k.startsWith(tenantPrefix));
    if (toDelete.length > 0) {
      memoryCache.del(toDelete);
      logger.debug({ orgId, count: toDelete.length }, 'Invalidated all tenant cache keys');
    }
  }

  /**
   * Invalidate platform-level cache
   */
  static invalidatePlatform(): void {
    const keys = memoryCache.keys();
    const toDelete = keys.filter((k) => k.startsWith('platform:'));
    if (toDelete.length > 0) {
      memoryCache.del(toDelete);
      logger.debug({ count: toDelete.length }, 'Invalidated platform cache keys');
    }
  }

  /**
   * Clear entire cache
   */
  static flushAll(): void {
    memoryCache.flushAll();
  }
}
