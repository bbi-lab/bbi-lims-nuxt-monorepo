-- Record when a plasmid was cloned, and the Plasmidsaurus order it was sent in.
-- Ports bbi-lims-sge migration 0186.

ALTER TABLE "sg_rna_plasmids" ADD COLUMN "cloned_on" timestamp;--> statement-breakpoint
ALTER TABLE "snv_lib_plasmids" ADD COLUMN "plasmidsaurus_order_id" varchar(255);--> statement-breakpoint
ALTER TABLE "snv_lib_plasmids" ADD COLUMN "cloned_on" timestamp;
