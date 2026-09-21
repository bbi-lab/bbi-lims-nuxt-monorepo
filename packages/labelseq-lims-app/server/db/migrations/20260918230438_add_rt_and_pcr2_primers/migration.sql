CREATE TABLE "pcr_2_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"reference_id" text,
	"seq" text NOT NULL,
	"direction" "primer_directions" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rt_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"reference_id" text,
	"seq" text NOT NULL,
	"direction" "primer_directions" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "labelseq_index_primers" ADD COLUMN "reference_id" text;--> statement-breakpoint
ALTER TABLE "nextera_index_primers" ADD COLUMN "reference_id" text;--> statement-breakpoint
ALTER TABLE "pcr_1_primers" ADD COLUMN "reference_id" text;--> statement-breakpoint
ALTER TABLE "retriever_primers" ADD COLUMN "reference_id" text;--> statement-breakpoint
ALTER TABLE "sequencing_illumina_primers" ADD COLUMN "reference_id" text;--> statement-breakpoint
ALTER TABLE "sequencing_index_primers" ADD COLUMN "reference_id" text;--> statement-breakpoint
ALTER TABLE "sequencing_read_primers" ADD COLUMN "reference_id" text;--> statement-breakpoint
ALTER TABLE "wellables" DROP CONSTRAINT "wellable_table_name", ADD CONSTRAINT "wellable_table_name" CHECK ("table_name" IN ('retriever_primers', 'labelseq_index_primers', 'nextera_index_primers', 'sequencing_read_primers', 'sequencing_index_primers', 'sequencing_illumina_primers', 'pcr_1_primers', 'pcr_2_primers', 'rt_primers'));--> statement-breakpoint

-- Drizzle does not generate triggers. Added by hand, mirroring 20260604190108_wellable_table_triggers.
CREATE OR REPLACE TRIGGER "pcr_2_primers_wellables_insert"
BEFORE INSERT ON "pcr_2_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "pcr_2_primers_wellables_delete"
BEFORE DELETE ON "pcr_2_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "rt_primers_wellables_insert"
BEFORE INSERT ON "rt_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "rt_primers_wellables_delete"
BEFORE DELETE ON "rt_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();