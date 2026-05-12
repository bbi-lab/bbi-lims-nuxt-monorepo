import { check, pgTable, uuid, varchar } from 'drizzle-orm/pg-core'
import { SQL, sql } from 'drizzle-orm/sql'

export const restrictionEnzymes = pgTable('restriction_enzymes', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 10, enum: ['bsa1', 'sap1', 'paqc1'] }).notNull(),
    recogSeqPlusOne: varchar('recog_seq_plusone', { length: 20 }),
    recogSeq: varchar('recog_seq', { length: 20 }).generatedAlwaysAs((): SQL => sql`substring(${restrictionEnzymes.recogSeqPlusOne}, 1, length(${restrictionEnzymes.recogSeqPlusOne}) - 1)`),
    recogSeqRevComp: varchar('recog_seq_rev_comp').generatedAlwaysAs((): SQL => sql`reverse(translate(substring(${restrictionEnzymes.recogSeqPlusOne}, 1, length(${restrictionEnzymes.recogSeqPlusOne}) - 1), 'aAcCgGtT', 'tTgGcCaA'))`),
    recogSeqPlusOneRevComp: varchar('recog_seq_plus_one_rev_comp').generatedAlwaysAs((): SQL => sql`reverse(translate(${restrictionEnzymes.recogSeqPlusOne}, 'aAcCgGtT', 'tTgGcCaA'))`),
}, (t) => [
    check("recog_seq_plusone_check", sql`${t.recogSeqPlusOne} ~* '^[actg]*$'`),
])
