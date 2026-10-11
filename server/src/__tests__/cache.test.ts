import { CacheService, CacheKeys, memoryCache } from '../cache/nodeCache';

describe('NodeCache Strategy and Tenant Isolation in Cache', () => {
  beforeEach(() => {
    memoryCache.flushAll();
  });

  test('CacheKeys generates tenant-prefixed keys', () => {
    const orgId = '507f1f77bcf86cd799439011';
    const settingsKey = CacheKeys.orgSettings(orgId);
    const summaryKey = CacheKeys.dashboardSummary(orgId);

    expect(settingsKey).toBe(`tenant:${orgId}:settings`);
    expect(summaryKey).toBe(`tenant:${orgId}:dashboard:summary`);
  });

  test('getOrSet stores and retrieves cached values', async () => {
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount++;
      return { score: 95 };
    };

    const key = 'tenant:org123:dashboard:summary';
    const firstCall = await CacheService.getOrSet(key, fetcher, 60);
    const secondCall = await CacheService.getOrSet(key, fetcher, 60);

    expect(firstCall).toEqual({ score: 95 });
    expect(secondCall).toEqual({ score: 95 });
    expect(fetchCount).toBe(1); // Cached, fetcher called only once!
  });

  test('invalidateTenant removes only targeted tenant keys without affecting other tenants', async () => {
    const tenantA = 'orgA';
    const tenantB = 'orgB';

    memoryCache.set(`tenant:${tenantA}:summary`, { tenant: 'A' }, 60);
    memoryCache.set(`tenant:${tenantA}:settings`, { currency: 'BDT' }, 60);
    memoryCache.set(`tenant:${tenantB}:summary`, { tenant: 'B' }, 60);

    CacheService.invalidateTenant(tenantA);

    expect(memoryCache.get(`tenant:${tenantA}:summary`)).toBeUndefined();
    expect(memoryCache.get(`tenant:${tenantA}:settings`)).toBeUndefined();
    // Tenant B's cache must remain intact!
    expect(memoryCache.get(`tenant:${tenantB}:summary`)).toEqual({ tenant: 'B' });
  });
});
