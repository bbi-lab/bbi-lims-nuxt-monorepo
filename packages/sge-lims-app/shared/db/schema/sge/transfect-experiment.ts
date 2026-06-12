import { pgTable, timestamp, uuid, integer, varchar, text, doublePrecision, unique, boolean } from 'drizzle-orm/pg-core'
import { users } from 'lims-layer/server/db/schema/user'
import { targets } from './target'
import { lots } from './lots'
import { cycles } from './cycle'
import { sgRnaPlasmids, snvLibPlasmids } from './plasmid'

export const transfectExperiments = pgTable('transfect_experiments', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  cycleId: uuid('cycle_id').references(() => cycles.id).unique().notNull(),
  technician: uuid('technician').references(() => users.id),
  startedOn: timestamp('started_on').notNull().defaultNow(),
  transfectionCount: integer('transfection_count'),
  replicateCount: integer('replicates_count').notNull(),
  // negativeControl: boolean('negative_control'),
})

export const transfectTargets = pgTable('transfect_targets', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  experimentId: uuid('experiment_id').references(() => transfectExperiments.id).notNull(),
  targetId: uuid('target_id').references(() => targets.id).notNull(),
  snvLibraryConc: doublePrecision('snv_library_conc'),
  snvLibraryQuantity: doublePrecision('snv_library_quantity').default(5),
  snvLibPlasmidId: uuid('snv_lib_plasmid_id').references(() => snvLibPlasmids.id),
  sgRnaConc: doublePrecision('sg_rna_conc'),
  sgRnaQuantity: doublePrecision('sg_rna_quantity').default(10),
  sgRnaPlasmidId: uuid('sg_rna_plasmid_id').references(() => sgRnaPlasmids.id),
  sgRnaNegControl: varchar('sg_rna_neg_control', { length: 255 }),
  hprt1SgRnaConc: doublePrecision('hprt1_sg_rna_conc'),
  xfectBuffer: doublePrecision('xfect_buffer'),
  xfectPolymerPerTransfect: doublePrecision('xfect_polymer_per_transfect'),
  transfectionCount: integer('transfection_count').notNull(),
  negativeControl: boolean('negative_control'),
  notes: text('notes'),
}, (t) => [
  unique('unique_transfect_experiment_target_count').on(t.experimentId, t.targetId, t.transfectionCount),
])

export const transfectLotUsage = pgTable('transfect_lot_usage', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  experimentId: uuid('experiment_id').references(() => transfectExperiments.id).notNull(),
  lotId: uuid('lot_id').references(() => lots.id).notNull(),
  concentration: doublePrecision('concentration'),
  volumeUsed: doublePrecision('volume_used'),
  usageOn: timestamp('usage_on').defaultNow(),
})
