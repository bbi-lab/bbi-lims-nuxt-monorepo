import { check, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm/sql"
import { genes } from 'lims-layer/shared/db/schema/gene'

export const refseqTranscripts = pgTable('refseq_transcripts', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    transcriptId: varchar('transcript_id', { length: 50 }).unique().notNull(),
    geneId: uuid('gene_id').notNull().references(() => genes.id),
    seq: text('seq'),
}, (t) => [
    check("seq_check", sql`${t.seq} ~* '^[actg]*$'`),
])
