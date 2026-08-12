-- =============================================================================
-- SGE LIMS Production Migration Script
-- From: bbi-lims-sge (standalone, ~180 Drizzle migrations)
--   To: bbi-lims-nuxt-monorepo / packages/sge-lims-app
--
-- Run this ONCE against the production database before switching to the new
-- monorepo app. It is idempotent where possible but is intended for a single
-- controlled cutover, not repeated application.
--
-- What this script does:
--   1. Moves user/auth tables from public schema → users schema
--   2. Creates password_reset_tokens in users schema
--   3. Creates plate_types lookup table and seeds all values
--   4. Creates pcr_types lookup table and seeds all values
--   5. Adds FK constraints on plates.plate_type and pcr_experiments.pcr_type
--   6. Renames 18 user-FK columns to the new _id-suffix convention
--   7. Drops and recreates 3 views that reference renamed columns / new tables,
--      and creates the new view_mixed_preseq_primers view
--   8. Registers the new baseline migrations with Drizzle's tracking table
--      (0000_sge_baseline, 0001_create_plate_and_pcr_types,
--       0002_mixed_preseq_primer_view, 0003-0010,
--       20260508153256_add_password_reset_tokens)
--
-- Safety:
--   - Wrapped in a single transaction (all-or-nothing).
--   - Data integrity checks abort the migration early if unexpected values exist.
--   - ON CONFLICT DO NOTHING guards prevent duplicate inserts on retry.
--
-- BEFORE RUNNING — confirm the standalone app has applied its migrations through 0193,
-- since Section 8 registers the monorepo's 0003-0010 as already-applied rather than
-- running them:
--
--   -- expect: benchling_link present, external_link absent
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'sg_rna_plasmids' AND column_name IN ('benchling_link','external_link');
--   -- expect: one row
--   SELECT 1 FROM pg_type WHERE typname = 'record_statuses';
--   -- expect: one row
--   SELECT 1 FROM information_schema.tables WHERE table_name = 'ensembl_refseq_ids';
--   -- expect: no rows (a row here means a plate still uses a retired type, and the
--   -- plate_type FK in Section 5 will abort the cutover)
--   SELECT plate_type, count(*) FROM public.plates
--   WHERE plate_type IN ('preseq-1','preseq-2','preseq-3',
--                        'dna-preseq-1-primer-storage','dna-preseq-2-primer-storage',
--                        'rna-preseq-1-primer-storage','rna-preseq-2-primer-storage')
--   GROUP BY plate_type;
-- =============================================================================

BEGIN;

-- =============================================================================
-- SECTION 1: Create the users Postgres schema and move auth tables into it
-- =============================================================================
-- The new monorepo stores users, pre_verified_users, user_groups, and
-- user_group_memberships in a dedicated 'users' Postgres schema instead of
-- the default public schema.
--
-- ALTER TABLE … SET SCHEMA preserves all data, indexes, sequences, and
-- foreign-key constraints (PostgreSQL resolves FKs by OID, not schema name).

CREATE SCHEMA IF NOT EXISTS users;

-- Move tables. Order: junction table first, then the tables it references.
-- (SET SCHEMA doesn't enforce FK ordering, but this is cleaner to reason about.)
ALTER TABLE public.user_group_memberships SET SCHEMA users;
ALTER TABLE public.user_groups SET SCHEMA users;
ALTER TABLE public.pre_verified_users SET SCHEMA users;
ALTER TABLE public.users SET SCHEMA users;

-- Rename unique constraints to match the named constraints in the new schema.
-- Drizzle uses named constraints; the old schema used anonymous inline .unique()
-- which Postgres names as "{table}_{column}_unique" by default. These blocks are
-- no-ops if the constraints are already correctly named.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'users' AND table_name = 'users'
      AND constraint_name = 'users_email_key'
  ) THEN
    ALTER TABLE users.users RENAME CONSTRAINT users_email_key TO users_email_unique;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'users' AND table_name = 'pre_verified_users'
      AND constraint_name = 'pre_verified_users_email_key'
  ) THEN
    ALTER TABLE users.pre_verified_users RENAME CONSTRAINT pre_verified_users_email_key TO pre_verified_users_email_unique;
  END IF;
END $$;

-- =============================================================================
-- SECTION 2: Create password_reset_tokens (new table in users schema)
-- =============================================================================
-- Added by lims-layer migration 20260508153256_add_password_reset_tokens.
-- Not present in the old standalone repo.

CREATE TABLE IF NOT EXISTS users.password_reset_tokens (
  id         uuid      PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id    uuid      NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  token_hash text      NOT NULL,
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_token_hash_idx
  ON users.password_reset_tokens (token_hash);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
  ON users.password_reset_tokens (user_id);

-- =============================================================================
-- SECTION 3: Create plate_types lookup table and seed all values
-- =============================================================================
-- Replaces the hardcoded ENUM_LOOKUPS.plates.plateType TypeScript union.
-- All values from the old enum-lookups.ts are inserted here so the FK added
-- in Section 5 can be satisfied by all existing plates rows.

CREATE TABLE IF NOT EXISTS public.plate_types (
  value  varchar(100) PRIMARY KEY NOT NULL,
  label  varchar(255) NOT NULL,
  "desc" varchar(500)
);

INSERT INTO public.plate_types (value, label, "desc") VALUES
  ('pellet-storage',                      'Pellet storage',                      'Pellet storage'),
  ('lin-primer-storage',                  'LIN primer storage',                  'Linearization primer storage'),
  ('amp-primer-storage',                  'AMP primer storage',                  'Amplification primer storage'),
  ('ha-primer-storage',                   'HA primer storage',                   'Homology arm primer storage'),
  ('ha-puc19-primer-storage',             'HA pUC19 primer storage',             'Homology arm pUC19 arm primer storage'),
  ('sg-rna-oligo-storage',                'sgRNA oligo storage',                 'sgRNA oligo storage'),
  ('sg-rna-oligo',                        'sgRNA oligo',                         'sgRNA oligo'),
  ('sg-rna-plasmid-storage',              'sgRNA plasmid storage',               'sgRNA plasmid storage'),
  ('sg-rna-plasmid',                      'sgRNA plasmid',                       'sgRNA plasmid'),
  ('lin-pcr',                             'LIN PCR',                             'Linearization primer PCR'),
  ('amp-pcr',                             'AMP PCR',                             'Amplification primer PCR'),
  ('ha-pcr',                              'HA PCR',                              'Homology arm primer PCR'),
  ('dna-preseq-1',                        'DNA PreSeq 1',                        'DNA PreSeq 1'),
  ('dna-preseq-2',                        'DNA PreSeq 2',                        'DNA PreSeq 2'),
  ('dna-preseq-3',                        'DNA PreSeq 3',                        'DNA PreSeq 3'),
  ('rna-rt-storage',                      'RNA RT storage',                      'RNA Reverse Transcription storage'),
  ('rna-preseq-1',                        'RNA PreSeq 1',                        'RNA PreSeq 1'),
  ('rna-preseq-2',                        'RNA PreSeq 2',                        'RNA PreSeq 2'),
  ('rna-preseq-3',                        'RNA PreSeq 3',                        'RNA PreSeq 3'),
  ('snv-lib-preseq-2',                    'SNVlib PreSeq 2',                     'SNVlib PreSeq 2'),
  ('snv-lib-preseq-3',                    'SNVlib PreSeq 3',                     'SNVlib PreSeq 3'),
  ('seq-index',                           'Seq index',                           'Sequencing index plate'),
  ('clonal-ha',                           'Clonal HA plate',                     'Clonal HA plate'),
  ('rna-rt-primer-storage',               'RNA RT primer storage',               'RNA RT primer storage'),
  ('external-sample-indexing',            'External sample indexing',            'External sample indexing'),
  ('ha-pcr-product-storage',              'HA PCR product storage',              'HA PCR product storage'),
  ('ha-puc19-pcr-product-storage',        'HA pUC19 PCR product storage',        'HA pUC19 PCR product storage'),
  ('ha-puc19-gibson-product-storage',     'HA pUC19 Gibson product storage',     'HA pUC19 Gibson product storage'),
  ('ha-puc19-plasmid-storage',            'HA pUC19 plasmid storage',            'HA pUC19 plasmid storage'),
  ('snv-lib-amp-product-storage',         'SNVlib AMP product storage',          'SNVlib AMP product storage'),
  ('snv-lib-lin-product-storage',         'SNVlib LIN product storage',          'SNVlib LIN product storage'),
  ('snv-lib-gibson-product-storage',      'SNVlib Gibson product storage',       'SNVlib Gibson product storage'),
  ('snv-lib-plasmid-storage',             'SNVlib plasmid storage',              'SNVlib plasmid storage'),
  ('snv-lib-golden-gate-product-storage', 'SNVlib Golden Gate product storage',  'SNVlib Golden Gate product storage'),
  ('preseq-primer',                       'PreSeq primer plate',                 'PreSeq primer plate'),
  ('preseq-primer-storage',               'PreSeq primer storage',               'PreSeq primer storage')
ON CONFLICT (value) DO NOTHING;

-- =============================================================================
-- SECTION 4: Create pcr_types lookup table and seed all values
-- =============================================================================
-- Replaces the hardcoded PcrType TypeScript union in pcr-experiment.ts.

CREATE TABLE IF NOT EXISTS public.pcr_types (
  value  varchar(100) PRIMARY KEY NOT NULL,
  label  varchar(255) NOT NULL,
  "desc" varchar(500)
);

INSERT INTO public.pcr_types (value, label, "desc") VALUES
  ('lin-pcr',          'LIN PCR',          'Linearization primer PCR'),
  ('amp-pcr',          'AMP PCR',          'Amplification primer PCR'),
  ('ha-pcr',           'HA PCR',           'Homology arm primer PCR'),
  ('dna-preseq-1',     'DNA PreSeq 1',     'DNA PreSeq 1'),
  ('dna-preseq-2',     'DNA PreSeq 2',     'DNA PreSeq 2'),
  ('dna-preseq-3',     'DNA PreSeq 3',     'DNA PreSeq 3'),
  ('rna-rt',           'RNA RT',           'RNA Reverse Transcription'),
  ('rna-preseq-1',     'RNA PreSeq 1',     'RNA PreSeq 1'),
  ('rna-preseq-2',     'RNA PreSeq 2',     'RNA PreSeq 2'),
  ('rna-preseq-3',     'RNA PreSeq 3',     'RNA PreSeq 3'),
  ('snv-lib-preseq-2', 'SNVlib PreSeq 2',  'SNVlib PreSeq 2'),
  ('snv-lib-preseq-3', 'SNVlib PreSeq 3',  'SNVlib PreSeq 3')
ON CONFLICT (value) DO NOTHING;

-- =============================================================================
-- SECTION 5: Add FK constraints on type columns (plates and pcr_experiments)
-- =============================================================================
-- The old schema stored plate_type and pcr_type as free-form varchars validated
-- only at the TypeScript layer. The new schema adds referential integrity via FK
-- to the lookup tables created above.

-- Guard: abort if any plate has a plate_type value not covered by plate_types.
-- This would indicate a value was added to the app without updating enum-lookups.
DO $$
DECLARE
  bad_rows text;
BEGIN
  SELECT string_agg(DISTINCT plate_type, ', ') INTO bad_rows
  FROM public.plates
  WHERE plate_type NOT IN (SELECT value FROM public.plate_types);

  IF bad_rows IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot add plate_type FK — found plate_type values not in plate_types: [%]. '
      'Add them to the plate_types INSERT above and re-run.', bad_rows;
  END IF;
END $$;

-- Apply length cap and FK on plates.plate_type
ALTER TABLE public.plates
  ALTER COLUMN plate_type TYPE varchar(100);

-- Constraint name must match 0000_sge_baseline exactly, or post-cutover prod will not
-- match a freshly migrated database.
ALTER TABLE public.plates
  ADD CONSTRAINT plates_plate_type_plate_types_value_fkey
  FOREIGN KEY (plate_type) REFERENCES public.plate_types(value);

-- Rename plates.name unique constraint to the named form expected by new schema.
-- (Postgres auto-names anonymous unique constraints as "{table}_{column}_unique"
-- in newer Drizzle, but may be "plates_name_key" in older versions.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND table_name = 'plates'
      AND constraint_name = 'plates_name_key'
  ) THEN
    ALTER TABLE public.plates RENAME CONSTRAINT plates_name_key TO plates_name_unique;
  END IF;
END $$;

-- Guard: abort if any pcr_experiment has a pcr_type not in pcr_types.
-- Old app allowed 'preseq-1', 'preseq-2', 'preseq-3' on plates but NOT on
-- pcr_experiments — if these appear here, something unexpected happened.
DO $$
DECLARE
  bad_rows text;
BEGIN
  SELECT string_agg(DISTINCT pcr_type, ', ') INTO bad_rows
  FROM public.pcr_experiments
  WHERE pcr_type NOT IN (SELECT value FROM public.pcr_types);

  IF bad_rows IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot add pcr_type FK — found pcr_type values not in pcr_types: [%]. '
      'Add them to the pcr_types INSERT above and re-run.', bad_rows;
  END IF;
END $$;

-- Apply length cap and FK on pcr_experiments.pcr_type
ALTER TABLE public.pcr_experiments
  ALTER COLUMN pcr_type TYPE varchar(100);

-- Constraint name must match 0000_sge_baseline exactly (see the plates FK above).
ALTER TABLE public.pcr_experiments
  ADD CONSTRAINT pcr_experiments_pcr_type_pcr_types_value_fkey
  FOREIGN KEY (pcr_type) REFERENCES public.pcr_types(value);

-- =============================================================================
-- SECTION 6: Rename user FK columns to the new _id suffix convention
-- =============================================================================
-- The new schema consistently names columns that are FK references to users.id
-- with an _id suffix. The old schema omitted the suffix on many of them.
--
-- All 18 renames are in the public schema. FK constraints are preserved by
-- RENAME COLUMN — Postgres renames them to match automatically.

-- pcr_experiments
ALTER TABLE public.pcr_experiments
  RENAME COLUMN technician TO technician_id;

-- extraction_experiments
ALTER TABLE public.extraction_experiments
  RENAME COLUMN technician TO technician_id;

-- transfect_experiments
ALTER TABLE public.transfect_experiments
  RENAME COLUMN technician TO technician_id;

-- sg_rna_cloning_experiments
ALTER TABLE public.sg_rna_cloning_experiments
  RENAME COLUMN technician TO technician_id;

-- pellets
ALTER TABLE public.pellets
  RENAME COLUMN harvested_by TO harvested_by_id;

-- ha_pcr_products
ALTER TABLE public.ha_pcr_products
  RENAME COLUMN performed_by TO performed_by_id;

-- ha_puc19_pcr_products
ALTER TABLE public.ha_puc19_pcr_products
  RENAME COLUMN cleaned_by TO cleaned_by_id;

-- ha_puc19_gibson_products
ALTER TABLE public.ha_puc19_gibson_products
  RENAME COLUMN prepped_by TO prepped_by_id;

-- snv_lib_amp_products
ALTER TABLE public.snv_lib_amp_products
  RENAME COLUMN cleaned_by TO cleaned_by_id;

-- snv_lib_lin_products (two columns)
ALTER TABLE public.snv_lib_lin_products
  RENAME COLUMN dpn1_digest_by TO dpn1_digest_by_id;
ALTER TABLE public.snv_lib_lin_products
  RENAME COLUMN gel_extracted_by TO gel_extracted_by_id;

-- snv_lib_gibson_products (four columns)
ALTER TABLE public.snv_lib_gibson_products
  RENAME COLUMN gibson_by TO gibson_by_id;
ALTER TABLE public.snv_lib_gibson_products
  RENAME COLUMN cleaned_by TO cleaned_by_id;
ALTER TABLE public.snv_lib_gibson_products
  RENAME COLUMN transformed_by TO transformed_by_id;
ALTER TABLE public.snv_lib_gibson_products
  RENAME COLUMN prepped_by TO prepped_by_id;

-- ha_puc19_plasmids (three columns)
ALTER TABLE public.ha_puc19_plasmids
  RENAME COLUMN transformed_by TO transformed_by_id;
ALTER TABLE public.ha_puc19_plasmids
  RENAME COLUMN colony_picked_by TO colony_picked_by_id;
ALTER TABLE public.ha_puc19_plasmids
  RENAME COLUMN prepped_by TO prepped_by_id;

-- =============================================================================
-- SECTION 7: Drop and recreate affected views
-- =============================================================================
-- Three views reference renamed columns or the relocated users tables.
-- view_sequencing_run_all_samples is unchanged and does not need recreation.

-- ---------------------------------------------------------------------------
-- 7a. view_ha_puc19_gibson_products_with_calcs
--     Change: prepped_by → prepped_by_id; users table now in users schema.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.view_ha_puc19_gibson_products_with_calcs;

CREATE VIEW public.view_ha_puc19_gibson_products_with_calcs AS
SELECT
    *,
    CASE
        WHEN two_x_nebuilder_reagent_volume IS NOT NULL
         AND insert_volume IS NOT NULL
         AND vector_volume IS NOT NULL
        THEN two_x_nebuilder_reagent_volume - (insert_volume + vector_volume)
        ELSE NULL
    END AS h2o_volume
FROM (
    SELECT
        ha_puc19_gibson_products.id                       AS id,
        ha_puc19_gibson_products.name                     AS name,
        ha_puc19_pcr_products.id                          AS ha_puc19_pcr_product_id,
        ha_puc19_pcr_products.name                        AS ha_puc19_pcr_product_name,
        ha_puc19_gibson_products.puc19_vector_amount      AS puc19_vector_amount,
        ha_puc19_gibson_products.puc19_vector_concentration AS puc19_vector_concentration,
        ha_puc19_gibson_products.quant                    AS quant,
        ha_puc19_gibson_products.prepped_on               AS prepped_on,
        ha_puc19_gibson_products.total_reaction_volume    AS total_reaction_volume,
        CASE
            WHEN ha_puc19_gibson_products.total_reaction_volume IS NOT NULL
            THEN ha_puc19_gibson_products.total_reaction_volume / 2
            ELSE NULL
        END AS two_x_nebuilder_reagent_volume,
        u.name AS prepped_by_name,
        ha_cloning_experiments.id                         AS ha_cloning_experiment_id,
        ha_cloning_experiments.name                       AS ha_cloning_experiment_name,
        t_ha_pcr_products.id                              AS ha_pcr_product_id,
        t_ha_pcr_products.name                            AS ha_pcr_product_name,
        t_ha_pcr_products.ha_pcr_product_length           AS ha_pcr_product_length,
        CASE
            WHEN ha_puc19_gibson_products.puc19_vector_amount IS NOT NULL
             AND t_ha_pcr_products.ha_pcr_product_length IS NOT NULL
            THEN t_ha_pcr_products.ha_pcr_product_length / 2649.0
                 * ha_puc19_gibson_products.puc19_vector_amount * 2.0
            ELSE NULL
        END AS insert_dna_mass,
        CASE
            WHEN ha_puc19_gibson_products.puc19_vector_amount IS NOT NULL
             AND t_ha_pcr_products.ha_pcr_product_length IS NOT NULL
             AND ha_puc19_gibson_products.quant IS NOT NULL
            THEN t_ha_pcr_products.ha_pcr_product_length / 2649.0
                 * ha_puc19_gibson_products.puc19_vector_amount * 2.0
                 / ha_puc19_gibson_products.quant
            ELSE NULL
        END AS insert_volume,
        CASE
            WHEN ha_puc19_gibson_products.puc19_vector_amount IS NOT NULL
             AND ha_puc19_gibson_products.puc19_vector_concentration IS NOT NULL
            THEN ha_puc19_gibson_products.puc19_vector_amount
                 / ha_puc19_gibson_products.puc19_vector_concentration
            ELSE NULL
        END AS vector_volume,
        CASE
            WHEN ha_puc19_gibson_products.puc19_vector_amount IS NOT NULL
             AND t_ha_pcr_products.ha_pcr_product_length IS NOT NULL
             AND ha_puc19_gibson_products.quant IS NOT NULL
             AND ha_puc19_gibson_products.puc19_vector_concentration IS NOT NULL
            THEN (t_ha_pcr_products.ha_pcr_product_length / 2649.0
                  * ha_puc19_gibson_products.puc19_vector_amount * 2.0
                  / ha_puc19_gibson_products.quant)
                 + (ha_puc19_gibson_products.puc19_vector_amount
                    / ha_puc19_gibson_products.puc19_vector_concentration)
            ELSE NULL
        END AS total_volume,
        ha_puc19_gibson_products.notes AS notes
    FROM public.ha_puc19_gibson_products
    JOIN public.ha_puc19_pcr_products
      ON ha_puc19_pcr_products.id = ha_puc19_gibson_products.ha_puc19_pcr_product_id
    JOIN (
        SELECT
            ha_pcr_products.id,
            ha_pcr_products.name,
            ha_pcr_products.ha_cloning_experiment_id,
            CASE
                WHEN ha_pcr_products.start_position IS NOT NULL
                 AND ha_pcr_products.stop_position IS NOT NULL
                THEN ha_pcr_products.stop_position - ha_pcr_products.start_position + 1
                ELSE NULL
            END AS ha_pcr_product_length
        FROM public.ha_pcr_products
    ) AS t_ha_pcr_products
      ON t_ha_pcr_products.id = ha_puc19_pcr_products.ha_pcr_product_id
    JOIN public.ha_cloning_experiments
      ON ha_cloning_experiments.id = t_ha_pcr_products.ha_cloning_experiment_id
    LEFT JOIN users.users AS u
      ON u.id = ha_puc19_gibson_products.prepped_by_id
) t1;

-- ---------------------------------------------------------------------------
-- 7b. view_snv_lib_gibson_products
--     Changes: gibson_by → gibson_by_id, cleaned_by → cleaned_by_id,
--              transformed_by → transformed_by_id, prepped_by → prepped_by_id;
--              users table now in users schema.
--     Must keep the status column, which the app added in 0009/0010 (upstream 0191/0193) —
--     recreating the view without it would silently drop the column from prod.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.view_snv_lib_gibson_products;

CREATE VIEW public.view_snv_lib_gibson_products AS
SELECT
    *,
    CASE WHEN total_reaction_volume IS NOT NULL
         THEN total_reaction_volume / 2 ELSE NULL
    END AS two_x_nebuilder_reagent_volume,
    CASE WHEN total_reaction_volume IS NOT NULL AND lin_volume IS NOT NULL
         THEN total_reaction_volume / 2 - lin_volume ELSE NULL
    END AS nc_water_volume,
    CASE WHEN total_reaction_volume IS NOT NULL AND amp_volume IS NOT NULL AND lin_volume IS NOT NULL
         THEN total_reaction_volume / 2 - (amp_volume + lin_volume) ELSE NULL
    END AS h2o_volume,
    CASE WHEN amp_volume IS NOT NULL AND lin_volume IS NOT NULL
         THEN amp_volume + lin_volume ELSE NULL
    END AS total_volume
FROM (
    SELECT *,
        CASE WHEN amp_product_vector_amount IS NOT NULL AND amp_product_concentration != 0
             THEN amp_product_vector_amount / amp_product_concentration ELSE NULL
        END AS amp_volume,
        CASE WHEN lin_product_vector_amount IS NOT NULL AND lin_product_concentration != 0
             THEN lin_product_vector_amount / lin_product_concentration ELSE NULL
        END AS lin_volume
    FROM (
        SELECT
            snv_lib_gibson_products.id                          AS id,
            snv_lib_gibson_products.name                        AS name,
            snv_lib_gibson_products.snv_lib_cloning_experiment_id AS snv_lib_cloning_experiment_id,
            snv_lib_gibson_products.lin_product_vector_amount   AS lin_product_vector_amount,
            snv_lib_gibson_products.gibson_on                   AS gibson_on,
            snv_lib_gibson_products.cleaned_on                  AS cleaned_on,
            snv_lib_gibson_products.transformed_on              AS transformed_on,
            snv_lib_gibson_products.prepped_on                  AS prepped_on,
            snv_lib_gibson_products.quant                       AS quant,
            snv_lib_gibson_products.plasmidsaurus_checked       AS plasmidsaurus_checked,
            snv_lib_gibson_products.ngs_checked                 AS ngs_checked,
            snv_lib_gibson_products.passed_qc                   AS passed_qc,
            snv_lib_gibson_products.benchling_link              AS benchling_link,
            snv_lib_gibson_products.status                       AS status,
            snv_lib_gibson_products.notes                       AS notes,
            snv_lib_gibson_products.total_reaction_volume       AS total_reaction_volume,
            snv_lib_cloning_experiments.name                    AS snv_lib_cloning_experiment_name,
            amp_products.id                                     AS amp_product_id,
            amp_products.name                                   AS amp_product_name,
            amp_products.amp_product_size                       AS amp_product_size,
            amp_products.quant                                  AS amp_product_concentration,
            lin_products.id                                     AS lin_product_id,
            lin_products.name                                   AS lin_product_name,
            lin_products.quant                                  AS lin_product_concentration,
            lin_products.ha_pcr_product_size                    AS ha_pcr_product_size,
            gibson_by_user.name                                 AS gibson_by_name,
            cleaned_by_user.name                                AS cleaned_by_name,
            transformed_by_user.name                            AS transformed_by_name,
            prepped_by_user.name                                AS prepped_by_name,
            CASE
                WHEN lin_products.ha_pcr_product_size IS NOT NULL
                 AND amp_products.amp_product_size IS NOT NULL
                THEN lin_products.ha_pcr_product_size - amp_products.amp_product_size + 2649
                ELSE NULL
            END AS lin_product_size,
            CASE
                WHEN lin_products.ha_pcr_product_size IS NOT NULL
                 AND amp_products.amp_product_size IS NOT NULL
                 AND snv_lib_gibson_products.lin_product_vector_amount IS NOT NULL
                 AND amp_products.amp_product_size - lin_products.ha_pcr_product_size != 2649
                THEN 7.0 * amp_products.amp_product_size
                     / (lin_products.ha_pcr_product_size - amp_products.amp_product_size + 2649)
                     * snv_lib_gibson_products.lin_product_vector_amount
                ELSE NULL
            END AS amp_product_vector_amount
        FROM public.snv_lib_gibson_products
        JOIN public.snv_lib_cloning_experiments
          ON snv_lib_cloning_experiments.id = snv_lib_gibson_products.snv_lib_cloning_experiment_id
        LEFT JOIN users.users AS prepped_by_user
          ON prepped_by_user.id = snv_lib_gibson_products.prepped_by_id
        LEFT JOIN users.users AS transformed_by_user
          ON transformed_by_user.id = snv_lib_gibson_products.transformed_by_id
        LEFT JOIN users.users AS cleaned_by_user
          ON cleaned_by_user.id = snv_lib_gibson_products.cleaned_by_id
        LEFT JOIN users.users AS gibson_by_user
          ON gibson_by_user.id = snv_lib_gibson_products.gibson_by_id
        LEFT JOIN (
            SELECT
                snv_lib_lin_products.id,
                snv_lib_lin_products.name,
                snv_lib_lin_products.snv_lib_cloning_experiment_id,
                snv_lib_lin_products.quant,
                CASE
                    WHEN ha_pcr_products.start_position IS NOT NULL
                     AND ha_pcr_products.stop_position IS NOT NULL
                    THEN ha_pcr_products.stop_position - ha_pcr_products.start_position + 1
                    ELSE NULL
                END AS ha_pcr_product_size
            FROM public.snv_lib_lin_products
            LEFT JOIN public.ha_puc19_plasmids
              ON ha_puc19_plasmids.id = snv_lib_lin_products.ha_puc19_plasmid_id
            LEFT JOIN public.ha_puc19_gibson_products
              ON ha_puc19_plasmids.ha_puc19_gibson_product_id = ha_puc19_gibson_products.id
            LEFT JOIN public.ha_puc19_pcr_products
              ON ha_puc19_gibson_products.ha_puc19_pcr_product_id = ha_puc19_pcr_products.id
            LEFT JOIN public.ha_pcr_products
              ON ha_puc19_pcr_products.ha_pcr_product_id = ha_pcr_products.id
        ) lin_products
          ON lin_products.snv_lib_cloning_experiment_id = snv_lib_gibson_products.snv_lib_cloning_experiment_id
        LEFT JOIN (
            SELECT
                snv_lib_amp_products.id,
                snv_lib_amp_products.name,
                snv_lib_amp_products.snv_lib_cloning_experiment_id,
                snv_lib_amp_products.quant,
                CASE
                    WHEN snv_lib_amp_products.start_position IS NOT NULL
                     AND snv_lib_amp_products.stop_position IS NOT NULL
                    THEN snv_lib_amp_products.stop_position - snv_lib_amp_products.start_position + 1
                    ELSE NULL
                END AS amp_product_size
            FROM public.snv_lib_amp_products
        ) amp_products
          ON amp_products.snv_lib_cloning_experiment_id = snv_lib_gibson_products.snv_lib_cloning_experiment_id
    ) t2
) t3;

-- ---------------------------------------------------------------------------
-- 7c. view_plates_with_well_counts
--     Change: replace the inline CTE of plate type values with a JOIN to the
--     new plate_types table; GROUP BY now includes plate_types.label.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.view_plates_with_well_counts;

CREATE VIEW public.view_plates_with_well_counts AS
SELECT
    plates.id,
    plates.name,
    plates.size_x,
    plates.size_y,
    plates.plate_type,
    plates.discarded,
    plates.processed,
    cycles.id                                         AS cycle_id,
    cycles.name                                       AS cycle_name,
    string_agg(DISTINCT targets.name, ',')            AS targets,
    plate_types.label                                 AS plate_type_label,
    count(DISTINCT wells.id)                          AS wells_count,
    count(DISTINCT well_contents.well_id)             AS wells_with_content_count,
    count(DISTINCT well_content_sources.source_well_id) AS wells_processed_count,
    sg_rna_cloning_experiments.id                     AS sg_rna_cloning_experiment_id,
    pcr_experiments.id                                AS pcr_experiment_id
FROM public.plates
JOIN public.wells
  ON plates.id = wells.plate_id
LEFT JOIN public.plate_types
  ON plate_types.value = plates.plate_type
LEFT JOIN public.well_content_sources
  ON wells.id = well_content_sources.source_well_id
LEFT JOIN public.well_contents
  ON wells.id = well_contents.well_id
LEFT JOIN public.pcr_experiments
  ON plates.id = pcr_experiments.plate_id
LEFT JOIN public.pcr_experiment_targets
  ON pcr_experiments.id = pcr_experiment_targets.pcr_experiment_id
LEFT JOIN public.transfect_targets
  ON pcr_experiment_targets.transfect_target_id = transfect_targets.id
LEFT JOIN public.targets
  ON targets.id = transfect_targets.target_id
LEFT JOIN public.transfect_experiments
  ON transfect_targets.experiment_id = transfect_experiments.id
LEFT JOIN public.cycles
  ON transfect_experiments.cycle_id = cycles.id
LEFT JOIN public.sg_rna_cloning_experiments
  ON plates.id = sg_rna_cloning_experiments.plate_id
GROUP BY
    plates.id,
    plate_types.label,
    cycles.id,
    sg_rna_cloning_experiments.id,
    pcr_experiments.id;

-- ---------------------------------------------------------------------------
-- 7d. view_mixed_preseq_primers (new)
--     Added by sge-lims-app migration 0002_mixed_preseq_primer_view. Unions the
--     four preseq primer tables (DNA preseq-1/2, RNA preseq-1/2) into a single
--     queryable result with aggregated targets and projects. Not present in the
--     old standalone repo, so this is a plain create rather than a recreate.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_mixed_preseq_primers AS
  SELECT p.id, p.name, p.sequence_type, 'dna-preseq-1'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM public.preseq_1_primers p
  LEFT JOIN public.preseq_1_primer_targets pt ON pt.preseq_1_primer_id = p.id
  LEFT JOIN public.targets t ON t.id = pt.target_id
  LEFT JOIN public.projects pr ON pr.id = t.project_id
  GROUP BY p.id
  UNION ALL
  SELECT p.id, p.name, p.sequence_type, 'dna-preseq-2'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM public.preseq_2_primers p
  LEFT JOIN public.targets t ON t.id = p.target_id
  LEFT JOIN public.projects pr ON pr.id = t.project_id
  GROUP BY p.id
  UNION ALL
  SELECT p.id, p.name, p.sequence_type, 'rna-preseq-1'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM public.rna_preseq_1_primers p
  LEFT JOIN public.rna_preseq_1_primer_targets pt ON pt.rna_preseq_1_primer_id = p.id
  LEFT JOIN public.targets t ON t.id = pt.target_id
  LEFT JOIN public.projects pr ON pr.id = t.project_id
  GROUP BY p.id
  UNION ALL
  SELECT p.id, p.name, p.sequence_type, 'rna-preseq-2'::text AS primer_type, p.archived,
    jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) AS targets,
    jsonb_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.name)) AS projects
  FROM public.rna_preseq_2_primers p
  LEFT JOIN public.rna_preseq_2_primer_targets pt ON pt.rna_preseq_2_primer_id = p.id
  LEFT JOIN public.targets t ON t.id = pt.target_id
  LEFT JOIN public.projects pr ON pr.id = t.project_id
  GROUP BY p.id;

-- =============================================================================
-- SECTION 8: Register migrations with Drizzle's tracking table
-- =============================================================================
-- Tells Drizzle these migrations are already applied so it skips them on the
-- first startup of the new monorepo app.
--
-- NOTE: Drizzle's tracking table is named 'drizzle_migrations' in the old
-- standalone repo. Verify this is the correct table name in your database:
--
--   SELECT tablename FROM pg_tables WHERE tablename LIKE '%drizzle%';
--
-- If your database uses '__drizzle_migrations' (double-underscore, used by
-- some older drizzle-kit versions), adjust the table name below accordingly.

-- sge-lims-app: single baseline migration that consolidates all 180 old migrations
INSERT INTO drizzle_migrations (hash, created_at)
VALUES ('0000_sge_baseline', extract(epoch from now())::bigint * 1000)
ON CONFLICT DO NOTHING;

-- sge-lims-app: plate_types and pcr_types tables (created above in Sections 3 and 4)
INSERT INTO drizzle_migrations (hash, created_at)
VALUES ('0001_create_plate_and_pcr_types', extract(epoch from now())::bigint * 1000)
ON CONFLICT DO NOTHING;

-- sge-lims-app: preseq-primer plate types + view_mixed_preseq_primers
-- (plate types seeded in Section 3, view created above in Section 7d)
INSERT INTO drizzle_migrations (hash, created_at)
VALUES ('0002_mixed_preseq_primer_view', extract(epoch from now())::bigint * 1000)
ON CONFLICT DO NOTHING;

-- sge-lims-app: migrations 0003-0010 port upstream bbi-lims-sge migrations 0184-0193, which
-- production has ALREADY had applied by the standalone app. Register them without running
-- them; the DDL is already in place and re-running it would fail (duplicate columns,
-- already-renamed columns, an existing record_statuses type).
--
-- The one thing they do that production does not already have is the plate_types deletes in
-- 0003/0004 — production never had those rows, because Section 3 above seeds plate_types
-- from scratch and the retired values were removed from that seed.
INSERT INTO drizzle_migrations (hash, created_at)
SELECT hash, extract(epoch from now())::bigint * 1000
FROM (VALUES
  ('0003_drop_preseq_primer_storage_plate_types'),
  ('0004_drop_legacy_preseq_plate_types'),
  ('0005_add_plasmid_cloned_on_and_plasmidsaurus_order'),
  ('0006_add_ensembl_refseq_ids'),
  ('0007_drop_target_sequence'),
  ('0008_plasmid_field_changes'),
  ('0009_add_record_status'),
  ('0010_add_status_to_snv_lib_gibson_products_view')
) AS m(hash)
ON CONFLICT DO NOTHING;

-- lims-layer: password_reset_tokens migration (applied above in Section 2)
INSERT INTO drizzle_migrations (hash, created_at)
VALUES ('20260508153256_add_password_reset_tokens', extract(epoch from now())::bigint * 1000)
ON CONFLICT DO NOTHING;

-- =============================================================================
COMMIT;
-- =============================================================================
-- Post-migration checklist:
--
-- 1. Verify the migration ran cleanly (no errors, transaction committed).
--
-- 2. Confirm tables are in the right schemas:
--    SELECT schemaname, tablename FROM pg_tables
--    WHERE tablename IN ('users','pre_verified_users','user_groups',
--                        'user_group_memberships','password_reset_tokens',
--                        'plate_types','pcr_types')
--    ORDER BY schemaname, tablename;
--
-- 3. Confirm column renames:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'pcr_experiments' AND column_name IN ('technician','technician_id');
--    -- Should return only 'technician_id'
--
-- 4. Spot-check view output:
--    SELECT COUNT(*) FROM view_plates_with_well_counts;
--    SELECT COUNT(*) FROM view_ha_puc19_gibson_products_with_calcs;
--    SELECT COUNT(*) FROM view_snv_lib_gibson_products;
--    SELECT COUNT(*) FROM view_mixed_preseq_primers;
--    -- and that the recreated Gibson view kept its status column:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'view_snv_lib_gibson_products' AND column_name = 'status';
--
-- 4b. Diff this database's schema against a freshly migrated one — the two are
--    independently hand-maintained and must agree:
--    pg_dump --schema-only <prod-clone> > /tmp/prod.sql
--    pg_dump --schema-only <fresh-migrated> > /tmp/fresh.sql
--    diff /tmp/prod.sql /tmp/fresh.sql
--
-- 5. Deploy the new monorepo app and confirm it starts without attempting to
--    re-run the baseline migrations.
--
-- 6. Update the app's database connection to include 'users' in search_path
--    if needed, e.g.: search_path=public,users
-- =============================================================================
