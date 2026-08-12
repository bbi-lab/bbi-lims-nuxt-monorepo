import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core'
import _ from 'lodash'
import {projects} from './project'
import {regions} from './region'

export const targets = pgTable('targets', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  projectId: uuid('project_id').references(() => projects.id),
  regionId: uuid('region_id').references(() => regions.id).notNull(),
  editStart: integer('edit_start'),
  editStop: integer('edit_stop'),
  ampStart: integer('amp_start'),
  ampStop: integer('amp_stop'),
  cigar: varchar('cigar', {length: 50}),
  skipPositions: integer('skip_positions').array(),
  fixedEdits: varchar('fixed_edits', { length: 255 }).array(),
})
