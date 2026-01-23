import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  port: z.number().default(3001),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string(),
  jwtSecret: z.string(),
  jwtExpiresIn: z.string().default('7d'),
  allowedOrigins: z.string().transform((val) => val.split(',').map(s => s.trim())),
  rateLimitMax: z.number().default(100),
  rateLimitWindow: z.string().default('15m'),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  blobReadWriteToken: z.string().optional(),
});

export const config = configSchema.parse({
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '15m',
  logLevel: process.env.LOG_LEVEL || 'info',
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
});

export type Config = z.infer<typeof configSchema>;
