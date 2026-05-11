import { check, pgTable, uuid, varchar } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm/sql'

export const restrictionEnzymes = pgTable('restriction_enzymes', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 10, enum: ['bsa1', 'sap1', 'paqc1'] }).notNull(),
    seq: varchar('recognition_site', { length: 20 }).notNull(),
    seq_revcomp: varchar('recognition_site_revcomp', { length: 20 }).notNull(),
    seq_plusone: varchar('seq_plusone', { length: 20 }),
    seq_plusone_revcomp: varchar('seq_plusone_revcomp', { length: 20 }),
}, (t) => [
    check("seq_check", sql`${t.seq} ~* '^[actg]*$'`),
    check("seq_revcomp_check", sql`${t.seq_revcomp} ~* '^[actg]*$'`),
    check("seq_plusone_check", sql`${t.seq_plusone} ~* '^[actg]*$'`),
    check("seq_plusone_revcomp_check", sql`${t.seq_plusone_revcomp} ~* '^[actg]*$'`),
])
