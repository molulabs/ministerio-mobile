import { defineConfig } from 'drizzle-kit';

/** `pnpm db:generate` writes a migration from the changes in schema.ts. */
export default defineConfig({
  schema: './src/infrastructure/db/schema.ts',
  out: './src/infrastructure/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
});
