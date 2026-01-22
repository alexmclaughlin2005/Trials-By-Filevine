export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-me',

  // Cache TTL in seconds
  cacheTTL: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes default

  // Enable/disable features
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  requireAuth: process.env.REQUIRE_AUTH !== 'false',
};
