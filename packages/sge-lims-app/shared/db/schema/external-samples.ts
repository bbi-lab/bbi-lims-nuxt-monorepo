import { check, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { type InferSelectModel } from 'drizzle-orm/table'
import { users } from "lims-layer/server/db/schema/user"
import { indexPrimers } from "./primer"
import { sql } from "drizzle-orm/sql"

export const externalSamples = pgTable('external_samples', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name').notNull().unique(),
  description: text('description'),
  customIndexSeq1: varchar('custom_index_seq_1', { length: 50 }),
  customIndexSeq2: varchar('custom_index_seq_2', { length: 50 }),
  indexPrimer1Id: uuid('index_primer_1_id').references(() => indexPrimers.id),
  indexPrimer2Id: uuid('index_primer_2_id').references(() => indexPrimers.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (t) => [
  // Either custom index sequences are provided (no primer IDs), or internal primer IDs are provided (no custom seqs)
  check('external_sample_index_check', sql`
    (COALESCE(TRIM(${t.customIndexSeq1}), '') <> '' AND ${t.indexPrimer1Id} IS NULL AND ${t.indexPrimer2Id} IS NULL)
    OR
    (${t.indexPrimer1Id} IS NOT NULL AND COALESCE(TRIM(${t.customIndexSeq1}), '') = '' AND COALESCE(TRIM(${t.customIndexSeq2}), '') = '')
  `),
])

export type ExternalSample = InferSelectModel<typeof externalSamples>
