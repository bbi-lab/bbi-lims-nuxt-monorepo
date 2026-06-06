CREATE TYPE "primer_types" AS ENUM('p5', 'p7');--> statement-breakpoint
CREATE TABLE "labelseq_index_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"seq" text NOT NULL,
	"primer_type" "primer_types" NOT NULL,
	"index_seq" text NOT NULL,
	"index_seq_rev_comp" text GENERATED ALWAYS AS (reverse(translate("labelseq_index_primers"."index_seq", 'aAcCgGtT', 'tTgGcCaA'))) STORED,
	CONSTRAINT "seq_check" CHECK ("seq" ~* '^[actg]*$'),
	CONSTRAINT "index_seq_check" CHECK ("index_seq" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "nextera_index_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"seq" text NOT NULL,
	"primer_type" "primer_types" NOT NULL,
	"index_seq" text NOT NULL,
	"index_seq_rev_comp" text GENERATED ALWAYS AS (reverse(translate("nextera_index_primers"."index_seq", 'aAcCgGtT', 'tTgGcCaA'))) STORED,
	CONSTRAINT "seq_check" CHECK ("seq" ~* '^[actg]*$'),
	CONSTRAINT "index_seq_check" CHECK ("index_seq" ~* '^[actg]*$')
);
--> statement-breakpoint
ALTER TABLE "wellables" DROP CONSTRAINT "wellable_table_name", ADD CONSTRAINT "wellable_table_name" CHECK ("table_name" IN ('labelseq_index_primers', 'nextera_index_primers'));