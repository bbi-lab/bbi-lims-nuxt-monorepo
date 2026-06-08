ALTER TABLE "refseq_transcripts" RENAME COLUMN "seq" TO "cds";--> statement-breakpoint
ALTER TABLE "refseq_transcripts" RENAME CONSTRAINT "seq_check" TO "cds_check";--> statement-breakpoint
ALTER TABLE "refseq_transcripts" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "refseq_transcripts" ADD COLUMN "aa" text;--> statement-breakpoint
ALTER TABLE "refseq_transcripts" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "labelseq_index_primers" ADD CONSTRAINT "labelseq_index_primers_name_key" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "nextera_index_primers" ADD CONSTRAINT "nextera_index_primers_name_key" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "retriever_primers" ADD CONSTRAINT "retriever_primers_name_key" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_name_key" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "superblocks" ADD CONSTRAINT "superblocks_name_key" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "tiles" ADD CONSTRAINT "tiles_tile_name_key" UNIQUE("tile_name");--> statement-breakpoint
ALTER TABLE "refseq_transcripts" ADD CONSTRAINT "aa_check" CHECK ("aa" ~* '^[ACDEFGHIKLMNPQRSTVWY]*$');--> statement-breakpoint
ALTER TABLE "refseq_transcripts" DROP CONSTRAINT "cds_check", ADD CONSTRAINT "cds_check" CHECK ("cds" ~* '^[actg]*$');