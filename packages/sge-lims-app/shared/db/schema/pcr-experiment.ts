import { sql } from 'drizzle-orm/sql'
import { pgTable, timestamp, uuid, varchar, text, check, doublePrecision } from 'drizzle-orm/pg-core'
import _ from 'lodash'
import { users } from 'lims-layer/server/db/schema/user'
import { plates } from 'lims-layer/shared/db/schema/plate'
import { pcrTypes } from './pcrTypes'
import { transfectTargets } from './transfect-experiment'
import { recordStatusEnum } from './status'

export const pcrExperiments = pgTable('pcr_experiments', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  pcrType: varchar('pcr_type', { length: 100 }).notNull().references(() => pcrTypes.value),
  technicianId: uuid('technician_id').references(() => users.id),
  startedOn: timestamp('started_on').defaultNow(),
  plateId: uuid('plate_id').references(() => plates.id),
  gelImagesLink: text('gel_images_link'),
  status: recordStatusEnum('status'),
  notes: text('notes'),
}, (table) => [
  check("gel_images_link_check", sql`${table.gelImagesLink} ~* '^https?://.+$'`),
])

export const pcrExperimentTargets = pgTable('pcr_experiment_targets', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  pcrExperimentId: uuid('pcr_experiment_id').references(() => pcrExperiments.id).notNull(),
  transfectTargetId: uuid('transfect_target_id').references(() => transfectTargets.id).notNull(),
})

export const pcr1ExperimentMasterMixVolumes = pgTable('pcr1_experiment_master_mix_volumes', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  pcrExperimentId: uuid('pcr_experiment_id').references(() => pcrExperiments.id).notNull().unique(),
  twoXKapaHifiReadyMix: doublePrecision('two_x_kapa_hifi_ready_mix').default(12.5).notNull(),
  tenUmForwardPrimer: doublePrecision('ten_um_forward_primer').default(0.75).notNull(),
  tenUmReversePrimer: doublePrecision('ten_um_reverse_primer').default(0.75).notNull(),
  tenXSybrGreen: doublePrecision('ten_x_sybr_green').default(0).notNull(),
  dnaAmount: doublePrecision('dna_amount').default(250).notNull(),
  total: doublePrecision('total').default(25).notNull(),
})

export const pcr2ExperimentMasterMixVolumes = pgTable('pcr2_experiment_master_mix_volumes', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  pcrExperimentId: uuid('pcr_experiment_id').references(() => pcrExperiments.id).notNull().unique(),
  twoXKapaHifiReadyMix: doublePrecision('two_x_kapa_hifi_ready_mix').default(12.5).notNull(),
  tenUmForwardPrimer: doublePrecision('ten_um_forward_primer').default(0.75).notNull(),
  tenUmReversePrimer: doublePrecision('ten_um_reverse_primer').default(0.75).notNull(),
  tenXSybrGreen: doublePrecision('ten_x_sybr_green').default(0).notNull(),
  total: doublePrecision('total').default(25).notNull(),
})
