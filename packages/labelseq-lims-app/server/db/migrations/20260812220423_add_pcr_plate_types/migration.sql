-- Plate types for the plates created with each PCR experiment by POST /api/pcr-experiments.
-- plates.plate_type is an FK to plate_types.value, so these rows must exist before a
-- PCR experiment can be created.
INSERT INTO "plate_types" ("value", "label") VALUES
  ('pcr-1-plate', 'PCR 1 Plate'),
  ('pcr-2-plate', 'PCR 2 Plate'),
  ('pcr-rt-plate', 'PCR RT Plate')
ON CONFLICT ("value") DO NOTHING;
