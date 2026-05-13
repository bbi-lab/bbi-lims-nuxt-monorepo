import { check, pgTable, integer, uuid, varchar } from 'drizzle-orm/pg-core'
import { SQL, sql } from 'drizzle-orm/sql'

export const restrictionEnzymes = pgTable('restriction_enzymes', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 10 }).notNull().unique(),
    recogSeqPlusOverhang: varchar('recog_seq_plus_overhang', { length: 20 }),
    overhangLength: integer('overhang_length').notNull(),
    recogSeq: varchar('recog_seq', { length: 20 }).generatedAlwaysAs((): SQL => sql`substring(${restrictionEnzymes.recogSeqPlusOverhang}, 1, length(${restrictionEnzymes.recogSeqPlusOverhang}) - ${restrictionEnzymes.overhangLength})`),
    recogSeqRevComp: varchar('recog_seq_rev_comp').generatedAlwaysAs((): SQL => sql`reverse(translate(substring(${restrictionEnzymes.recogSeqPlusOverhang}, 1, length(${restrictionEnzymes.recogSeqPlusOverhang}) - ${restrictionEnzymes.overhangLength}), 'aAcCgGtT', 'tTgGcCaA'))`),
    recogSeqPlusOverhangRevComp: varchar('recog_seq_plus_overhang_rev_comp').generatedAlwaysAs((): SQL => sql`reverse(translate(${restrictionEnzymes.recogSeqPlusOverhang}, 'aAcCgGtT', 'tTgGcCaA'))`),
}, (t) => [
    check("recog_seq_plus_overhang_check", sql`${t.recogSeqPlusOverhang} ~* '^[actgn]*$'`),
])
