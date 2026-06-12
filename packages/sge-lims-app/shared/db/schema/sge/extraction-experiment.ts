import { doublePrecision, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import _ from 'lodash'
import { users } from 'lims-layer/server/db/schema/user'
import { lots } from './lots'

export const extractionExperiments = pgTable('extraction_experiments', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  technician: uuid('technician').references(() => users.id),
  extractedOn: timestamp('extractedOn').defaultNow(),
})

export const extractionLotUsage = pgTable('extraction_lot_usage', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  experimentId: uuid('experiment_id').references(() => extractionExperiments.id).notNull(),
  lotId: uuid('lot_id').references(() => lots.id).notNull(),
  concentration: doublePrecision('concentration'),
  volumeUsed: doublePrecision('volume_used'),
  usageOn: timestamp('usage_on').defaultNow(),
})
