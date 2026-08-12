-- Retire the legacy preseq-1/2/3 plate types. They predate the DNA/RNA split and were
-- replaced by dna-preseq-1/2/3 and rna-preseq-1/2/3. Ports bbi-lims-sge migration 0192.
--
-- These values were never seeded into pcr_types, so only plate_types needs the delete.
-- As in 0003, view_plates_with_well_counts needs no rebuild (it joins plate_types).
--
-- As in 0003, the FK on plates.plate_type makes this abort if a plate still uses one of these
-- types. Check first:
--
--   SELECT plate_type, name FROM plates WHERE plate_type IN ('preseq-1','preseq-2','preseq-3');

DELETE FROM "plate_types" WHERE "value" IN (
    'preseq-1',
    'preseq-2',
    'preseq-3'
);
