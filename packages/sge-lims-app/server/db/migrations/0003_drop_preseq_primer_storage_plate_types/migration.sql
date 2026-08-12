-- Retire the four per-type preseq primer storage plate types. They are superseded by the
-- unified 'preseq-primer-storage' type seeded in 0002, which holds a mix of all four
-- preseq primer types. Ports bbi-lims-sge migration 0184.
--
-- view_plates_with_well_counts is intentionally NOT recreated: unlike the standalone repo
-- (which inlined the plate types as a VALUES CTE and so had to rebuild the view), this
-- view derives plate_type_label via a LEFT JOIN to plate_types, so removing rows here is
-- picked up automatically.
--
-- Unlike the standalone repo, plates.plate_type carries a real FK to plate_types here, so this
-- DELETE aborts if any plate still uses one of these types. Check before applying:
--
--   SELECT plate_type, name FROM plates WHERE plate_type IN (
--     'dna-preseq-1-primer-storage','dna-preseq-2-primer-storage',
--     'rna-preseq-1-primer-storage','rna-preseq-2-primer-storage');
--
-- Re-point or delete any such plate first. (The sge_lims_migration_test database had one:
-- '20260522_PIK3CA_PreSeq1+2', an empty dna-preseq-2-primer-storage plate.)

DELETE FROM "plate_types" WHERE "value" IN (
    'dna-preseq-1-primer-storage',
    'dna-preseq-2-primer-storage',
    'rna-preseq-1-primer-storage',
    'rna-preseq-2-primer-storage'
);
