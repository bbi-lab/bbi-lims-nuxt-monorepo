-- Plasmid fields the lab asked for. Ports bbi-lims-sge migration 0190.
--
-- external_link becomes benchling_link on both plasmid tables (with its CHECK constraint
-- renamed to match), sgRNA plasmids gain a GeneWiz order number, SNVlib plasmids gain a
-- bacterial plate images link, and the two verification flags that nothing reads are dropped.

ALTER TABLE "sg_rna_plasmids" RENAME COLUMN "external_link" TO "benchling_link";--> statement-breakpoint
ALTER TABLE "snv_lib_plasmids" RENAME COLUMN "external_link" TO "benchling_link";--> statement-breakpoint
ALTER TABLE "sg_rna_plasmids" DROP CONSTRAINT "external_link_check";--> statement-breakpoint
ALTER TABLE "snv_lib_plasmids" DROP CONSTRAINT "external_link_check";--> statement-breakpoint
ALTER TABLE "sg_rna_plasmids" ADD COLUMN "genewiz_order_number" varchar(255);--> statement-breakpoint
ALTER TABLE "snv_lib_plasmids" ADD COLUMN "bacterial_plate_images_link" text;--> statement-breakpoint
ALTER TABLE "sg_rna_plasmids" DROP COLUMN "verification_status";--> statement-breakpoint
ALTER TABLE "snv_lib_plasmids" DROP COLUMN "plasmidsaurus_verification";--> statement-breakpoint
ALTER TABLE "sg_rna_plasmids" ADD CONSTRAINT "benchling_link_check" CHECK ("sg_rna_plasmids"."benchling_link" ~* '^https?://.+$');--> statement-breakpoint
ALTER TABLE "snv_lib_plasmids" ADD CONSTRAINT "benchling_link_check" CHECK ("snv_lib_plasmids"."benchling_link" ~* '^https?://.+$');--> statement-breakpoint
ALTER TABLE "snv_lib_plasmids" ADD CONSTRAINT "bacterial_plate_images_link_check" CHECK ("snv_lib_plasmids"."bacterial_plate_images_link" ~* '^https?://.+$');
