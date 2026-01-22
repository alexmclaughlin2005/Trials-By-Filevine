import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { CollaborationManager } from './services/collaboration-manager';
import { PresenceTracker } from './services/presence-tracker';
import { setupSocketHandlers } from './socket/handlers';
import { healthRoutes } from './routes/health';
import { presenceRoutes } from './routes/presence';
import { sessionRoutes } from './routes/session';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3003', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  // Initialize Fastify
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Allow WebSocket connections
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
  });

  // Initialize Redis for pub/sub
  const redisUrl = process.env.REDIS_URL;
  const pubClient = redisUrl
    ? new Redis(redisUrl)
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      });

  const subClient = pubClient.duplicate();

  // Initialize Socket.IO with Redis adapter
  const io = new Server(fastify.server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.adapter(createAdapter(pubClient, subClient));

  // Initialize collaboration services
  const collaborationManager = new CollaborationManager(io, pubClient);
  const presenceTracker = new PresenceTracker(io, pubClient);

  // Setup Socket.IO event handlers
  setupSocketHandlers(io, collaborationManager, presenceTracker);

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(presenceRoutes, { presenceTracker });
  await fastify.register(sessionRoutes, { collaborationManager });

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      fastify.log.info(`Received ${signal}, closing server...`);
      await io.close();
      await pubClient.quit();
      await subClient.quit();
      await fastify.close();
      process.exit(0);
    });
  });

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Collaboration Service running on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
