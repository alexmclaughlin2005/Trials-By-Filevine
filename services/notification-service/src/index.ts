import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { NotificationService } from './services/notification-service';
import { EmailService } from './services/email-service';
import { QueueProcessor } from './services/queue-processor';
import { notificationRoutes } from './routes/notifications';
import { healthRoutes } from './routes/health';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3004', 10);
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

  await fastify.register(helmet);

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
  });

  // Initialize Redis
  const redisUrl = process.env.REDIS_URL;
  const redis = redisUrl
    ? new Redis(redisUrl)
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      });

  // Initialize services
  const emailService = new EmailService();
  const notificationService = new NotificationService(redis, emailService);
  const queueProcessor = new QueueProcessor(redis, notificationService);

  // Start queue processor
  await queueProcessor.start();

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(notificationRoutes, { notificationService });

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      fastify.log.info(`Received ${signal}, closing server...`);
      await queueProcessor.stop();
      await redis.quit();
      await fastify.close();
      process.exit(0);
    });
  });

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Notification Service running on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
