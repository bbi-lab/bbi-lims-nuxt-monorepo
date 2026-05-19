import { drizzle } from 'drizzle-orm/node-postgres'

// Reuse the lims-layer pool — avoids a second connection pool to the same DB.
import { pool, schema as baseSchema } from '../../../lims-layer/server/utils/db'

// labelseq-lims-app tables
import { projects } from '../../shared/db/schema/project'
import { superblocks, tiles, tileVariants } from '../../shared/db/schema/tiles'
import { retrieverPrimers } from '../../shared/db/schema/primers'
import { restrictionEnzymes } from '../../shared/db/schema/reagents'
import { viewTilesWithSequences } from '../../shared/db/schema/views'
import { plateTypes } from 'lims-layer/shared/db/schema/plateTypes'
import { refseqTranscripts } from '../../shared/db/schema/transcripts'

import { relations } from '../db/relations/relations'

// Combined schema: lims-layer tables/views + labelseq tables.
// Used by generic API routes to resolve both db.query (tables) and schema (views) lookups.
export const appSchema = {
  ...baseSchema,
  projects,
  superblocks,
  tiles,
  tileVariants,
  retrieverPrimers,
  restrictionEnzymes,
  viewTilesWithSequences,
  plateTypes,
  refseqTranscripts,
}

// Named `appDb` / `useAppDrizzle` to avoid auto-import collision with
// the base `db` / `useDrizzle` exported by lims-layer. Nuxt merges all
// server/utils exports and deduplicates by name — the layer version wins,
// so app-specific routes use `useAppDrizzle()`. Any server route that
// queries labelseq tables must call `useAppDrizzle()` instead of `useDrizzle()`.
export const appDb = drizzle({ client: pool, relations })

export function useAppDrizzle() {
  return appDb
}
