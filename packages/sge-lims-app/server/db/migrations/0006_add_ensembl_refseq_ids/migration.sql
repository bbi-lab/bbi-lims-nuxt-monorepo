-- Ensembl gene IDs with their MANE Select transcript and matching RefSeq accession.
-- Joined to genes on genes.transcripts_accession = mane_select_refseq_acc so the gene
-- targets TSV export can emit the Ensembl transcript ID.
--
-- Ports bbi-lims-sge migrations 0187 and 0188 (which created the table nullable and then
-- tightened it) as a single statement set.

CREATE TABLE "ensembl_refseq_ids" (
	"gene_stable_id" text PRIMARY KEY NOT NULL,
	"mane_select_ensembl_id" text NOT NULL,
	"mane_select_refseq_acc" text NOT NULL,
	CONSTRAINT "ensembl_refseq_ids_mane_select_ensembl_id_unique" UNIQUE("mane_select_ensembl_id"),
	CONSTRAINT "ensembl_refseq_ids_mane_select_refseq_acc_unique" UNIQUE("mane_select_refseq_acc")
);
