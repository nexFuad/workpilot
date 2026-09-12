import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
    AUTH_JWT_SECRET: z.string().min(32),
    DATABASE_URL: z.string().url(),
    FRONTEND_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
});
export const env = schema.parse(process.env);
