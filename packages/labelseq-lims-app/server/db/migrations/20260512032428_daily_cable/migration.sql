CREATE TYPE "primer_directions" AS ENUM('forward', 'reverse');--> statement-breakpoint
CREATE TABLE "retriever_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"seq" text NOT NULL,
	"seq_rev_comp" text GENERATED ALWAYS AS (reverse(translate("retriever_primers"."seq", 'aAcCgGtT', 'tTgGcCaA'))) STORED,
	"direction" "primer_directions" NOT NULL,
	CONSTRAINT "seq_check" CHECK ("seq" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"restriction_enzyme" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restriction_enzymes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(10) NOT NULL,
	"recog_seq_plusone" varchar(20),
	"recog_seq" varchar(20) GENERATED ALWAYS AS (substring("restriction_enzymes"."recog_seq_plusone", 1, length("restriction_enzymes"."recog_seq_plusone") - 1)) STORED,
	"recog_seq_rev_comp" varchar GENERATED ALWAYS AS (reverse(translate(substring("restriction_enzymes"."recog_seq_plusone", 1, length("restriction_enzymes"."recog_seq_plusone") - 1), 'aAcCgGtT', 'tTgGcCaA'))) STORED,
	"recog_seq_plus_one_rev_comp" varchar GENERATED ALWAYS AS (reverse(translate("restriction_enzymes"."recog_seq_plusone", 'aAcCgGtT', 'tTgGcCaA'))) STORED,
	CONSTRAINT "recog_seq_plusone_check" CHECK ("recog_seq_plusone" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "superblocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" varchar(255),
	"seq" text,
	CONSTRAINT "seq_check" CHECK ("seq" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "tiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"superblock_id" uuid NOT NULL,
	"tile_name" varchar(50) NOT NULL,
	"tile_start" integer NOT NULL,
	"tile_end" integer NOT NULL,
	"mutagenesis_start" integer,
	"mutagenesis_end" integer,
	"retriever_primer_forward_id" uuid,
	"retriever_primer_reverse_id" uuid,
	"superblock_first" boolean DEFAULT false NOT NULL,
	"last" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "superblocks" ADD CONSTRAINT "superblocks_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "tiles" ADD CONSTRAINT "tiles_superblock_id_superblocks_id_fkey" FOREIGN KEY ("superblock_id") REFERENCES "superblocks"("id");--> statement-breakpoint
ALTER TABLE "tiles" ADD CONSTRAINT "tiles_retriever_primer_forward_id_retriever_primers_id_fkey" FOREIGN KEY ("retriever_primer_forward_id") REFERENCES "retriever_primers"("id");--> statement-breakpoint
ALTER TABLE "tiles" ADD CONSTRAINT "tiles_retriever_primer_reverse_id_retriever_primers_id_fkey" FOREIGN KEY ("retriever_primer_reverse_id") REFERENCES "retriever_primers"("id");