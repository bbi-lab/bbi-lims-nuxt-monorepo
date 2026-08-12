-- Drop the unused targets.sequence column and its ACTG check constraint.
-- Ports bbi-lims-sge migration 0189.

ALTER TABLE "targets" DROP CONSTRAINT "sequence_check";--> statement-breakpoint
ALTER TABLE "targets" DROP COLUMN "sequence";
