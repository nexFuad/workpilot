import 'dotenv/config';
import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),
    FRONTEND_URL: z.string().url().optional(),
});
export const env = envSchema.parse(process.env);
