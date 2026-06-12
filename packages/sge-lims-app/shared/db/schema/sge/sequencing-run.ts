import { pgTable, timestamp, uuid, varchar, uniqueIndex, doublePrecision, text, check } from "drizzle-orm/pg-core"
import { wells } from "./well"
import { dna, rna } from "./nucleic-acid"
import { indexPrimers } from "./primer"
import { sql } from "drizzle-orm/sql"
import { externalSamples } from "./external-samples"

export const sequencingRuns = pgTable('sequencing_runs', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  status: varchar('status', { enum: ['pending', 'running', 'completed', 'canceled', 'failed'] }).default('pending'),
  createdOn: timestamp('created_on'),
  startedOn: timestamp('started_on'),
  endedOn: timestamp('ended_on'),
})

export const sequencingRunSamples = pgTable('sequencing_run_samples', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  projectName: varchar('project_name', { length: 255 }),
  sequencingRunId: uuid('sequencing_run_id').references(() => sequencingRuns.id).notNull(),
  dnaId: uuid('dna_id').references(() => dna.id),
  rnaId: uuid('rna_id').references(() => rna.id),
  indexPrimer1Id: uuid('index_primer_1_id').references(() => indexPrimers.id).notNull(),
  indexPrimer2Id: uuid('index_primer_2_id').references(() => indexPrimers.id).notNull(),
  sourceWellId: uuid('source_well_id').references(() => wells.id),
  millionReadsRequired: doublePrecision('million_reads_required').default(5),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  uniqueIndex('unique_index_primers_per_sequencing_run').on(t.sequencingRunId, sql`least(${t.indexPrimer1Id}, ${t.indexPrimer2Id})`, sql`greatest(${t.indexPrimer1Id}, ${t.indexPrimer2Id})`),
  check("internal_sample_primer_check", sql`${t.indexPrimer1Id} IS NOT NULL AND ${t.indexPrimer2Id} IS NOT NULL`),
  check("dna_or_rna_check", sql`(${t.dnaId} IS NOT NULL AND ${t.rnaId} IS NULL) OR (${t.rnaId} IS NOT NULL AND ${t.dnaId} IS NULL)`)
])

export const sequencingRunExternalSamples = pgTable('sequencing_run_external_samples', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  projectName: varchar('project_name', { length: 255 }),
  sequencingRunId: uuid('sequencing_run_id').references(() => sequencingRuns.id).notNull(),
  externalSampleId: uuid('external_sample_id').references(() => externalSamples.id).notNull(),
  indexPrimer1Id: uuid('index_primer_1_id').references(() => indexPrimers.id),
  indexPrimer2Id: uuid('index_primer_2_id').references(() => indexPrimers.id),
  customIndexSeq1: varchar('custom_index_seq_1', { length: 50 }),
  customIndexSeq2: varchar('custom_index_seq_2', { length: 50 }),
  sourceWellId: uuid('source_well_id').references(() => wells.id),
  millionReadsRequired: doublePrecision('million_reads_required').default(5),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  uniqueIndex('unique_custom_index_seqs_per_sequencing_run').on(t.sequencingRunId, sql`least(${t.customIndexSeq1}, ${t.customIndexSeq2})`, sql`greatest(${t.customIndexSeq1}, ${t.customIndexSeq2})`),
  uniqueIndex('unique_index_primers_per_ext_sequencing_run').on(t.sequencingRunId, sql`least(${t.indexPrimer1Id}, ${t.indexPrimer2Id})`, sql`greatest(${t.indexPrimer1Id}, ${t.indexPrimer2Id})`).where(sql`${t.indexPrimer1Id} IS NOT NULL`),
  // check that either two internal index primers are present, or at least one custom index sequences is present, but not both types
  check("external_sample_primer_check", sql`
    ((COALESCE(TRIM(${t.customIndexSeq1}), '') <> '' OR COALESCE(TRIM(${t.customIndexSeq2}), '') <> '') AND ${t.indexPrimer1Id} IS NULL AND ${t.indexPrimer2Id} IS NULL) OR
    (${t.indexPrimer1Id} IS NOT NULL AND ${t.indexPrimer2Id} IS NOT NULL)`)
  ])
