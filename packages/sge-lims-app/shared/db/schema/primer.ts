import { sql } from 'drizzle-orm/sql'
import { pgTable, uuid, varchar, text, check, smallint, uniqueIndex, timestamp, boolean} from 'drizzle-orm/pg-core'
import _ from 'lodash'
import { targets } from './target'
import { type InferSelectModel } from 'drizzle-orm/table'
import { genes } from 'lims-layer/shared/db/schema/gene'

export const linearizationPrimers = pgTable('linearization_primers', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    targetId: uuid('target_id').references(() => targets.id),
    name: varchar('name', { length: 255 }).notNull().unique(),
    sequence: varchar('sequence', { length: 255 }).notNull(),
    sequenceType: varchar('sequence_type', {enum: ['forward', 'reverse']}),
    orderedOn: timestamp('ordered_on'),
    archived: boolean('archived'),
    notes: text('notes'),
}, (table) => [
  check("sequence_check", sql`${table.sequence} ~* '^[actg]+$'`),
  uniqueIndex('unique_lin_primer_target_seq_type_active').on(table.targetId, table.sequenceType).where(sql`archived IS NOT TRUE`),
])

export const amplificationPrimers = pgTable('amplification_primers', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    targetId: uuid('target_id').references(() => targets.id),
    name: varchar('name', { length: 255 }).notNull(),
    sequence: varchar('sequence', { length: 255 }).notNull(),
    sequenceType: varchar('sequence_type', {enum: ['forward', 'reverse']}),
    cloningMethod: varchar('cloning_method', {enum: ['Gibson', 'Golden Gate']}).notNull(),
    temperature: smallint('temperature'),
    orderedOn: timestamp('ordered_on'),
    archived: boolean('archived'),
    notes: text('notes'),
}, (table) => [
  check("sequence_check", sql`${table.sequence} ~* '^[actg]+$'`),
  uniqueIndex('unique_amp_primer_target_seq_type_active').on(table.targetId, table.sequenceType).where(sql`archived IS NOT TRUE`),
])

export const homologyArmPrimers = pgTable('homology_arm_primers', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    sequence: varchar('sequence', { length: 255 }),
    sequenceType: varchar('sequence_type', {enum: ['forward', 'reverse']}),
    cloningStrategy: varchar('cloning_strategy', {enum: ['Gibson', 'Golden Gate']}),
    orderedOn: timestamp('ordered_on'),
    archived: boolean('archived'),
    notes: text('notes'),
}, (table) => [
  check("sequence_check", sql`${table.sequence} ~* '^[actg]*$'`),
])

export const homologyArmPrimerTargets = pgTable('homology_arm_primer_targets', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  homologyArmPrimerId: uuid('homology_arm_primer_id').references(() => homologyArmPrimers.id).notNull(),
  targetId: uuid('target_id').references(() => targets.id).notNull(),
}, (t) => [
  uniqueIndex('unique_ha_primer_target').on(t.homologyArmPrimerId, t.targetId),
])

export const homologyArmPuc19Primers = pgTable('homology_arm_puc19_primers', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    homologyArmPrimerId: uuid('homology_arm_primer_id').references(() => homologyArmPrimers.id).notNull(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    sequence: varchar('sequence', { length: 255 }),
    orderedOn: timestamp('ordered_on'),
    archived: boolean('archived'),
    notes: text('notes'),
}, (table) => [
  check("sequence_check", sql`${table.sequence} ~* '^[actg]*$'`),
  uniqueIndex('unique_ha_puc19_primer_active').on(table.homologyArmPrimerId).where(sql`archived IS NOT TRUE`),
])

export const preseq1Primers = pgTable('preseq_1_primers', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    sequence: varchar('sequence', { length: 255 }),
    sequenceType: varchar('sequence_type', {enum: ['forward', 'reverse']}),
    orderedOn: timestamp('ordered_on'),
    archived: boolean('archived'),
    notes: text('notes'),
}, (table) => [
  check("sequence_check", sql`${table.sequence} ~* '^[actg]*$'`),
])

export const preseq1PrimerTargets = pgTable('preseq_1_primer_targets', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  preseq1PrimerId: uuid('preseq_1_primer_id').references(() => preseq1Primers.id).notNull(),
  targetId: uuid('target_id').references(() => targets.id).notNull(),
}, (t) => [
  uniqueIndex('unique_preseq1_primer_target').on(t.preseq1PrimerId, t.targetId),
])

export const preseq2Primers = pgTable('preseq_2_primers', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    targetId: uuid('target_id').references(() => targets.id),
    name: varchar('name', { length: 255 }).notNull().unique(),
    sequence: varchar('sequence', { length: 255 }),
    sequenceType: varchar('sequence_type', {enum: ['forward', 'reverse']}),
    adapterSequence: varchar('adapter_sequence', { length: 255 }),
    orderedOn: timestamp('ordered_on'),
    archived: boolean('archived'),
    notes: text('notes'),
}, (table) => [
  check("sequence_check", sql`${table.sequence} ~* '^[actg]*$'`),
  check("adapter_sequence_check", sql`${table.adapterSequence} ~* '^[actg]*$'`),
  uniqueIndex('unique_preseq2_primer_target_seq_type_active').on(table.targetId, table.sequenceType).where(sql`archived IS NOT TRUE`),
])

export const rnaPreseq1Primers = pgTable('rna_preseq_1_primers', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    sequence: varchar('sequence', { length: 255 }),
    sequenceType: varchar('sequence_type', {enum: ['forward', 'reverse']}),
    orderedOn: timestamp('ordered_on'),
    archived: boolean('archived'),
    notes: text('notes'),
}, (table) => [
  check("sequence_check", sql`${table.sequence} ~* '^[actg]*$'`),
])

export const rnaPreseq1PrimerTargets = pgTable('rna_preseq_1_primer_targets', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  rnaPreseq1PrimerId: uuid('rna_preseq_1_primer_id').references(() => rnaPreseq1Primers.id).notNull(),
  targetId: uuid('target_id').references(() => targets.id).notNull(),
}, (t) => [
  uniqueIndex('unique_rna_preseq1_primer_target').on(t.rnaPreseq1PrimerId, t.targetId),
])

export const rnaPreseq2Primers = pgTable('rna_preseq_2_primers', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    sequence: varchar('sequence', { length: 255 }),
    sequenceType: varchar('sequence_type', {enum: ['forward', 'reverse']}),
    adapterSequence: varchar('adapter_sequence', { length: 255 }),
    orderedOn: timestamp('ordered_on'),
    archived: boolean('archived'),
    notes: text('notes'),
}, (table) => [
  check("sequence_check", sql`${table.sequence} ~* '^[actg]*$'`),
  check("adapter_sequence_check", sql`${table.adapterSequence} ~* '^[actg]*$'`),
])

export const rnaPreseq2PrimerTargets = pgTable('rna_preseq_2_primer_targets', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  rnaPreseq2PrimerId: uuid('rna_preseq_2_primer_id').references(() => rnaPreseq2Primers.id).notNull(),
  targetId: uuid('target_id').references(() => targets.id).notNull(),
}, (t) => [
  uniqueIndex('unique_rna_preseq2_primer_target').on(t.rnaPreseq2PrimerId, t.targetId),
])

export const rnaRtPrimers = pgTable('rna_rt_primers', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    geneId: uuid('gene_id').references(() => genes.id),
    name: varchar('name', { length: 255 }).notNull().unique(),
    sequence: varchar('sequence', { length: 255 }),
    sequenceType: varchar('sequence_type', {enum: ['forward', 'reverse']}),
    orderedOn: timestamp('ordered_on'),
    archived: boolean('archived'),
    notes: text('notes'),
}, (table) => [
  check("sequence_check", sql`${table.sequence} ~* '^[actg]*$'`),
  uniqueIndex('unique_rna_rt_primer_gene_seq_type_active').on(table.geneId, table.sequenceType).where(sql`archived IS NOT TRUE`),
])

export const indexPrimers = pgTable('index_primers', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    sequence: varchar('sequence', { length: 255 }).notNull(),
    indexSequence: varchar('index_sequence', { length: 255 }).notNull(),
    primerType: varchar('primer_type', {enum: ['P5', 'P7']}),
    kit: varchar('kit', {enum: ['nextera', 'truseq']}),
}, (table) => [
  check("sequence_check", sql`${table.sequence} ~* '^[actg]*$'`),
])

export type AmplificationPrimer = InferSelectModel<typeof amplificationPrimers>
export type LinearizationPrimer = InferSelectModel<typeof linearizationPrimers>
export type HomologyArmPrimer = InferSelectModel<typeof homologyArmPrimers>
export type HomologyArmPuc19Primer = InferSelectModel<typeof homologyArmPuc19Primers>
export type IndexPrimer = InferSelectModel<typeof indexPrimers>
export type preseq1Primer = InferSelectModel<typeof preseq1Primers>
export type preseq2Primer = InferSelectModel<typeof preseq2Primers>
export type RnaPreseq1Primer = InferSelectModel<typeof rnaPreseq1Primers>
export type RnaPreseq2Primer = InferSelectModel<typeof rnaPreseq2Primers>
export type RnaRtPrimer = InferSelectModel<typeof rnaRtPrimers>
