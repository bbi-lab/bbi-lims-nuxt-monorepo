import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { plates } from 'lims-layer/shared/db/schema/plate'

export const PCR_TYPES = ['pcr-1', 'pcr-2', 'pcr-rt'] as const

export const pcrExperiments = pgTable('pcr_experiments', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    startedOn: timestamp('started_on').defaultNow(),
    pcrType: text('pcr_type', { enum: PCR_TYPES }).notNull(),
    // Set by POST /api/pcr-experiments, which creates the experiment's plate.
    plateId: uuid('plate_id').references(() => plates.id),
})
