import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { prisma } from '@juries/database';

// Import route modules
import { casesRoutes } from './routes/cases';
import { caseFactsRoutes } from './routes/case-facts';
import { caseArgumentsRoutes } from './routes/case-arguments';
import { caseWitnessesRoutes } from './routes/case-witnesses';
import { jurorsRoutes } from './routes/jurors';
import { personasRoutes } from './routes/personas';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { researchRoutes } from './routes/research';
import { focusGroupsRoutes } from './routes/focus-groups';
import { archetypeRoutes } from './routes/archetypes';
import { capturesRoutes } from './routes/captures';
import { synthesisRoutes } from './routes/synthesis';
import { filevineRoutes } from './routes/filevine';
// import { jurorResearchRoutes } from './routes/juror-research'; // Disabled - conflicts with jurorsRoutes

export async function buildServer() {
  const server = Fastify({
    logger: {
      level: config.logLevel,
      transport:
        config.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await server.register(helmet, {
    contentSecurityPolicy: config.nodeEnv === 'production',
  });

  // Log CORS configuration
  server.log.info({ allowedOrigins: config.allowedOrigins }, 'CORS configuration');

  await server.register(cors, {
    origin: config.allowedOrigins,
    credentials: true,
    preflight: true,
    strictPreflight: false,
    preflightContinue: false,
  });

  await server.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindow,
  });

  await server.register(jwt, {
    secret: config.jwtSecret,
  });

  // Add JWT authentication decorator
  server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Add Prisma to request context
  server.decorate('prisma', prisma);

  // Register routes
  await server.register(healthRoutes, { prefix: '/health' });
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(casesRoutes, { prefix: '/api/cases' });
  await server.register(caseFactsRoutes, { prefix: '/api/cases' });
  await server.register(caseArgumentsRoutes, { prefix: '/api/cases' });
  await server.register(caseWitnessesRoutes, { prefix: '/api/cases' });
  await server.register(jurorsRoutes, { prefix: '/api/jurors' });
  await server.register(personasRoutes, { prefix: '/api/personas' });
  await server.register(researchRoutes, { prefix: '/api/research' });
  await server.register(focusGroupsRoutes, { prefix: '/api/focus-groups' });
  await server.register(archetypeRoutes, { prefix: '/api/archetypes' });
  await server.register(capturesRoutes, { prefix: '/api' });
  await server.register(synthesisRoutes, { prefix: '/api' });
  await server.register(filevineRoutes, { prefix: '/api/filevine' });
  // await server.register(jurorResearchRoutes); // Disabled - conflicts with jurorsRoutes

  // Error handler
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    reply.code(statusCode).send({
      error: message,
      statusCode,
    });
  });

  return server;
}

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    prisma: typeof prisma;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      organizationId: string;
      email: string;
      role: string;
    };
  }
}
