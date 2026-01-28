import { PrismaClient } from '@juries/database';

// In-memory cache for feature flags (refreshed every 60 seconds)
let flagCache: Map<string, boolean> = new Map();
let lastCacheUpdate = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Check if a feature flag is enabled
 * Uses in-memory caching to avoid database calls on every request
 */
export async function isFeatureEnabled(
  prisma: PrismaClient,
  flagKey: string,
  organizationId?: string | null
): Promise<boolean> {
  const now = Date.now();

  // Refresh cache if expired
  if (now - lastCacheUpdate > CACHE_TTL) {
    await refreshFlagCache(prisma);
  }

  // Check organization-specific flag first
  if (organizationId) {
    const orgKey = `${flagKey}:${organizationId}`;
    if (flagCache.has(orgKey)) {
      return flagCache.get(orgKey)!;
    }
  }

  // Fall back to global flag
  return flagCache.get(`${flagKey}:global`) || false;
}

/**
 * Refresh the feature flag cache from database
 */
async function refreshFlagCache(prisma: PrismaClient): Promise<void> {
  try {
    const flags = await prisma.featureFlag.findMany({
      select: {
        key: true,
        enabled: true,
        organizationId: true,
      },
    });

    flagCache.clear();

    for (const flag of flags) {
      const key = flag.organizationId
        ? `${flag.key}:${flag.organizationId}`
        : `${flag.key}:global`;
      flagCache.set(key, flag.enabled);
    }

    lastCacheUpdate = Date.now();
  } catch (error) {
    console.error('Error refreshing feature flag cache:', error);
  }
}

/**
 * Force refresh the feature flag cache
 * Call this after updating flags via admin API
 */
export async function refreshFeatureFlags(prisma: PrismaClient): Promise<void> {
  await refreshFlagCache(prisma);
}

/**
 * Feature flag constants for type safety
 */
export const FeatureFlags = {
  PERSONAS_V2: 'personas_v2',
  FOCUS_GROUPS_V2: 'focus_groups_v2',
  VOIR_DIRE_V2: 'voir_dire_v2',
} as const;
