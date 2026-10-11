import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// Load .env file from server directory or current working directory
const serverEnvPath = path.resolve(__dirname, '../../.env');
const cwdServerEnvPath = path.resolve(process.cwd(), 'server', '.env');
const cwdEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(cwdServerEnvPath)) {
  dotenv.config({ path: cwdServerEnvPath });
} else {
  dotenv.config({ path: cwdEnvPath });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb+srv://triUser:3vSlTdtFO8a27OHm@cluster0.ab3rgue.mongodb.net/'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  
  // Firebase configuration
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),

  // Redis configuration for BullMQ
  REDIS_URL: z.string().optional(),

  // Storage configuration
  DOCUMENT_STORAGE_PROVIDER: z.enum(['local', 's3', 'gcs']).default('local'),
  DOCUMENT_STORAGE_PATH: z.string().default('./uploads'),

  // Super-admin bootstrap secret
  BOOTSTRAP_SECRET: z.string().optional(),

  // Caching
  CACHE_TTL_SECONDS: z.coerce.number().default(300),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().default(300),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid server environment configuration:');
  console.error(parsedEnv.error.format());
  // In development, keep safe defaults; in production, fail fast
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsedEnv.success ? parsedEnv.data : envSchema.parse({});
