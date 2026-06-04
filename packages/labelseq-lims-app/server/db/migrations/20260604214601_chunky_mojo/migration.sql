CREATE TYPE "gene_type" AS ENUM('c-tag', 'n-tag');--> statement-breakpoint
ALTER TABLE "refseq_transcripts" ADD COLUMN "gene_type" "gene_type";