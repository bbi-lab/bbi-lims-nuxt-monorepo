
import { pgTable, uuid, varchar, text, integer, boolean, check } from 'drizzle-orm/pg-core'
import { projects } from './project'
import { retrieverPrimers } from './primers'
import { sql } from 'drizzle-orm/sql'

export const superblocks = pgTable('superblocks', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    projectId: uuid('project_id').notNull().references(() => projects.id),
    name: varchar('name', { length: 50 }).notNull(),
    description: varchar('description', { length: 255 }),
    seq: text('seq'),
}, (t) => [
    check("seq_check", sql`${t.seq} ~* '^[actg]*$'`),
])

export const tiles = pgTable('tiles', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    superblockId: uuid('superblock_id').notNull().references(() => superblocks.id),
    tileName: varchar('tile_name', { length: 50 }).notNull(),
    tileStart: integer('tile_start').notNull(),
    tileEnd: integer('tile_end').notNull(),
    mutagenesisStart: integer('mutagenesis_start'),
    mutagenesisEnd: integer('mutagenesis_end'),
    retrieverPrimerForwardId: uuid('retriever_primer_forward_id').references(() => retrieverPrimers.id),
    retrieverPrimerReverseId: uuid('retriever_primer_reverse_id').references(() => retrieverPrimers.id),
    superblockFirst: boolean('superblock_first').notNull().default(false),
    superblockLast: boolean('last').notNull().default(false),
})
