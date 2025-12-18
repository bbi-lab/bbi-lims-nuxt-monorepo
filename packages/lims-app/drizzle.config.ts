import { defineConfig } from 'drizzle-kit'
import process from 'node:process'

export default defineConfig({
  schema: [
    './server/db/schema/*',
    '../lims-layer/server/db/schema/*'
  ],
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.NUXT_DB_HOST || 'localhost',
    port: Number(process.env.NUXT_DB_PORT || '5432'),
    user: process.env.NUXT_DB_USER || 'postgres',
    password: process.env.NUXT_DB_PASSWORD || 'postgres',
    database: process.env.NUXT_DB_DATABASE_NAME || '',
    ssl: 'require'
  }
})
