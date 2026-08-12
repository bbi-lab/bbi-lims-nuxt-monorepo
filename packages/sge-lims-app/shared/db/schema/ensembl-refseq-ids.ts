import { pgTable, text } from 'drizzle-orm/pg-core'

// Ensembl gene IDs with their MANE Select transcript and matching RefSeq accession
export const ensemblRefseqIds = pgTable('ensembl_refseq_ids', {
  geneStableId: text('gene_stable_id').primaryKey().notNull(),
  maneSelectEnsemblId: text('mane_select_ensembl_id').notNull().unique(),
  maneSelectRefseqAcc: text('mane_select_refseq_acc').notNull().unique(),
})
