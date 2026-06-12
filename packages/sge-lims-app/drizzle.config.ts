import { defineConfig } from 'drizzle-kit'
import process from 'node:process'

export default defineConfig({
  schema: ['./shared/db/schema/**/*'],
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.NUXT_DB_HOST || 'localhost',
    port: Number(process.env.NUXT_DB_PORT || '5432'),
    user: process.env.NUXT_DB_USERNAME || 'postgres',
    password: process.env.NUXT_DB_PASSWORD || 'postgres',
    database: process.env.NUXT_DB_DATABASE_NAME || '',
    ssl: process.env.NUXT_DB_SSL === 'true' ? 'require' : false,
  }
})
