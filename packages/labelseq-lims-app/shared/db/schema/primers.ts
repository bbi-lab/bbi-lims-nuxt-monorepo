import { check, pgEnum, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { SQL, sql } from 'drizzle-orm/sql'

export const primerDirectionEnum = pgEnum('primer_directions', ['forward', 'reverse'])
export const primerTypesEnum = pgEnum('primer_type', ['p5', 'p7'])

export const retrieverPrimers = pgTable('retriever_primers', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    seq: text('seq').notNull(),
    seqRevComp: text('seq_rev_comp').generatedAlwaysAs((): SQL => sql`reverse(translate(${retrieverPrimers.seq}, 'aAcCgGtT', 'tTgGcCaA'))`),
    direction: primerDirectionEnum('direction').notNull(),
}, (t) => [
    check("seq_check", sql`${t.seq} ~* '^[actg]*$'`),
])

export const labelseqIndexPrimers = pgTable('labelseq_index_primers', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    primerType: primerTypesEnum('primer_type').notNull(),
    indexSeq: text('index_seq').notNull(),
    indexSeqRevComp: text('index_seq_rev_comp').generatedAlwaysAs((): SQL => sql`reverse(translate(${labelseqIndexPrimers.indexSeq}, 'aAcCgGtT', 'tTgGcCaA'))`),
}, (t) => [
    check("index_seq_check", sql`${t.indexSeq} ~* '^[actg]*$'`),
])

export const nexteraIndexPrimers = pgTable('nextera_index_primers', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    primerType: primerTypesEnum('primer_type').notNull(),
    indexSeq: text('index_seq').notNull(),
    indexSeqRevComp: text('index_seq_rev_comp').generatedAlwaysAs((): SQL => sql`reverse(translate(${nexteraIndexPrimers.indexSeq}, 'aAcCgGtT', 'tTgGcCaA'))`),
}, (t) => [
    check("index_seq_check", sql`${t.indexSeq} ~* '^[actg]*$'`),
])
