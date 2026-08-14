CREATE TABLE "pcr_1_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"seq" text NOT NULL,
	"direction" "primer_directions" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequencing_illumina_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"seq" text NOT NULL,
	"direction" "primer_directions" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequencing_index_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"seq" text NOT NULL,
	"direction" "primer_directions" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequencing_read_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"seq" text NOT NULL,
	"direction" "primer_directions" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wellables" DROP CONSTRAINT "wellable_table_name", ADD CONSTRAINT "wellable_table_name" CHECK ("table_name" IN ('retriever_primers', 'labelseq_index_primers', 'nextera_index_primers', 'sequencing_read_primers', 'sequencing_index_primers', 'sequencing_illumina_primers', 'pcr_1_primers'));--> statement-breakpoint

-- Triggers are not modelled by drizzle — added by hand, mirroring 20260604190108_wellable_table_triggers.
CREATE OR REPLACE TRIGGER "sequencing_read_primers_wellables_insert"
BEFORE INSERT ON "sequencing_read_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "sequencing_read_primers_wellables_delete"
BEFORE DELETE ON "sequencing_read_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "sequencing_index_primers_wellables_insert"
BEFORE INSERT ON "sequencing_index_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "sequencing_index_primers_wellables_delete"
BEFORE DELETE ON "sequencing_index_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "sequencing_illumina_primers_wellables_insert"
BEFORE INSERT ON "sequencing_illumina_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "sequencing_illumina_primers_wellables_delete"
BEFORE DELETE ON "sequencing_illumina_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "pcr_1_primers_wellables_insert"
BEFORE INSERT ON "pcr_1_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "pcr_1_primers_wellables_delete"
BEFORE DELETE ON "pcr_1_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();