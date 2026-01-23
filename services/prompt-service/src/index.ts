import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { PrismaClient } from '@prisma/client';
import { config } from './config/index.js';
import { PromptService } from './services/prompt-service.js';
import { CacheService } from './services/cache-service.js';
import { promptRoutes } from './routes/prompts.js';
import { adminRoutes } from './routes/admin.js';

// Initialize services
const prisma = new PrismaClient();
const cache = new CacheService();
const promptService = new PromptService(prisma, cache);

// Create Fastify server
const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'debug' : 'info',
  },
});

// Register plugins
await fastify.register(cors, {
  origin: true, // TODO: Configure based on environment
  credentials: true,
});

await fastify.register(helmet);

// Health check
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: cache.isEnabled() ? 'connected' : 'disabled',
  };
});

// Register routes
await fastify.register(promptRoutes, {
  prefix: '/api/v1/prompts',
  promptService,
});

await fastify.register(adminRoutes, {
  prefix: '/api/v1/admin',
  promptService,
});

// Graceful shutdown
const gracefulShutdown = async () => {
  fastify.log.info('Shutting down gracefully...');

  try {
    await fastify.close();
    await prisma.$disconnect();
    await cache.close();
    process.exit(0);
  } catch (error) {
    fastify.log.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
try {
  await fastify.listen({
    port: config.port,
    host: config.host,
  });

  fastify.log.info(`Prompt Service listening on ${config.host}:${config.port}`);
  fastify.log.info(`Environment: ${config.nodeEnv}`);
  fastify.log.info(`Cache: ${cache.isEnabled() ? 'enabled' : 'disabled'}`);
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
