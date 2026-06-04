CREATE TYPE "superblock_classification" AS ENUM('n-terminus', 'c-terminus', 'internal', 'complete');--> statement-breakpoint
ALTER TYPE "primer_types" RENAME TO "primer_type";--> statement-breakpoint
ALTER TYPE "amino_acids" RENAME TO "amino_acid";--> statement-breakpoint
ALTER TYPE "dna_codons" RENAME TO "dna_codon";--> statement-breakpoint
ALTER TABLE "labelseq_index_primers" DROP CONSTRAINT "seq_check";--> statement-breakpoint
ALTER TABLE "nextera_index_primers" DROP CONSTRAINT "seq_check";--> statement-breakpoint
ALTER TABLE "superblocks" ADD COLUMN "classification" "superblock_classification";--> statement-breakpoint
ALTER TABLE "labelseq_index_primers" DROP COLUMN "seq";--> statement-breakpoint
ALTER TABLE "nextera_index_primers" DROP COLUMN "seq";--> statement-breakpoint
ALTER TABLE "wellables" DROP CONSTRAINT "wellable_table_name", ADD CONSTRAINT "wellable_table_name" CHECK ("table_name" IN ('retriever_primers', 'labelseq_index_primers', 'nextera_index_primers'));