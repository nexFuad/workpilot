import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  AUTH_JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  FRONTEND_URL: z
    .string()
    .url()
    .transform((value) => new URL(value).origin),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_MODEL: z.string().min(1).default('openrouter/free'),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
});

const runtimeEnv = (globalThis as { process: { env: Record<string, string | undefined> } }).process
  .env;

export const env = schema.parse(runtimeEnv);
