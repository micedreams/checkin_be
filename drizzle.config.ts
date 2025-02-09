import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

import 'dotenv/config';

export default defineConfig({
  schema: './src/drizzle/schema.ts',
  dialect: 'postgresql',

  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/checkin', //TODO:Ask how this is done
  },
});
