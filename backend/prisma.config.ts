import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Set DIRECT_URL in Railway/Neon before running migrations.
  // The fallback only lets `prisma generate` run before a database exists.
  datasource: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      'postgresql://user:password@localhost:5432/workpilot',
  },
});
