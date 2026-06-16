import { defineConfig } from 'drizzle-kit'
import process from 'node:process'

export default defineConfig({
  schema: [
    './shared/db/schema/*',
    '../lims-layer/server/db/schema/*',
    // The lims-layer's shared schema files are listed explicitly (instead of a glob)
    // to omit its views.ts: the layer and sge both define a view named
    // "view_plates_with_well_counts", and sge needs its own richer version
    // (cycle/target/experiment columns). Loading both is a fatal duplicate-view
    // collision in drizzle-kit. NOTE: add new lims-layer/shared/db/schema files here.
    '../lims-layer/shared/db/schema/gene.ts',
    '../lims-layer/shared/db/schema/plate.ts',
    '../lims-layer/shared/db/schema/plateTypes.ts',
    '../lims-layer/shared/db/schema/well.ts',
  ],
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
