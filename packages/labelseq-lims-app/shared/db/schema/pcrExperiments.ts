import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { plates } from 'lims-layer/shared/db/schema/plate'

export const PCR_TYPES = [
    'tile-oligo-pcr-1',
    'tile-oligo-pcr-2',
    'plasmid-barcode-pcr-1',
    'plasmid-barcode-pcr-2',
    'rt-pcr',
    'post-rt-pcr-1',
    'post-rt-pcr-2',
] as const

export const pcrExperiments = pgTable('pcr_experiments', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    startedOn: timestamp('started_on').defaultNow(),
    pcrType: text('pcr_type', { enum: PCR_TYPES }).notNull(),
    // Set by POST /api/pcr-experiments, which creates the experiment's plate.
    plateId: uuid('plate_id').references(() => plates.id),
})
