import { check, pgEnum, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { SQL, sql } from 'drizzle-orm/sql'

export const primerDirectionEnum = pgEnum('primer_directions', ['forward', 'reverse'])

export const retrieverPrimers = pgTable('retriever_primers', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    seq: text('seq').notNull(),
    seqRevComp: text('seq_rev_comp').generatedAlwaysAs((): SQL => sql`reverse(translate(${retrieverPrimers.seq}, 'aAcCgGtT', 'tTgGcCaA'))`),
    direction: primerDirectionEnum('direction').notNull(),
}, (t) => [
    check("seq_check", sql`${t.seq} ~* '^[actg]*$'`),
])
