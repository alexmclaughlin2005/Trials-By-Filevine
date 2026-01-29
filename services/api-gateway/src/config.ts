import dotenv from 'dotenv';
import { z } from 'zod';
import * as path from 'path';

// Load .env from the api-gateway directory, or fall back to root
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') }); // Also try root .env

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

const nodeEnv = process.env.NODE_ENV || 'development';

// Use higher rate limits in development
const defaultRateLimitMax = nodeEnv === 'development' ? '10000' : '100';
const defaultRateLimitWindow = nodeEnv === 'development' ? '1m' : '15m';

export const config = configSchema.parse({
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || defaultRateLimitMax, 10),
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW || defaultRateLimitWindow,
  logLevel: process.env.LOG_LEVEL || 'info',
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
});

export type Config = z.infer<typeof configSchema>;
