CREATE TYPE "public"."gene_orientations" AS ENUM('plus', 'minus');--> statement-breakpoint
CREATE TABLE "genes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ncbi_accession" varchar(50) NOT NULL,
	"start_position" integer,
	"end_position" integer,
	"chromosome" varchar(10),
	"orientation" "gene_orientations",
	"name" varchar(255) NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"ncbi_gene_id" integer,
	"gene_type" varchar(50),
	"transcripts_accession" varchar(50),
	"protein_acccession" varchar(50),
	"protein_length" integer,
	"locus_tag" varchar(50),
	"assembly" varchar(50),
	"annotation" varchar(50)
);
--> statement-breakpoint
CREATE INDEX "ncbi_accession_idx" ON "genes" USING btree ("ncbi_accession");--> statement-breakpoint
CREATE INDEX "symbol_idx" ON "genes" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "gene_type_idx" ON "genes" USING btree ("gene_type");