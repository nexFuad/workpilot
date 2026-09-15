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
});

const runtimeEnv = (globalThis as { process: { env: Record<string, string | undefined> } }).process.env;

export const env = schema.parse(runtimeEnv);
