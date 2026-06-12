import { pgTable, timestamp, unique, uuid, varchar, text } from 'drizzle-orm/pg-core'
import { users } from 'lims-layer/server/db/schema/user'
import { targets } from './target'
import { plates } from './plate'
import { clonalHas } from './oligos'

export const sgRnaCloningExperiments = pgTable('sg_rna_cloning_experiments', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  technician: uuid('technician').references(() => users.id),
  transformedOn: timestamp('transformed_on'),
  plateId: uuid('plate_id').references(() => plates.id),
  notes: text('notes'),
})

export const snvLibCloningExperiments = pgTable('snv_lib_cloning_experiments', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  cloningStrategy: varchar('cloning_strategy', {enum: ['Gibson', 'Golden Gate']}).notNull(),
  targetId: uuid('target_id').references(() => targets.id).notNull(),
  clonalHaId: uuid('clonal_ha_id').references(() => clonalHas.id),
  startedOn: timestamp('started_on').defaultNow(),
  endedOn: timestamp('ended_on'),
  notes: text('notes'),
})

export const haCloningExperiments = pgTable('ha_cloning_experiments', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  startedOn: timestamp('started_on').defaultNow(),
  endedOn: timestamp('ended_on'),
  notes: text('notes'),
})

export const haCloningExperimentTargets = pgTable('ha_cloning_experiment_targets', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  haCloningExperimentId: uuid('ha_cloning_experiment_id').references(() => haCloningExperiments.id).notNull(),
  targetId: uuid('target_id').references(() => targets.id).notNull(),
}, (t) => [
  unique('unique_ha_cloning_experiment_target').on(t.haCloningExperimentId, t.targetId),
])
