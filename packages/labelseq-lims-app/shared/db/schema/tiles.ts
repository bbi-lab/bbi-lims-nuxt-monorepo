
import { pgTable, uuid, varchar, text, integer, boolean, check, char, pgEnum } from 'drizzle-orm/pg-core'
import { projects } from './project'
import { retrieverPrimers } from './primers'
import { sql } from 'drizzle-orm/sql'
import { refseqTranscripts } from './transcripts'

export const superblockClassificationEnum = pgEnum('superblock_classification', [
    'n-terminus', 'c-terminus', 'internal', 'complete'
])

export const superblocks = pgTable('superblocks', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    projectId: uuid('project_id').notNull().references(() => projects.id),
    refseqTranscriptId: uuid('refseq_transcript_id').references(() => refseqTranscripts.id),
    name: varchar('name', { length: 50 }).notNull().unique(),
    classification: superblockClassificationEnum('classification'),
    description: varchar('description', { length: 255 }),
    start: integer('start'),
    end: integer('end'),
    seq: text('seq'),
}, (t) => [
    check('seq_check', sql`${t.seq} ~* '^[actg]*$'`),
])

export const tiles = pgTable('tiles', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    superblockId: uuid('superblock_id').notNull().references(() => superblocks.id),
    tileName: varchar('tile_name', { length: 50 }).notNull().unique(),
    tileStart: integer('tile_start').notNull(),
    tileEnd: integer('tile_end').notNull(),
    mutagenesisStart: integer('mutagenesis_start'),
    mutagenesisEnd: integer('mutagenesis_end'),
    retrieverPrimerForwardId: uuid('retriever_primer_forward_id').references(() => retrieverPrimers.id),
    retrieverPrimerReverseId: uuid('retriever_primer_reverse_id').references(() => retrieverPrimers.id),
    superblockFirst: boolean('superblock_first').default(false),
    superblockLast: boolean('superblock_last').default(false),
})

// All 20 amino acids plus 'X' for stop codon
export const aminoAcidsEnum = pgEnum('amino_acid', [
    'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y', 'X'
]);

// all 64 DNA codons
export const dnaCodonsEnum = pgEnum('dna_codon', [
    'AAA', 'AAC', 'AAG', 'AAT', 'ACA', 'ACC', 'ACG', 'ACT', 'AGA', 'AGC', 'AGG', 'AGT', 'ATA', 'ATC', 'ATG', 'ATT', 'CAA', 'CAC', 'CAG', 'CAT', 'CCA', 'CCC', 'CCG', 'CCT', 'CGA', 'CGC', 'CGG', 'CGT', 'CTA', 'CTC', 'CTG', 'CTT', 'GAA', 'GAC', 'GAG', 'GAT', 'GCA', 'GCC', 'GCG', 'GCT', 'GGA', 'GGC', 'GGG', 'GGT', 'GTA', 'GTC', 'GTG', 'GTT', 'TAA', 'TAC', 'TAG', 'TAT', 'TCA', 'TCC', 'TCG', 'TCT', 'TGA', 'TGC', 'TGG', 'TGT', 'TTA', 'TTC', 'TTG', 'TTT'
])

export const tileVariants = pgTable('tile_variants', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    tileId: uuid('tile_id').notNull().references(() => tiles.id),
    aaPosition: integer('aa_position').notNull(),
    aaRef: aminoAcidsEnum('aa_ref').notNull(),
    aaAlt: aminoAcidsEnum('aa_alt'),
    ntPosition: integer('nt_position').notNull(),
    ntRef: dnaCodonsEnum('nt_ref').notNull(),
    ntAlt: dnaCodonsEnum('nt_alt'),
})
