import { pgTable, pgEnum, uuid, varchar, integer, unique, index } from 'drizzle-orm/pg-core'
import _ from 'lodash'

export const geneOrientationEnum = pgEnum('gene_orientations', ['plus', 'minus'])

export const genes = pgTable('genes', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  ncbiAccession: varchar('ncbi_accession', { length: 50 }).notNull(),
  startPosition: integer('start_position'),
  endPosition: integer('end_position'),
  chromosome: varchar('chromosome', { length: 10 }),
  orientation: geneOrientationEnum('orientation'),
  name: varchar('name', { length: 255 }).notNull(),
  symbol: varchar('symbol', { length: 50 }).notNull(),
  ncbiGeneId: integer('ncbi_gene_id'),
  geneType: varchar('gene_type', { length: 50 }),
  transcriptsAccession: varchar('transcripts_accession', { length: 50 }),
  proteinAcccession: varchar('protein_acccession', { length: 50 }),
  proteinLength: integer('protein_length'),
  locusTag: varchar('locus_tag', { length: 50 }),
  assembly: varchar('assembly', {length: 50}),
  annotation: varchar('annotation', {length: 50}),
}, (table) => [
  index('ncbi_accession_idx').on(table.ncbiAccession),
  index('symbol_idx').on(table.symbol),
  index('gene_type_idx').on(table.geneType),
])
