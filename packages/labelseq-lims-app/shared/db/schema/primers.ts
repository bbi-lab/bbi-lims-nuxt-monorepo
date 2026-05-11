import { check, pgEnum, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm/sql'

export const primerDirectionEnum = pgEnum('primer_directions', ['forward', 'reverse'])

export const retrieverPrimers = pgTable('retriever_primers', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    seq: text('seq').notNull(),
    seq_revcomp: text('seq_revcomp').notNull(),
    direction: primerDirectionEnum('direction').notNull(),
}, (t) => [
    check("seq_check", sql`${t.seq} ~* '^[actg]*$'`),
    check("seq_revcomp_check", sql`${t.seq_revcomp} ~* '^[actg]*$'`),
])
