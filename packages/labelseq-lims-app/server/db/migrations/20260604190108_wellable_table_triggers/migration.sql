-- Add triggers to wellable tables to automatically insert/delete from wellables when rows are inserted/deleted from the sample tables:
CREATE OR REPLACE TRIGGER "labelseq_index_primers_wellables_insert"
BEFORE INSERT ON "labelseq_index_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "labelseq_index_primers_wellables_delete"
BEFORE DELETE ON "labelseq_index_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "nextera_index_primers_wellables_insert"
BEFORE INSERT ON "nextera_index_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "nextera_index_primers_wellables_delete"
BEFORE DELETE ON "nextera_index_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "retriever_primers_wellables_insert"
BEFORE INSERT ON "retriever_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "retriever_primers_wellables_delete"
BEFORE DELETE ON "retriever_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();
