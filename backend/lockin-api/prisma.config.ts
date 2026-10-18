import { defineConfig } from 'prisma/config';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// Neon manages the local branch connection strings at the repository root.
// Prisma Migrate must use the direct URL; runtime keeps the pooled URL.
loadEnv({ path: resolve(process.cwd(), '../../.env.local') });
loadEnv({ path: resolve(process.cwd(), '.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
  },
});
