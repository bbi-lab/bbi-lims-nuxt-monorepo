CREATE TABLE "refseq_transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"transcript_id" varchar(50) NOT NULL UNIQUE,
	"gene_id" uuid NOT NULL,
	"seq" text,
	CONSTRAINT "seq_check" CHECK ("seq" ~* '^[actg]*$')
);
--> statement-breakpoint
ALTER TABLE "restriction_enzymes" DROP CONSTRAINT "recog_seq_plusone_check";--> statement-breakpoint
ALTER TABLE "restriction_enzymes" ADD COLUMN "recog_seq_plus_overhang" varchar(20);--> statement-breakpoint
ALTER TABLE "restriction_enzymes" ADD COLUMN "overhang_length" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "restriction_enzymes" ADD COLUMN "recog_seq_plus_overhang_rev_comp" varchar GENERATED ALWAYS AS (reverse(translate("restriction_enzymes"."recog_seq_plus_overhang", 'aAcCgGtT', 'tTgGcCaA'))) STORED;--> statement-breakpoint
ALTER TABLE "superblocks" ADD COLUMN "refseq_transcript_id" uuid;--> statement-breakpoint
ALTER TABLE "superblocks" ADD COLUMN "start" integer;--> statement-breakpoint
ALTER TABLE "superblocks" ADD COLUMN "end" integer;--> statement-breakpoint
ALTER TABLE "restriction_enzymes" DROP COLUMN "recog_seq";--> statement-breakpoint
ALTER TABLE "restriction_enzymes" ADD COLUMN "recog_seq" varchar(20) GENERATED ALWAYS AS (substring("restriction_enzymes"."recog_seq_plus_overhang", 1, length("restriction_enzymes"."recog_seq_plus_overhang") - "restriction_enzymes"."overhang_length")) STORED;--> statement-breakpoint
ALTER TABLE "restriction_enzymes" DROP COLUMN "recog_seq_rev_comp";--> statement-breakpoint
ALTER TABLE "restriction_enzymes" ADD COLUMN "recog_seq_rev_comp" varchar GENERATED ALWAYS AS (reverse(translate(substring("restriction_enzymes"."recog_seq_plus_overhang", 1, length("restriction_enzymes"."recog_seq_plus_overhang") - "restriction_enzymes"."overhang_length"), 'aAcCgGtT', 'tTgGcCaA'))) STORED;--> statement-breakpoint
ALTER TABLE "restriction_enzymes" DROP COLUMN "recog_seq_plusone";--> statement-breakpoint
ALTER TABLE "restriction_enzymes" DROP COLUMN "recog_seq_plus_one_rev_comp";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tiles" ALTER COLUMN "superblock_first" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tiles" ALTER COLUMN "last" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "superblocks" ADD CONSTRAINT "superblocks_refseq_transcript_id_refseq_transcripts_id_fkey" FOREIGN KEY ("refseq_transcript_id") REFERENCES "refseq_transcripts"("id");--> statement-breakpoint
ALTER TABLE "refseq_transcripts" ADD CONSTRAINT "refseq_transcripts_gene_id_genes_id_fkey" FOREIGN KEY ("gene_id") REFERENCES "genes"("id");--> statement-breakpoint
ALTER TABLE "restriction_enzymes" ADD CONSTRAINT "recog_seq_plus_overhang_check" CHECK ("recog_seq_plus_overhang" ~* '^[actgn]*$');