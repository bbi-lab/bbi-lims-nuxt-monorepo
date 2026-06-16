import { pgTable, timestamp, uuid, boolean, varchar, text, integer, doublePrecision } from 'drizzle-orm/pg-core'
import { users } from 'lims-layer/server/db/schema/user'
import { transfectTargets } from './transfect-experiment'
import { extractionExperiments } from './extraction-experiment'
import { type InferSelectModel } from 'drizzle-orm/table'

export const pellets = pgTable('pellets', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).unique(),
  transfectTargetId: uuid('transfect_target_id').references(() => transfectTargets.id).notNull(),
  transfections: varchar('transfections', { length: 3 }).array(),
  harvestedOn: timestamp('harvested_on').notNull(),
  harvestDay: integer('harvest_day').notNull(),
  harvestedById: uuid('harvested_by_id').references(() => users.id),
  isCurrent: boolean('is_current'),
  isBackup: boolean('is_backup'),
  d3Confluency: doublePrecision('d3_confluency'),
  pctPassaged: doublePrecision('pct_passaged'),
  pctHarvested: doublePrecision('pct_harvested'),
  notes: text('notes'),
})

export type Pellet = InferSelectModel<typeof pellets>
