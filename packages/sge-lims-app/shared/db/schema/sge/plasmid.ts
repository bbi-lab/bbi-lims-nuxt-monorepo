import { pgTable, uuid, varchar, text, doublePrecision, check, timestamp, boolean } from 'drizzle-orm/pg-core'
import { type InferSelectModel } from 'drizzle-orm/table'
import { snvLibCloningExperiments } from './plasmid-experiment'
import { targets } from './target'
import { sql } from 'drizzle-orm/sql'
import { haPuc19GibsonProducts } from './oligos'
import { users } from 'lims-layer/server/db/schema/user'

export const sgRnaPlasmids = pgTable('sg_rna_plasmids', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  volume: doublePrecision('volume'),
  quant: doublePrecision('quant'),
  // targetId: uuid('target_id').references(() => targets.id).notNull(),
  // sgRnaCloningExperimentId: uuid('sg_rna_cloning_experiment_id').references(() => sgRnaCloningExperiments.id),
  verificationStatus: varchar('verification_status', {enum: ['passed', 'failed']}),
  externalLink: text('external_link'),
  notes: text('notes'),
}, (table) => [
  check("external_link_check", sql`${table.externalLink} ~* '^https?://.+$'`),
])

export const sgRnaPlasmidTargets = pgTable('sg_rna_plasmid_targets', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  sgRnaPlasmidId: uuid('sg_rna_plasmid_id').references(() => sgRnaPlasmids.id).notNull(),
  targetId: uuid('target_id').references(() => targets.id).notNull(),
})

export const snvLibPlasmids = pgTable('snv_lib_plasmids', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  volume: doublePrecision('volume'),
  quant: doublePrecision('quant'),
  targetId: uuid('target_id').references(() => targets.id).notNull(),
  snvLibCloningExperimentId: uuid('snv_lib_cloning_experiment_id').references(() => snvLibCloningExperiments.id).unique(),
  plasmidsaurusVerification: boolean('plasmidsaurus_verification').default(false),
  ngsVerificationStatus: varchar('ngs_verification_status', {enum: ['passed', 'failed']}),
  externalLink: text('external_link'),
  notes: text('notes'),
}, (table) => [
  check("external_link_check", sql`${table.externalLink} ~* '^https?://.+$'`),
])

export const haPuc19Plasmids = pgTable('ha_puc19_plasmids', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  haPuc19GibsonProductId: uuid('ha_puc19_gibson_product_id').references(() => haPuc19GibsonProducts.id).notNull().unique(),
  eColiStellarVolume: doublePrecision('e_coli_stellar_volume').default(20),
  transformedOn: timestamp('transformed_on'),
  transformedBy: uuid('transformed_by').references(() => users.id),
  colonyPickedOn: timestamp('colony_picked_on'),
  colonyPickedBy: uuid('colony_picked_by').references(() => users.id),
  preppedOn: timestamp('prepped_on'),
  preppedBy: uuid('prepped_by').references(() => users.id),
  notes: text('notes'),
})

export type SgRnaPlasmid = InferSelectModel<typeof sgRnaPlasmids>
export type SnvLibPlasmid = InferSelectModel<typeof snvLibPlasmids>
export type HaPuc19Plasmid = InferSelectModel<typeof haPuc19Plasmids>
