-- Add the two preseq-primer plate types and the mixed preseq primers view.
-- Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING and CREATE OR REPLACE VIEW.
--
-- view_plates_with_well_counts is intentionally NOT touched here: it derives its
-- plate_type_label via a LEFT JOIN to plate_types, so new plate types appear
-- automatically once seeded below (no view recreation needed).

INSERT INTO "plate_types" ("value", "label", "desc") VALUES
    ('preseq-primer', 'PreSeq primer plate', 'PreSeq primer plate'),
    ('preseq-primer-storage', 'PreSeq primer storage', 'PreSeq primer storage')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE VIEW view_mixed_preseq_primers AS
  SELECT p.id, p.name, p.sequence_type, 'dna-preseq-1'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM preseq_1_primers p
  LEFT JOIN preseq_1_primer_targets pt ON pt.preseq_1_primer_id = p.id
  LEFT JOIN targets t ON t.id = pt.target_id
  LEFT JOIN projects pr ON pr.id = t.project_id
  GROUP BY p.id
  UNION ALL
  SELECT p.id, p.name, p.sequence_type, 'dna-preseq-2'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM preseq_2_primers p
  LEFT JOIN targets t ON t.id = p.target_id
  LEFT JOIN projects pr ON pr.id = t.project_id
  GROUP BY p.id
  UNION ALL
  SELECT p.id, p.name, p.sequence_type, 'rna-preseq-1'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM rna_preseq_1_primers p
  LEFT JOIN rna_preseq_1_primer_targets pt ON pt.rna_preseq_1_primer_id = p.id
  LEFT JOIN targets t ON t.id = pt.target_id
  LEFT JOIN projects pr ON pr.id = t.project_id
  GROUP BY p.id
  UNION ALL
  SELECT p.id, p.name, p.sequence_type, 'rna-preseq-2'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM rna_preseq_2_primers p
  LEFT JOIN rna_preseq_2_primer_targets pt ON pt.rna_preseq_2_primer_id = p.id
  LEFT JOIN targets t ON t.id = pt.target_id
  LEFT JOIN projects pr ON pr.id = t.project_id
  GROUP BY p.id;
