import { pgTable, uuid, varchar, text, doublePrecision } from 'drizzle-orm/pg-core'
import { extractionExperiments } from './extraction-experiment'
import { pellets } from './pellet'
import { type InferSelectModel } from 'drizzle-orm/table'

export const RNA_PROTOCOLS = ['AllPrep', 'RNeasy']

export const rna = pgTable('rna', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  extractionExperimentId: uuid('extraction_experiment_id').references(() => extractionExperiments.id),
  pelletId: uuid('pellet_id').references(() => pellets.id).unique(),
  concentration: doublePrecision('concentration'),
  volume: doublePrecision('volume'),
  protocol: varchar('protocol', {enum: RNA_PROTOCOLS as [string, ...string[]]}),
  notes: text('notes'),
})

export type Rna = InferSelectModel<typeof rna>

export const DNA_PROTOCOLS = ['AllPrep', 'DNeasy']

export const dna = pgTable('dna', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  extractionExperimentId: uuid('extraction_experiment_id').references(() => extractionExperiments.id),
  pelletId: uuid('pellet_id').references(() => pellets.id).unique(),
  concentration: doublePrecision('concentration'),
  volume: doublePrecision('volume'),
  protocol: varchar('protocol', {enum: DNA_PROTOCOLS as [string, ...string[]]}),
  notes: text('notes'),
})

export type Dna = InferSelectModel<typeof dna>
