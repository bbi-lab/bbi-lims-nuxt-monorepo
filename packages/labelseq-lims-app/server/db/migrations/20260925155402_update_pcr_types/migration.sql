-- The PCR type list changes from pcr-1 / pcr-2 / pcr-rt to seven types, each with its
-- own plate type. pcr_type is a text column whose values are constrained in TypeScript
-- only, so existing records are moved by the UPDATEs below.

-- New plate types first: plates.plate_type is an FK to plate_types.value, so the rows
-- have to exist before any plate can point at them.
INSERT INTO "plate_types" ("value", "label") VALUES
  ('tile-oligo-pcr-1-plate', 'Tile Oligo PCR 1 Plate'),
  ('tile-oligo-pcr-2-plate', 'Tile Oligo PCR 2 Plate'),
  ('plasmid-barcode-pcr-1-plate', 'Plasmid Barcode PCR 1 Plate'),
  ('plasmid-barcode-pcr-2-plate', 'Plasmid Barcode PCR 2 Plate'),
  ('rt-pcr-plate', 'RT PCR Plate'),
  ('post-rt-pcr-1-plate', 'Post-RT PCR 1 Plate'),
  ('post-rt-pcr-2-plate', 'Post-RT PCR 2 Plate')
ON CONFLICT ("value") DO NOTHING;--> statement-breakpoint

UPDATE "pcr_experiments" SET "pcr_type" = 'tile-oligo-pcr-1' WHERE "pcr_type" = 'pcr-1';--> statement-breakpoint
UPDATE "pcr_experiments" SET "pcr_type" = 'tile-oligo-pcr-2' WHERE "pcr_type" = 'pcr-2';--> statement-breakpoint
UPDATE "pcr_experiments" SET "pcr_type" = 'rt-pcr' WHERE "pcr_type" = 'pcr-rt';--> statement-breakpoint

UPDATE "plates" SET "plate_type" = 'tile-oligo-pcr-1-plate' WHERE "plate_type" = 'pcr-1-plate';--> statement-breakpoint
UPDATE "plates" SET "plate_type" = 'tile-oligo-pcr-2-plate' WHERE "plate_type" = 'pcr-2-plate';--> statement-breakpoint
UPDATE "plates" SET "plate_type" = 'rt-pcr-plate' WHERE "plate_type" = 'pcr-rt-plate';--> statement-breakpoint

-- Retired plate types. The UPDATEs above moved every plate off them, so the FK holds;
-- if this DELETE fails, a plate is still on an old type and needs a home first.
DELETE FROM "plate_types" WHERE "value" IN ('pcr-1-plate', 'pcr-2-plate', 'pcr-rt-plate');
