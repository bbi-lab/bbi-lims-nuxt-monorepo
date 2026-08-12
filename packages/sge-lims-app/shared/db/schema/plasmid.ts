import { pgTable, uuid, varchar, text, doublePrecision, check, timestamp } from 'drizzle-orm/pg-core'
import { type InferSelectModel } from 'drizzle-orm/table'
import { snvLibCloningExperiments } from './plasmid-experiment'
import { targets } from './target'
import { sql } from 'drizzle-orm/sql'
import { haPuc19GibsonProducts } from './oligos'
import { users } from 'lims-layer/server/db/schema/user'
import { recordStatusEnum } from './status'

export const sgRnaPlasmids = pgTable('sg_rna_plasmids', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  volume: doublePrecision('volume'),
  quant: doublePrecision('quant'),
  // targetId: uuid('target_id').references(() => targets.id).notNull(),
  // sgRnaCloningExperimentId: uuid('sg_rna_cloning_experiment_id').references(() => sgRnaCloningExperiments.id),
  clonedOn: timestamp('cloned_on'),
  genewizOrderNumber: varchar('genewiz_order_number', { length: 255 }),
  benchlingLink: text('benchling_link'),
  status: recordStatusEnum('status'),
  notes: text('notes'),
}, (table) => [
  check("benchling_link_check", sql`${table.benchlingLink} ~* '^https?://.+$'`),
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
  plasmidsaurusOrderId: varchar('plasmidsaurus_order_id', { length: 255 }),
  clonedOn: timestamp('cloned_on'),
  bacterialPlateImagesLink: text('bacterial_plate_images_link'),
  benchlingLink: text('benchling_link'),
  ngsVerificationStatus: varchar('ngs_verification_status', {enum: ['passed', 'failed']}),
  status: recordStatusEnum('status'),
  notes: text('notes'),
}, (table) => [
  check("benchling_link_check", sql`${table.benchlingLink} ~* '^https?://.+$'`),
  check("bacterial_plate_images_link_check", sql`${table.bacterialPlateImagesLink} ~* '^https?://.+$'`),
])

export const haPuc19Plasmids = pgTable('ha_puc19_plasmids', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  haPuc19GibsonProductId: uuid('ha_puc19_gibson_product_id').references(() => haPuc19GibsonProducts.id).notNull().unique(),
  eColiStellarVolume: doublePrecision('e_coli_stellar_volume').default(20),
  transformedOn: timestamp('transformed_on'),
  transformedById: uuid('transformed_by_id').references(() => users.id),
  colonyPickedOn: timestamp('colony_picked_on'),
  colonyPickedById: uuid('colony_picked_by_id').references(() => users.id),
  preppedOn: timestamp('prepped_on'),
  preppedById: uuid('prepped_by_id').references(() => users.id),
  notes: text('notes'),
})

export type SgRnaPlasmid = InferSelectModel<typeof sgRnaPlasmids>
export type SnvLibPlasmid = InferSelectModel<typeof snvLibPlasmids>
export type HaPuc19Plasmid = InferSelectModel<typeof haPuc19Plasmids>
