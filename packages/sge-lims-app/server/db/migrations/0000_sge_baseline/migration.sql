CREATE SCHEMA "users";
--> statement-breakpoint
CREATE TYPE "gene_orientations" AS ENUM('plus', 'minus');--> statement-breakpoint
CREATE TABLE "cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"started_on" timestamp DEFAULT now(),
	"ended_on" timestamp
);
--> statement-breakpoint
CREATE TABLE "external_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar NOT NULL UNIQUE,
	"description" text,
	"custom_index_seq_1" varchar(50),
	"custom_index_seq_2" varchar(50),
	"index_primer_1_id" uuid,
	"index_primer_2_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "external_sample_index_check" CHECK (
    (COALESCE(TRIM("custom_index_seq_1"), '') <> '' AND "index_primer_1_id" IS NULL AND "index_primer_2_id" IS NULL)
    OR
    ("index_primer_1_id" IS NOT NULL AND COALESCE(TRIM("custom_index_seq_1"), '') = '' AND COALESCE(TRIM("custom_index_seq_2"), '') = '')
  )
);
--> statement-breakpoint
CREATE TABLE "extraction_experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"technician_id" uuid,
	"extracted_on" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "extraction_lot_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"experiment_id" uuid NOT NULL,
	"lot_id" uuid NOT NULL,
	"concentration" double precision,
	"volume_used" double precision,
	"usage_on" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "genes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"ncbi_accession" varchar(50) NOT NULL,
	"start_position" integer,
	"end_position" integer,
	"chromosome" varchar(10),
	"orientation" "gene_orientations",
	"name" varchar(255) NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"ncbi_gene_id" integer,
	"gene_type" varchar(50),
	"transcripts_accession" varchar(50),
	"protein_acccession" varchar(50),
	"protein_length" integer,
	"locus_tag" varchar(50),
	"assembly" varchar(50),
	"annotation" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"lot_number" varchar(50) NOT NULL UNIQUE,
	"reagent_id" uuid NOT NULL,
	"in_house" boolean,
	"status" text,
	"concentration" numeric,
	"starting_volume" numeric,
	"remaining_volume" numeric,
	"prepared_on" timestamp,
	"stored_on" timestamp,
	"started_use_on" timestamp,
	"ended_use_on" timestamp,
	"expires_on" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "dna" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"extraction_experiment_id" uuid,
	"pellet_id" uuid UNIQUE,
	"concentration" double precision,
	"volume" double precision,
	"protocol" varchar,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "rna" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"extraction_experiment_id" uuid,
	"pellet_id" uuid UNIQUE,
	"concentration" double precision,
	"volume" double precision,
	"protocol" varchar,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "clonal_ha_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"clonal_ha_id" uuid NOT NULL,
	"target_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clonal_has" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"order_number" varchar(255),
	"ordered_on" timestamp,
	"start" integer,
	"end" integer,
	"quant" double precision,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "ha_pcr_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"ha_cloning_experiment_id" uuid UNIQUE,
	"start_position" integer,
	"stop_position" integer,
	"ha_primer_forward_id" uuid NOT NULL,
	"ha_primer_reverse_id" uuid NOT NULL,
	"wt_hap1_dna_concentration" double precision,
	"temperature_chosen" double precision,
	"performed_on" timestamp,
	"performed_by_id" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "ha_puc19_gibson_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"ha_puc19_pcr_product_id" uuid NOT NULL UNIQUE,
	"puc19_vector_concentration" double precision,
	"puc19_vector_amount" double precision DEFAULT 50,
	"prepped_on" timestamp,
	"prepped_by_id" uuid,
	"quant" double precision,
	"total_reaction_volume" double precision DEFAULT 10,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "ha_puc19_pcr_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"ha_pcr_product_id" uuid NOT NULL UNIQUE,
	"ha_puc19_primer_forward_id" uuid NOT NULL,
	"ha_puc19_primer_reverse_id" uuid NOT NULL,
	"temperature_used" double precision,
	"cleaned_on" timestamp,
	"cleaned_by_id" uuid,
	"quant" double precision,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "sg_rna_oligo_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"sg_rna_oligo_id" uuid NOT NULL,
	"target_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sg_rna_oligos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"sequence" varchar(255),
	"direction" varchar,
	"notes" text,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "sge_oligo_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"sge_oligo_id" uuid NOT NULL,
	"lot_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sge_oligos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"target_id" uuid NOT NULL,
	"sequence" varchar(255),
	"library_type" varchar(100),
	"notes" text,
	CONSTRAINT "sge_oligo_sequence_check" CHECK ("sequence" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "snv_lib_amp_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"snv_lib_cloning_experiment_id" uuid NOT NULL UNIQUE,
	"sge_oligo_id" uuid,
	"amp_primer_forward_id" uuid NOT NULL,
	"amp_primer_reverse_id" uuid NOT NULL,
	"cleaned_on" timestamp,
	"cleaned_by_id" uuid,
	"quant" double precision,
	"start_position" integer,
	"stop_position" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "snv_lib_gibson_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"snv_lib_cloning_experiment_id" uuid NOT NULL UNIQUE,
	"lin_product_vector_amount" double precision DEFAULT 50,
	"gibson_on" timestamp,
	"gibson_by_id" uuid,
	"cleaned_on" timestamp,
	"cleaned_by_id" uuid,
	"transformed_on" timestamp,
	"transformed_by_id" uuid,
	"prepped_on" timestamp,
	"prepped_by_id" uuid,
	"quant" double precision,
	"plasmidsaurus_checked" boolean DEFAULT false,
	"ngs_checked" boolean DEFAULT false,
	"passed_qc" boolean DEFAULT false,
	"benchling_link" text,
	"total_reaction_volume" double precision DEFAULT 10,
	"notes" text,
	CONSTRAINT "benchling_link_check" CHECK ("benchling_link" ~* '^https?://.+$')
);
--> statement-breakpoint
CREATE TABLE "snv_lib_golden_gate_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"snv_lib_cloning_experiment_id" uuid NOT NULL UNIQUE,
	"snv_lib_amp_product_id" uuid NOT NULL UNIQUE,
	"clonal_ha_id" uuid NOT NULL UNIQUE,
	"golden_gate_product_vector_amount" double precision DEFAULT 50,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "snv_lib_lin_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"snv_lib_cloning_experiment_id" uuid NOT NULL UNIQUE,
	"ha_puc19_plasmid_id" uuid NOT NULL,
	"lin_primer_forward_id" uuid NOT NULL,
	"lin_primer_reverse_id" uuid NOT NULL,
	"dpn1_digest_on" timestamp,
	"dpn1_digest_by_id" uuid,
	"gel_extracted_on" timestamp,
	"gel_extracted_by_id" uuid,
	"quant" double precision,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "pcr1_experiment_master_mix_volumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"pcr_experiment_id" uuid NOT NULL UNIQUE,
	"two_x_kapa_hifi_ready_mix" double precision DEFAULT 12.5 NOT NULL,
	"ten_um_forward_primer" double precision DEFAULT 0.75 NOT NULL,
	"ten_um_reverse_primer" double precision DEFAULT 0.75 NOT NULL,
	"ten_x_sybr_green" double precision DEFAULT 0 NOT NULL,
	"dna_amount" double precision DEFAULT 250 NOT NULL,
	"total" double precision DEFAULT 25 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pcr2_experiment_master_mix_volumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"pcr_experiment_id" uuid NOT NULL UNIQUE,
	"two_x_kapa_hifi_ready_mix" double precision DEFAULT 12.5 NOT NULL,
	"ten_um_forward_primer" double precision DEFAULT 0.75 NOT NULL,
	"ten_um_reverse_primer" double precision DEFAULT 0.75 NOT NULL,
	"ten_x_sybr_green" double precision DEFAULT 0 NOT NULL,
	"total" double precision DEFAULT 25 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pcr_experiment_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"pcr_experiment_id" uuid NOT NULL,
	"transfect_target_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pcr_experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"pcr_type" varchar(100) NOT NULL,
	"technician_id" uuid,
	"started_on" timestamp DEFAULT now(),
	"plate_id" uuid,
	"gel_images_link" text,
	"notes" text,
	CONSTRAINT "gel_images_link_check" CHECK ("gel_images_link" ~* '^https?://.+$')
);
--> statement-breakpoint
CREATE TABLE "pellets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) UNIQUE,
	"transfect_target_id" uuid NOT NULL,
	"transfections" varchar(3)[],
	"harvested_on" timestamp NOT NULL,
	"harvest_day" integer NOT NULL,
	"harvested_by_id" uuid,
	"is_current" boolean,
	"is_backup" boolean,
	"d3_confluency" double precision,
	"pct_passaged" double precision,
	"pct_harvested" double precision,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "ha_cloning_experiment_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"ha_cloning_experiment_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	CONSTRAINT "unique_ha_cloning_experiment_target" UNIQUE("ha_cloning_experiment_id","target_id")
);
--> statement-breakpoint
CREATE TABLE "ha_cloning_experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"started_on" timestamp DEFAULT now(),
	"ended_on" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "sg_rna_cloning_experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255),
	"technician_id" uuid,
	"transformed_on" timestamp,
	"plate_id" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "snv_lib_cloning_experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"cloning_strategy" varchar NOT NULL,
	"target_id" uuid NOT NULL,
	"clonal_ha_id" uuid,
	"started_on" timestamp DEFAULT now(),
	"ended_on" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "ha_puc19_plasmids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"ha_puc19_gibson_product_id" uuid NOT NULL UNIQUE,
	"e_coli_stellar_volume" double precision DEFAULT 20,
	"transformed_on" timestamp,
	"transformed_by_id" uuid,
	"colony_picked_on" timestamp,
	"colony_picked_by_id" uuid,
	"prepped_on" timestamp,
	"prepped_by_id" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "sg_rna_plasmid_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"sg_rna_plasmid_id" uuid NOT NULL,
	"target_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sg_rna_plasmids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"volume" double precision,
	"quant" double precision,
	"verification_status" varchar,
	"external_link" text,
	"notes" text,
	CONSTRAINT "external_link_check" CHECK ("external_link" ~* '^https?://.+$')
);
--> statement-breakpoint
CREATE TABLE "snv_lib_plasmids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"volume" double precision,
	"quant" double precision,
	"target_id" uuid NOT NULL,
	"snv_lib_cloning_experiment_id" uuid UNIQUE,
	"plasmidsaurus_verification" boolean DEFAULT false,
	"ngs_verification_status" varchar,
	"external_link" text,
	"notes" text,
	CONSTRAINT "external_link_check" CHECK ("external_link" ~* '^https?://.+$')
);
--> statement-breakpoint
CREATE TABLE "plate_types" (
	"value" varchar(100) NOT NULL,
	"label" varchar(255) NOT NULL,
	"desc" varchar(500),
	CONSTRAINT "plate_types_pkey" PRIMARY KEY ("value")
);
--> statement-breakpoint
INSERT INTO "plate_types" ("value", "label", "desc") VALUES
	('pellet-storage', 'Pellet storage', 'Pellet storage'),
	('lin-primer-storage', 'LIN primer storage', 'Linearization primer storage'),
	('amp-primer-storage', 'AMP primer storage', 'Amplification primer storage'),
	('ha-primer-storage', 'HA primer storage', 'Homology arm primer storage'),
	('ha-puc19-primer-storage', 'HA pUC19 primer storage', 'Homology arm pUC19 arm primer storage'),
	('sg-rna-oligo-storage', 'sgRNA oligo storage', 'sgRNA oligo storage'),
	('sg-rna-oligo', 'sgRNA oligo', 'sgRNA oligo'),
	('sg-rna-plasmid-storage', 'sgRNA plasmid storage', 'sgRNA plasmid storage'),
	('sg-rna-plasmid', 'sgRNA plasmid', 'sgRNA plasmid'),
	('lin-pcr', 'LIN PCR', 'Linearization primer PCR'),
	('amp-pcr', 'AMP PCR', 'Amplification primer PCR'),
	('ha-pcr', 'HA PCR', 'Homology arm primer PCR'),
	('preseq-1', 'PreSeq 1', 'PreSeq 1'),
	('preseq-2', 'PreSeq 2', 'PreSeq 2'),
	('preseq-3', 'PreSeq 3', 'PreSeq 3'),
	('dna-preseq-1', 'DNA PreSeq 1', 'DNA PreSeq 1'),
	('dna-preseq-2', 'DNA PreSeq 2', 'DNA PreSeq 2'),
	('dna-preseq-3', 'DNA PreSeq 3', 'DNA PreSeq 3'),
	('rna-rt-storage', 'RNA RT storage', 'RNA Reverse Transcription storage'),
	('rna-preseq-1', 'RNA PreSeq 1', 'RNA PreSeq 1'),
	('rna-preseq-2', 'RNA PreSeq 2', 'RNA PreSeq 2'),
	('rna-preseq-3', 'RNA PreSeq 3', 'RNA PreSeq 3'),
	('snv-lib-preseq-2', 'SNVlib PreSeq 2', 'SNVlib PreSeq 2'),
	('snv-lib-preseq-3', 'SNVlib PreSeq 3', 'SNVlib PreSeq 3'),
	('seq-index', 'Seq index', 'Sequencing index plate'),
	('clonal-ha', 'Clonal HA plate', 'Clonal HA plate'),
	('dna-preseq-1-primer-storage', 'DNA PreSeq 1 primer storage', 'DNA PreSeq 1 primer storage'),
	('dna-preseq-2-primer-storage', 'DNA PreSeq 2 primer storage', 'DNA PreSeq 2 primer storage'),
	('rna-rt-primer-storage', 'RNA RT primer storage', 'RNA RT primer storage'),
	('rna-preseq-1-primer-storage', 'RNA PreSeq 1 primer storage', 'RNA PreSeq 1 primer storage'),
	('rna-preseq-2-primer-storage', 'RNA PreSeq 2 primer storage', 'RNA PreSeq 2 primer storage'),
	('external-sample-indexing', 'External sample indexing', 'External sample indexing'),
	('ha-pcr-product-storage', 'HA PCR product storage', 'HA PCR product storage'),
	('ha-puc19-pcr-product-storage', 'HA pUC19 PCR product storage', 'HA pUC19 PCR product storage'),
	('ha-puc19-gibson-product-storage', 'HA pUC19 Gibson product storage', 'HA pUC19 Gibson product storage'),
	('ha-puc19-plasmid-storage', 'HA pUC19 plasmid storage', 'HA pUC19 plasmid storage'),
	('snv-lib-amp-product-storage', 'SNVlib AMP product storage', 'SNVlib AMP product storage'),
	('snv-lib-lin-product-storage', 'SNVlib LIN product storage', 'SNVlib LIN product storage'),
	('snv-lib-gibson-product-storage', 'SNVlib Gibson product storage', 'SNVlib Gibson product storage'),
	('snv-lib-plasmid-storage', 'SNVlib plasmid storage', 'SNVlib plasmid storage'),
	('snv-lib-golden-gate-product-storage', 'SNVlib Golden Gate product storage', 'SNVlib Golden Gate product storage');
--> statement-breakpoint
CREATE TABLE "pcr_types" (
	"value" varchar(100) NOT NULL,
	"label" varchar(255) NOT NULL,
	"desc" varchar(500),
	CONSTRAINT "pcr_types_pkey" PRIMARY KEY ("value")
);
--> statement-breakpoint
INSERT INTO "pcr_types" ("value", "label", "desc") VALUES
	('lin-pcr', 'LIN PCR', 'Linearization primer PCR'),
	('amp-pcr', 'AMP PCR', 'Amplification primer PCR'),
	('ha-pcr', 'HA PCR', 'Homology arm primer PCR'),
	('dna-preseq-1', 'DNA PreSeq 1', 'DNA PreSeq 1'),
	('dna-preseq-2', 'DNA PreSeq 2', 'DNA PreSeq 2'),
	('dna-preseq-3', 'DNA PreSeq 3', 'DNA PreSeq 3'),
	('rna-rt', 'RNA RT', 'RNA Reverse Transcription'),
	('rna-preseq-1', 'RNA PreSeq 1', 'RNA PreSeq 1'),
	('rna-preseq-2', 'RNA PreSeq 2', 'RNA PreSeq 2'),
	('rna-preseq-3', 'RNA PreSeq 3', 'RNA PreSeq 3'),
	('snv-lib-preseq-2', 'SNVlib PreSeq 2', 'SNVlib PreSeq 2'),
	('snv-lib-preseq-3', 'SNVlib PreSeq 3', 'SNVlib PreSeq 3');
--> statement-breakpoint
CREATE TABLE "plates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"size_x" smallint DEFAULT 12 NOT NULL,
	"size_y" smallint DEFAULT 8 NOT NULL,
	"plate_type" varchar(100) NOT NULL,
	"discarded" boolean DEFAULT false,
	"processed" boolean DEFAULT false,
	CONSTRAINT "plates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "amplification_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"target_id" uuid,
	"name" varchar(255) NOT NULL,
	"sequence" varchar(255) NOT NULL,
	"sequence_type" varchar,
	"cloning_method" varchar NOT NULL,
	"temperature" smallint,
	"ordered_on" timestamp,
	"archived" boolean,
	"notes" text,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]+$')
);
--> statement-breakpoint
CREATE TABLE "homology_arm_primer_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"homology_arm_primer_id" uuid NOT NULL,
	"target_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homology_arm_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"sequence" varchar(255),
	"sequence_type" varchar,
	"cloning_strategy" varchar,
	"ordered_on" timestamp,
	"archived" boolean,
	"notes" text,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "homology_arm_puc19_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"homology_arm_primer_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL UNIQUE,
	"sequence" varchar(255),
	"ordered_on" timestamp,
	"archived" boolean,
	"notes" text,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "index_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"sequence" varchar(255) NOT NULL,
	"index_sequence" varchar(255) NOT NULL,
	"primer_type" varchar,
	"kit" varchar,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "linearization_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"target_id" uuid,
	"name" varchar(255) NOT NULL UNIQUE,
	"sequence" varchar(255) NOT NULL,
	"sequence_type" varchar,
	"ordered_on" timestamp,
	"archived" boolean,
	"notes" text,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]+$')
);
--> statement-breakpoint
CREATE TABLE "preseq_1_primer_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"preseq_1_primer_id" uuid NOT NULL,
	"target_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preseq_1_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"sequence" varchar(255),
	"sequence_type" varchar,
	"ordered_on" timestamp,
	"archived" boolean,
	"notes" text,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "preseq_2_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"target_id" uuid,
	"name" varchar(255) NOT NULL UNIQUE,
	"sequence" varchar(255),
	"sequence_type" varchar,
	"adapter_sequence" varchar(255),
	"ordered_on" timestamp,
	"archived" boolean,
	"notes" text,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]*$'),
	CONSTRAINT "adapter_sequence_check" CHECK ("adapter_sequence" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "rna_preseq_1_primer_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"rna_preseq_1_primer_id" uuid NOT NULL,
	"target_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rna_preseq_1_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"sequence" varchar(255),
	"sequence_type" varchar,
	"ordered_on" timestamp,
	"archived" boolean,
	"notes" text,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "rna_preseq_2_primer_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"rna_preseq_2_primer_id" uuid NOT NULL,
	"target_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rna_preseq_2_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"sequence" varchar(255),
	"sequence_type" varchar,
	"adapter_sequence" varchar(255),
	"ordered_on" timestamp,
	"archived" boolean,
	"notes" text,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]*$'),
	CONSTRAINT "adapter_sequence_check" CHECK ("adapter_sequence" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "rna_rt_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"gene_id" uuid,
	"name" varchar(255) NOT NULL UNIQUE,
	"sequence" varchar(255),
	"sequence_type" varchar,
	"ordered_on" timestamp,
	"archived" boolean,
	"notes" text,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"started_on" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reagents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"solute_unit" text,
	"volume_unit" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"gene_id" uuid NOT NULL,
	"amplicon_start" integer,
	"amplicon_end" integer,
	"amplicon_sequence" varchar(255),
	"snv_library_start" integer,
	"snv_library_end" integer
);
--> statement-breakpoint
CREATE TABLE "sequencing_run_external_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_name" varchar(255),
	"sequencing_run_id" uuid NOT NULL,
	"external_sample_id" uuid NOT NULL,
	"index_primer_1_id" uuid,
	"index_primer_2_id" uuid,
	"custom_index_seq_1" varchar(50),
	"custom_index_seq_2" varchar(50),
	"source_well_id" uuid,
	"million_reads_required" double precision DEFAULT 5,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "external_sample_primer_check" CHECK (
    ((COALESCE(TRIM("custom_index_seq_1"), '') <> '' OR COALESCE(TRIM("custom_index_seq_2"), '') <> '') AND "index_primer_1_id" IS NULL AND "index_primer_2_id" IS NULL) OR
    ("index_primer_1_id" IS NOT NULL AND "index_primer_2_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "sequencing_run_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_name" varchar(255),
	"sequencing_run_id" uuid NOT NULL,
	"dna_id" uuid,
	"rna_id" uuid,
	"index_primer_1_id" uuid NOT NULL,
	"index_primer_2_id" uuid NOT NULL,
	"source_well_id" uuid,
	"million_reads_required" double precision DEFAULT 5,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "internal_sample_primer_check" CHECK ("index_primer_1_id" IS NOT NULL AND "index_primer_2_id" IS NOT NULL),
	CONSTRAINT "dna_or_rna_check" CHECK (("dna_id" IS NOT NULL AND "rna_id" IS NULL) OR ("rna_id" IS NOT NULL AND "dna_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "sequencing_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"status" varchar DEFAULT 'pending',
	"created_on" timestamp,
	"started_on" timestamp,
	"ended_on" timestamp
);
--> statement-breakpoint
CREATE TABLE "targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"project_id" uuid,
	"region_id" uuid NOT NULL,
	"edit_start" integer,
	"edit_stop" integer,
	"amp_start" integer,
	"amp_stop" integer,
	"cigar" varchar(50),
	"skip_positions" integer[],
	"fixed_edits" varchar(255)[],
	"sequence" text,
	CONSTRAINT "sequence_check" CHECK ("sequence" ~* '^[actg]+$')
);
--> statement-breakpoint
CREATE TABLE "transfect_experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"cycle_id" uuid NOT NULL UNIQUE,
	"technician_id" uuid,
	"started_on" timestamp DEFAULT now() NOT NULL,
	"transfection_count" integer,
	"replicates_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfect_lot_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"experiment_id" uuid NOT NULL,
	"lot_id" uuid NOT NULL,
	"concentration" double precision,
	"volume_used" double precision,
	"usage_on" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transfect_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"experiment_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"snv_library_conc" double precision,
	"snv_library_quantity" double precision DEFAULT 5,
	"snv_lib_plasmid_id" uuid,
	"sg_rna_conc" double precision,
	"sg_rna_quantity" double precision DEFAULT 10,
	"sg_rna_plasmid_id" uuid,
	"sg_rna_neg_control" varchar(255),
	"hprt1_sg_rna_conc" double precision,
	"xfect_buffer" double precision,
	"xfect_polymer_per_transfect" double precision,
	"transfection_count" integer NOT NULL,
	"negative_control" boolean,
	"notes" text,
	CONSTRAINT "unique_transfect_experiment_target_count" UNIQUE("experiment_id","target_id","transfection_count")
);
--> statement-breakpoint
CREATE TABLE "well_content_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"well_content_id" uuid NOT NULL,
	"source_well_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "unique_well_content_id_source_well_id" UNIQUE("well_content_id","source_well_id")
);
--> statement-breakpoint
CREATE TABLE "well_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"well_id" uuid NOT NULL,
	"wellable_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wellables" (
	"id" uuid PRIMARY KEY,
	"table_name" varchar NOT NULL,
	CONSTRAINT "wellable_table_name" CHECK ("table_name" IN (
      'amplification_primers',
      'linearization_primers',
      'homology_arm_primers',
      'homology_arm_puc19_primers',
      'preseq_1_primers',
      'preseq_2_primers',
      'rna_rt_primers',
      'rna_preseq_1_primers',
      'rna_preseq_2_primers',
      'index_primers',
      'dna',
      'rna',
      'pellets',
      'sg_rna_plasmids',
      'snv_lib_plasmids',
      'sg_rna_oligos',
      'external_samples',
      'ha_pcr_products',
      'ha_puc19_pcr_products',
      'ha_puc19_gibson_products',
      'ha_puc19_plasmids',
      'snv_lib_amp_products',
      'snv_lib_lin_products',
      'snv_lib_gibson_products',
      'snv_lib_clonal_dna_products',
      'snv_lib_golden_gate_products',
      'clonal_has'
    ))
);
--> statement-breakpoint
CREATE TABLE "wells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"plate_id" uuid NOT NULL,
	"x" smallint NOT NULL,
	"y" smallint NOT NULL,
	CONSTRAINT "unique_plate_coord" UNIQUE("plate_id","x","y")
);
--> statement-breakpoint
CREATE TABLE "users"."password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users"."pre_verified_users" (
	"email" text NOT NULL CONSTRAINT "pre_verified_users_email_unique" UNIQUE
);
--> statement-breakpoint
CREATE TABLE "users"."user_group_memberships" (
	"user_id" uuid,
	"user_group_id" integer,
	CONSTRAINT "user_group_memberships_pkey" PRIMARY KEY("user_id","user_group_id")
);
--> statement-breakpoint
CREATE TABLE "users"."user_groups" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users"."user_groups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"email" text NOT NULL CONSTRAINT "users_email_unique" UNIQUE,
	"is_admin" boolean DEFAULT false NOT NULL,
	"password" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ncbi_accession_idx" ON "genes" ("ncbi_accession");--> statement-breakpoint
CREATE INDEX "symbol_idx" ON "genes" ("symbol");--> statement-breakpoint
CREATE INDEX "gene_type_idx" ON "genes" ("gene_type");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_clonal_ha_target" ON "clonal_ha_targets" ("clonal_ha_id","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_sg_rna_oligo_target" ON "sg_rna_oligo_targets" ("sg_rna_oligo_id","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_sge_oligo_lot" ON "sge_oligo_lots" ("sge_oligo_id","lot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_amp_primer_target_seq_type_active" ON "amplification_primers" ("target_id","sequence_type") WHERE archived IS NOT TRUE;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_ha_primer_target" ON "homology_arm_primer_targets" ("homology_arm_primer_id","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_ha_puc19_primer_active" ON "homology_arm_puc19_primers" ("homology_arm_primer_id") WHERE archived IS NOT TRUE;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_lin_primer_target_seq_type_active" ON "linearization_primers" ("target_id","sequence_type") WHERE archived IS NOT TRUE;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_preseq1_primer_target" ON "preseq_1_primer_targets" ("preseq_1_primer_id","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_preseq2_primer_target_seq_type_active" ON "preseq_2_primers" ("target_id","sequence_type") WHERE archived IS NOT TRUE;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_rna_preseq1_primer_target" ON "rna_preseq_1_primer_targets" ("rna_preseq_1_primer_id","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_rna_preseq2_primer_target" ON "rna_preseq_2_primer_targets" ("rna_preseq_2_primer_id","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_rna_rt_primer_gene_seq_type_active" ON "rna_rt_primers" ("gene_id","sequence_type") WHERE archived IS NOT TRUE;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_region_name_gene_id" ON "regions" (lower(trim("name")),"gene_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_custom_index_seqs_per_sequencing_run" ON "sequencing_run_external_samples" ("sequencing_run_id",least("custom_index_seq_1", "custom_index_seq_2"),greatest("custom_index_seq_1", "custom_index_seq_2"));--> statement-breakpoint
CREATE UNIQUE INDEX "unique_index_primers_per_ext_sequencing_run" ON "sequencing_run_external_samples" ("sequencing_run_id",least("index_primer_1_id", "index_primer_2_id"),greatest("index_primer_1_id", "index_primer_2_id")) WHERE "index_primer_1_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_index_primers_per_sequencing_run" ON "sequencing_run_samples" ("sequencing_run_id",least("index_primer_1_id", "index_primer_2_id"),greatest("index_primer_1_id", "index_primer_2_id"));--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "users"."password_reset_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "users"."password_reset_tokens" ("user_id");--> statement-breakpoint
ALTER TABLE "external_samples" ADD CONSTRAINT "external_samples_index_primer_1_id_index_primers_id_fkey" FOREIGN KEY ("index_primer_1_id") REFERENCES "index_primers"("id");--> statement-breakpoint
ALTER TABLE "external_samples" ADD CONSTRAINT "external_samples_index_primer_2_id_index_primers_id_fkey" FOREIGN KEY ("index_primer_2_id") REFERENCES "index_primers"("id");--> statement-breakpoint
ALTER TABLE "external_samples" ADD CONSTRAINT "external_samples_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "extraction_experiments" ADD CONSTRAINT "extraction_experiments_technician_id_users_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "extraction_lot_usage" ADD CONSTRAINT "extraction_lot_usage_8HCDWIuf3kzm_fkey" FOREIGN KEY ("experiment_id") REFERENCES "extraction_experiments"("id");--> statement-breakpoint
ALTER TABLE "extraction_lot_usage" ADD CONSTRAINT "extraction_lot_usage_lot_id_lots_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id");--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_reagent_id_reagents_id_fkey" FOREIGN KEY ("reagent_id") REFERENCES "reagents"("id");--> statement-breakpoint
ALTER TABLE "dna" ADD CONSTRAINT "dna_extraction_experiment_id_extraction_experiments_id_fkey" FOREIGN KEY ("extraction_experiment_id") REFERENCES "extraction_experiments"("id");--> statement-breakpoint
ALTER TABLE "dna" ADD CONSTRAINT "dna_pellet_id_pellets_id_fkey" FOREIGN KEY ("pellet_id") REFERENCES "pellets"("id");--> statement-breakpoint
ALTER TABLE "rna" ADD CONSTRAINT "rna_extraction_experiment_id_extraction_experiments_id_fkey" FOREIGN KEY ("extraction_experiment_id") REFERENCES "extraction_experiments"("id");--> statement-breakpoint
ALTER TABLE "rna" ADD CONSTRAINT "rna_pellet_id_pellets_id_fkey" FOREIGN KEY ("pellet_id") REFERENCES "pellets"("id");--> statement-breakpoint
ALTER TABLE "clonal_ha_targets" ADD CONSTRAINT "clonal_ha_targets_clonal_ha_id_clonal_has_id_fkey" FOREIGN KEY ("clonal_ha_id") REFERENCES "clonal_has"("id");--> statement-breakpoint
ALTER TABLE "clonal_ha_targets" ADD CONSTRAINT "clonal_ha_targets_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "ha_pcr_products" ADD CONSTRAINT "ha_pcr_products_N0BQMrHhaLJR_fkey" FOREIGN KEY ("ha_cloning_experiment_id") REFERENCES "ha_cloning_experiments"("id");--> statement-breakpoint
ALTER TABLE "ha_pcr_products" ADD CONSTRAINT "ha_pcr_products_LMGds6CBkKLH_fkey" FOREIGN KEY ("ha_primer_forward_id") REFERENCES "homology_arm_primers"("id");--> statement-breakpoint
ALTER TABLE "ha_pcr_products" ADD CONSTRAINT "ha_pcr_products_GdUO28Z6hmPm_fkey" FOREIGN KEY ("ha_primer_reverse_id") REFERENCES "homology_arm_primers"("id");--> statement-breakpoint
ALTER TABLE "ha_pcr_products" ADD CONSTRAINT "ha_pcr_products_performed_by_id_users_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "ha_puc19_gibson_products" ADD CONSTRAINT "ha_puc19_gibson_products_HfYxnSQffpfX_fkey" FOREIGN KEY ("ha_puc19_pcr_product_id") REFERENCES "ha_puc19_pcr_products"("id");--> statement-breakpoint
ALTER TABLE "ha_puc19_gibson_products" ADD CONSTRAINT "ha_puc19_gibson_products_prepped_by_id_users_id_fkey" FOREIGN KEY ("prepped_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "ha_puc19_pcr_products" ADD CONSTRAINT "ha_puc19_pcr_products_ha_pcr_product_id_ha_pcr_products_id_fkey" FOREIGN KEY ("ha_pcr_product_id") REFERENCES "ha_pcr_products"("id");--> statement-breakpoint
ALTER TABLE "ha_puc19_pcr_products" ADD CONSTRAINT "ha_puc19_pcr_products_Qsxc70jQGEpS_fkey" FOREIGN KEY ("ha_puc19_primer_forward_id") REFERENCES "homology_arm_puc19_primers"("id");--> statement-breakpoint
ALTER TABLE "ha_puc19_pcr_products" ADD CONSTRAINT "ha_puc19_pcr_products_FmDGwBbTWbQH_fkey" FOREIGN KEY ("ha_puc19_primer_reverse_id") REFERENCES "homology_arm_puc19_primers"("id");--> statement-breakpoint
ALTER TABLE "ha_puc19_pcr_products" ADD CONSTRAINT "ha_puc19_pcr_products_cleaned_by_id_users_id_fkey" FOREIGN KEY ("cleaned_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "sg_rna_oligo_targets" ADD CONSTRAINT "sg_rna_oligo_targets_sg_rna_oligo_id_sg_rna_oligos_id_fkey" FOREIGN KEY ("sg_rna_oligo_id") REFERENCES "sg_rna_oligos"("id");--> statement-breakpoint
ALTER TABLE "sg_rna_oligo_targets" ADD CONSTRAINT "sg_rna_oligo_targets_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "sge_oligo_lots" ADD CONSTRAINT "sge_oligo_lots_sge_oligo_id_sge_oligos_id_fkey" FOREIGN KEY ("sge_oligo_id") REFERENCES "sge_oligos"("id");--> statement-breakpoint
ALTER TABLE "sge_oligo_lots" ADD CONSTRAINT "sge_oligo_lots_lot_id_lots_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id");--> statement-breakpoint
ALTER TABLE "sge_oligos" ADD CONSTRAINT "sge_oligos_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_amp_products" ADD CONSTRAINT "snv_lib_amp_products_8RYD4Ep3yKaM_fkey" FOREIGN KEY ("snv_lib_cloning_experiment_id") REFERENCES "snv_lib_cloning_experiments"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_amp_products" ADD CONSTRAINT "snv_lib_amp_products_sge_oligo_id_sge_oligos_id_fkey" FOREIGN KEY ("sge_oligo_id") REFERENCES "sge_oligos"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_amp_products" ADD CONSTRAINT "snv_lib_amp_products_ObXzeXvAlbhg_fkey" FOREIGN KEY ("amp_primer_forward_id") REFERENCES "amplification_primers"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_amp_products" ADD CONSTRAINT "snv_lib_amp_products_F4ts8LLSh0j3_fkey" FOREIGN KEY ("amp_primer_reverse_id") REFERENCES "amplification_primers"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_amp_products" ADD CONSTRAINT "snv_lib_amp_products_cleaned_by_id_users_id_fkey" FOREIGN KEY ("cleaned_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_gibson_products" ADD CONSTRAINT "snv_lib_gibson_products_Hp10HodvisRS_fkey" FOREIGN KEY ("snv_lib_cloning_experiment_id") REFERENCES "snv_lib_cloning_experiments"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_gibson_products" ADD CONSTRAINT "snv_lib_gibson_products_gibson_by_id_users_id_fkey" FOREIGN KEY ("gibson_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_gibson_products" ADD CONSTRAINT "snv_lib_gibson_products_cleaned_by_id_users_id_fkey" FOREIGN KEY ("cleaned_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_gibson_products" ADD CONSTRAINT "snv_lib_gibson_products_transformed_by_id_users_id_fkey" FOREIGN KEY ("transformed_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_gibson_products" ADD CONSTRAINT "snv_lib_gibson_products_prepped_by_id_users_id_fkey" FOREIGN KEY ("prepped_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_golden_gate_products" ADD CONSTRAINT "snv_lib_golden_gate_products_Tdqj6QHIh5XZ_fkey" FOREIGN KEY ("snv_lib_cloning_experiment_id") REFERENCES "snv_lib_cloning_experiments"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_golden_gate_products" ADD CONSTRAINT "snv_lib_golden_gate_products_dNZMly2964Oj_fkey" FOREIGN KEY ("snv_lib_amp_product_id") REFERENCES "snv_lib_amp_products"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_golden_gate_products" ADD CONSTRAINT "snv_lib_golden_gate_products_clonal_ha_id_clonal_has_id_fkey" FOREIGN KEY ("clonal_ha_id") REFERENCES "clonal_has"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_lin_products" ADD CONSTRAINT "snv_lib_lin_products_8RxRMMXflqSl_fkey" FOREIGN KEY ("snv_lib_cloning_experiment_id") REFERENCES "snv_lib_cloning_experiments"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_lin_products" ADD CONSTRAINT "snv_lib_lin_products_sVGow5errdd1_fkey" FOREIGN KEY ("ha_puc19_plasmid_id") REFERENCES "ha_puc19_plasmids"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_lin_products" ADD CONSTRAINT "snv_lib_lin_products_rYuZvFrbITmR_fkey" FOREIGN KEY ("lin_primer_forward_id") REFERENCES "linearization_primers"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_lin_products" ADD CONSTRAINT "snv_lib_lin_products_iR0SptHtEIoE_fkey" FOREIGN KEY ("lin_primer_reverse_id") REFERENCES "linearization_primers"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_lin_products" ADD CONSTRAINT "snv_lib_lin_products_dpn1_digest_by_id_users_id_fkey" FOREIGN KEY ("dpn1_digest_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_lin_products" ADD CONSTRAINT "snv_lib_lin_products_gel_extracted_by_id_users_id_fkey" FOREIGN KEY ("gel_extracted_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "pcr1_experiment_master_mix_volumes" ADD CONSTRAINT "pcr1_experiment_master_mix_volumes_DocaxpxIhudf_fkey" FOREIGN KEY ("pcr_experiment_id") REFERENCES "pcr_experiments"("id");--> statement-breakpoint
ALTER TABLE "pcr2_experiment_master_mix_volumes" ADD CONSTRAINT "pcr2_experiment_master_mix_volumes_DocaxpxIi6Wu_fkey" FOREIGN KEY ("pcr_experiment_id") REFERENCES "pcr_experiments"("id");--> statement-breakpoint
ALTER TABLE "pcr_experiment_targets" ADD CONSTRAINT "pcr_experiment_targets_NagHZxYm9n0L_fkey" FOREIGN KEY ("pcr_experiment_id") REFERENCES "pcr_experiments"("id");--> statement-breakpoint
ALTER TABLE "pcr_experiment_targets" ADD CONSTRAINT "pcr_experiment_targets_q3jHzAF42o0V_fkey" FOREIGN KEY ("transfect_target_id") REFERENCES "transfect_targets"("id");--> statement-breakpoint
ALTER TABLE "pcr_experiments" ADD CONSTRAINT "pcr_experiments_technician_id_users_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "pcr_experiments" ADD CONSTRAINT "pcr_experiments_plate_id_plates_id_fkey" FOREIGN KEY ("plate_id") REFERENCES "plates"("id");--> statement-breakpoint
ALTER TABLE "pellets" ADD CONSTRAINT "pellets_transfect_target_id_transfect_targets_id_fkey" FOREIGN KEY ("transfect_target_id") REFERENCES "transfect_targets"("id");--> statement-breakpoint
ALTER TABLE "pellets" ADD CONSTRAINT "pellets_harvested_by_id_users_id_fkey" FOREIGN KEY ("harvested_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "ha_cloning_experiment_targets" ADD CONSTRAINT "ha_cloning_experiment_targets_xHXrLqF270zA_fkey" FOREIGN KEY ("ha_cloning_experiment_id") REFERENCES "ha_cloning_experiments"("id");--> statement-breakpoint
ALTER TABLE "ha_cloning_experiment_targets" ADD CONSTRAINT "ha_cloning_experiment_targets_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "sg_rna_cloning_experiments" ADD CONSTRAINT "sg_rna_cloning_experiments_technician_id_users_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "sg_rna_cloning_experiments" ADD CONSTRAINT "sg_rna_cloning_experiments_plate_id_plates_id_fkey" FOREIGN KEY ("plate_id") REFERENCES "plates"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_cloning_experiments" ADD CONSTRAINT "snv_lib_cloning_experiments_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_cloning_experiments" ADD CONSTRAINT "snv_lib_cloning_experiments_clonal_ha_id_clonal_has_id_fkey" FOREIGN KEY ("clonal_ha_id") REFERENCES "clonal_has"("id");--> statement-breakpoint
ALTER TABLE "ha_puc19_plasmids" ADD CONSTRAINT "ha_puc19_plasmids_06d9giLZpKr9_fkey" FOREIGN KEY ("ha_puc19_gibson_product_id") REFERENCES "ha_puc19_gibson_products"("id");--> statement-breakpoint
ALTER TABLE "ha_puc19_plasmids" ADD CONSTRAINT "ha_puc19_plasmids_transformed_by_id_users_id_fkey" FOREIGN KEY ("transformed_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "ha_puc19_plasmids" ADD CONSTRAINT "ha_puc19_plasmids_colony_picked_by_id_users_id_fkey" FOREIGN KEY ("colony_picked_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "ha_puc19_plasmids" ADD CONSTRAINT "ha_puc19_plasmids_prepped_by_id_users_id_fkey" FOREIGN KEY ("prepped_by_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "sg_rna_plasmid_targets" ADD CONSTRAINT "sg_rna_plasmid_targets_ldQRkYAm8W5z_fkey" FOREIGN KEY ("sg_rna_plasmid_id") REFERENCES "sg_rna_plasmids"("id");--> statement-breakpoint
ALTER TABLE "sg_rna_plasmid_targets" ADD CONSTRAINT "sg_rna_plasmid_targets_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_plasmids" ADD CONSTRAINT "snv_lib_plasmids_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "snv_lib_plasmids" ADD CONSTRAINT "snv_lib_plasmids_hdUPTETCsqgk_fkey" FOREIGN KEY ("snv_lib_cloning_experiment_id") REFERENCES "snv_lib_cloning_experiments"("id");--> statement-breakpoint
ALTER TABLE "amplification_primers" ADD CONSTRAINT "amplification_primers_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "homology_arm_primer_targets" ADD CONSTRAINT "homology_arm_primer_targets_0olCTRKQypRL_fkey" FOREIGN KEY ("homology_arm_primer_id") REFERENCES "homology_arm_primers"("id");--> statement-breakpoint
ALTER TABLE "homology_arm_primer_targets" ADD CONSTRAINT "homology_arm_primer_targets_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "homology_arm_puc19_primers" ADD CONSTRAINT "homology_arm_puc19_primers_Irxl8vgjpHBu_fkey" FOREIGN KEY ("homology_arm_primer_id") REFERENCES "homology_arm_primers"("id");--> statement-breakpoint
ALTER TABLE "linearization_primers" ADD CONSTRAINT "linearization_primers_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "preseq_1_primer_targets" ADD CONSTRAINT "preseq_1_primer_targets_FeaMgU9LWtcm_fkey" FOREIGN KEY ("preseq_1_primer_id") REFERENCES "preseq_1_primers"("id");--> statement-breakpoint
ALTER TABLE "preseq_1_primer_targets" ADD CONSTRAINT "preseq_1_primer_targets_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "preseq_2_primers" ADD CONSTRAINT "preseq_2_primers_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "rna_preseq_1_primer_targets" ADD CONSTRAINT "rna_preseq_1_primer_targets_bJkBosgu6Foq_fkey" FOREIGN KEY ("rna_preseq_1_primer_id") REFERENCES "rna_preseq_1_primers"("id");--> statement-breakpoint
ALTER TABLE "rna_preseq_1_primer_targets" ADD CONSTRAINT "rna_preseq_1_primer_targets_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "rna_preseq_2_primer_targets" ADD CONSTRAINT "rna_preseq_2_primer_targets_WfVxdVLJOTPr_fkey" FOREIGN KEY ("rna_preseq_2_primer_id") REFERENCES "rna_preseq_2_primers"("id");--> statement-breakpoint
ALTER TABLE "rna_preseq_2_primer_targets" ADD CONSTRAINT "rna_preseq_2_primer_targets_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "rna_rt_primers" ADD CONSTRAINT "rna_rt_primers_gene_id_genes_id_fkey" FOREIGN KEY ("gene_id") REFERENCES "genes"("id");--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_gene_id_genes_id_fkey" FOREIGN KEY ("gene_id") REFERENCES "genes"("id");--> statement-breakpoint
ALTER TABLE "sequencing_run_external_samples" ADD CONSTRAINT "sequencing_run_external_samples_y3v2Z0fj2e5x_fkey" FOREIGN KEY ("sequencing_run_id") REFERENCES "sequencing_runs"("id");--> statement-breakpoint
ALTER TABLE "sequencing_run_external_samples" ADD CONSTRAINT "sequencing_run_external_samples_hnGaVqbUJRZR_fkey" FOREIGN KEY ("external_sample_id") REFERENCES "external_samples"("id");--> statement-breakpoint
ALTER TABLE "sequencing_run_external_samples" ADD CONSTRAINT "sequencing_run_external_samples_4qpSIe4mrY7p_fkey" FOREIGN KEY ("index_primer_1_id") REFERENCES "index_primers"("id");--> statement-breakpoint
ALTER TABLE "sequencing_run_external_samples" ADD CONSTRAINT "sequencing_run_external_samples_gYB9O5iExL2o_fkey" FOREIGN KEY ("index_primer_2_id") REFERENCES "index_primers"("id");--> statement-breakpoint
ALTER TABLE "sequencing_run_external_samples" ADD CONSTRAINT "sequencing_run_external_samples_source_well_id_wells_id_fkey" FOREIGN KEY ("source_well_id") REFERENCES "wells"("id");--> statement-breakpoint
ALTER TABLE "sequencing_run_samples" ADD CONSTRAINT "sequencing_run_samples_KGnprwXxhNEJ_fkey" FOREIGN KEY ("sequencing_run_id") REFERENCES "sequencing_runs"("id");--> statement-breakpoint
ALTER TABLE "sequencing_run_samples" ADD CONSTRAINT "sequencing_run_samples_dna_id_dna_id_fkey" FOREIGN KEY ("dna_id") REFERENCES "dna"("id");--> statement-breakpoint
ALTER TABLE "sequencing_run_samples" ADD CONSTRAINT "sequencing_run_samples_rna_id_rna_id_fkey" FOREIGN KEY ("rna_id") REFERENCES "rna"("id");--> statement-breakpoint
ALTER TABLE "sequencing_run_samples" ADD CONSTRAINT "sequencing_run_samples_index_primer_1_id_index_primers_id_fkey" FOREIGN KEY ("index_primer_1_id") REFERENCES "index_primers"("id");--> statement-breakpoint
ALTER TABLE "sequencing_run_samples" ADD CONSTRAINT "sequencing_run_samples_index_primer_2_id_index_primers_id_fkey" FOREIGN KEY ("index_primer_2_id") REFERENCES "index_primers"("id");--> statement-breakpoint
ALTER TABLE "sequencing_run_samples" ADD CONSTRAINT "sequencing_run_samples_source_well_id_wells_id_fkey" FOREIGN KEY ("source_well_id") REFERENCES "wells"("id");--> statement-breakpoint
ALTER TABLE "targets" ADD CONSTRAINT "targets_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "targets" ADD CONSTRAINT "targets_region_id_regions_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id");--> statement-breakpoint
ALTER TABLE "transfect_experiments" ADD CONSTRAINT "transfect_experiments_cycle_id_cycles_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id");--> statement-breakpoint
ALTER TABLE "transfect_experiments" ADD CONSTRAINT "transfect_experiments_technician_id_users_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "transfect_lot_usage" ADD CONSTRAINT "transfect_lot_usage_experiment_id_transfect_experiments_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "transfect_experiments"("id");--> statement-breakpoint
ALTER TABLE "transfect_lot_usage" ADD CONSTRAINT "transfect_lot_usage_lot_id_lots_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id");--> statement-breakpoint
ALTER TABLE "transfect_targets" ADD CONSTRAINT "transfect_targets_experiment_id_transfect_experiments_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "transfect_experiments"("id");--> statement-breakpoint
ALTER TABLE "transfect_targets" ADD CONSTRAINT "transfect_targets_target_id_targets_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id");--> statement-breakpoint
ALTER TABLE "transfect_targets" ADD CONSTRAINT "transfect_targets_snv_lib_plasmid_id_snv_lib_plasmids_id_fkey" FOREIGN KEY ("snv_lib_plasmid_id") REFERENCES "snv_lib_plasmids"("id");--> statement-breakpoint
ALTER TABLE "transfect_targets" ADD CONSTRAINT "transfect_targets_sg_rna_plasmid_id_sg_rna_plasmids_id_fkey" FOREIGN KEY ("sg_rna_plasmid_id") REFERENCES "sg_rna_plasmids"("id");--> statement-breakpoint
ALTER TABLE "well_content_sources" ADD CONSTRAINT "well_content_sources_well_content_id_well_contents_id_fkey" FOREIGN KEY ("well_content_id") REFERENCES "well_contents"("id");--> statement-breakpoint
ALTER TABLE "well_content_sources" ADD CONSTRAINT "well_content_sources_source_well_id_wells_id_fkey" FOREIGN KEY ("source_well_id") REFERENCES "wells"("id");--> statement-breakpoint
ALTER TABLE "well_content_sources" ADD CONSTRAINT "well_content_sources_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "well_contents" ADD CONSTRAINT "well_contents_well_id_wells_id_fkey" FOREIGN KEY ("well_id") REFERENCES "wells"("id");--> statement-breakpoint
ALTER TABLE "well_contents" ADD CONSTRAINT "well_contents_wellable_id_wellables_id_fkey" FOREIGN KEY ("wellable_id") REFERENCES "wellables"("id");--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "wells_plate_id_plates_id_fkey" FOREIGN KEY ("plate_id") REFERENCES "plates"("id");--> statement-breakpoint
ALTER TABLE "plates" ADD CONSTRAINT "plates_plate_type_plate_types_value_fkey" FOREIGN KEY ("plate_type") REFERENCES "plate_types"("value");--> statement-breakpoint
ALTER TABLE "pcr_experiments" ADD CONSTRAINT "pcr_experiments_pcr_type_pcr_types_value_fkey" FOREIGN KEY ("pcr_type") REFERENCES "pcr_types"("value");--> statement-breakpoint
ALTER TABLE "users"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "users"."user_group_memberships" ADD CONSTRAINT "user_group_memberships_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "users"."user_group_memberships" ADD CONSTRAINT "user_group_memberships_user_group_id_user_groups_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "users"."user_groups"("id");--> statement-breakpoint
CREATE VIEW "view_ha_puc19_gibson_products_with_calcs" AS (SELECT
        *,
        CASE WHEN two_x_nebuilder_reagent_volume IS NOT NULL AND insert_volume IS NOT NULL AND vector_volume IS NOT NULL
            THEN two_x_nebuilder_reagent_volume - (insert_volume + vector_volume)
            ELSE NULL
        END AS h2o_volume
    FROM (SELECT
        "ha_puc19_gibson_products"."id" AS id,
        "ha_puc19_gibson_products"."name" AS name,
        "ha_puc19_pcr_products"."id" AS ha_puc19_pcr_product_id,
        "ha_puc19_pcr_products"."name" AS ha_puc19_pcr_product_name,
        "ha_puc19_gibson_products"."puc19_vector_amount" AS puc19_vector_amount,
        "ha_puc19_gibson_products"."puc19_vector_concentration" AS puc19_vector_concentration,
        "ha_puc19_gibson_products"."quant" AS quant,
        "ha_puc19_gibson_products"."prepped_on" AS prepped_on,
        "ha_puc19_gibson_products"."total_reaction_volume" AS total_reaction_volume,
        CASE WHEN "ha_puc19_gibson_products"."total_reaction_volume" IS NOT NULL THEN "ha_puc19_gibson_products"."total_reaction_volume"/2 ELSE NULL END AS two_x_nebuilder_reagent_volume,
        "users"."users"."name" AS prepped_by_name,
        "ha_cloning_experiments"."id" AS ha_cloning_experiment_id,
        "ha_cloning_experiments"."name" AS ha_cloning_experiment_name,
        t_ha_pcr_products.id AS ha_pcr_product_id,
        t_ha_pcr_products.name AS ha_pcr_product_name,
        t_ha_pcr_products.ha_pcr_product_length AS ha_pcr_product_length,
        CASE
            WHEN "ha_puc19_gibson_products"."puc19_vector_amount" IS NOT NULL AND t_ha_pcr_products.ha_pcr_product_length IS NOT NULL
                THEN t_ha_pcr_products.ha_pcr_product_length / 2649.0 * "ha_puc19_gibson_products"."puc19_vector_amount" * 2.0
            ELSE NULL
        END AS insert_dna_mass,
        CASE
            WHEN "ha_puc19_gibson_products"."puc19_vector_amount" IS NOT NULL AND t_ha_pcr_products.ha_pcr_product_length IS NOT NULL AND "ha_puc19_gibson_products"."quant" IS NOT NULL
                THEN t_ha_pcr_products.ha_pcr_product_length / 2649.0 * "ha_puc19_gibson_products"."puc19_vector_amount" * 2.0 / "ha_puc19_gibson_products"."quant"
            ELSE NULL
        END AS insert_volume,
        CASE
            WHEN "ha_puc19_gibson_products"."puc19_vector_amount" IS NOT NULL AND "ha_puc19_gibson_products"."puc19_vector_concentration" IS NOT NULL
                THEN "ha_puc19_gibson_products"."puc19_vector_amount" / "ha_puc19_gibson_products"."puc19_vector_concentration"
            ELSE NULL
        END AS vector_volume,
        CASE
            WHEN "ha_puc19_gibson_products"."puc19_vector_amount" IS NOT NULL AND t_ha_pcr_products.ha_pcr_product_length IS NOT NULL AND "ha_puc19_gibson_products"."quant" IS NOT NULL AND "ha_puc19_gibson_products"."puc19_vector_concentration" IS NOT NULL
                THEN (t_ha_pcr_products.ha_pcr_product_length / 2649.0 * "ha_puc19_gibson_products"."puc19_vector_amount" * 2.0 / "ha_puc19_gibson_products"."quant") + ("ha_puc19_gibson_products"."puc19_vector_amount" / "ha_puc19_gibson_products"."puc19_vector_concentration")
            ELSE NULL
        END AS total_volume,
        "ha_puc19_gibson_products"."notes" AS notes
    FROM "ha_puc19_gibson_products"
        JOIN "ha_puc19_pcr_products" ON "ha_puc19_pcr_products"."id" = "ha_puc19_gibson_products"."ha_puc19_pcr_product_id"
        JOIN (
            SELECT
                "ha_pcr_products"."id" AS id,
                "ha_pcr_products"."name" AS name,
                "ha_pcr_products"."ha_cloning_experiment_id" AS ha_cloning_experiment_id,
                CASE
                    WHEN "ha_pcr_products"."start_position" IS NOT NULL AND "ha_pcr_products"."stop_position" IS NOT NULL
                        THEN "ha_pcr_products"."stop_position" - "ha_pcr_products"."start_position" + 1
                    ELSE NULL
                END AS ha_pcr_product_length
            FROM  "ha_pcr_products"
        ) AS t_ha_pcr_products ON t_ha_pcr_products.id = "ha_puc19_pcr_products"."ha_pcr_product_id"
        JOIN "ha_cloning_experiments" ON "ha_cloning_experiments"."id" = t_ha_pcr_products.ha_cloning_experiment_id
        LEFT JOIN "users"."users" ON "users"."users"."id" = "ha_puc19_gibson_products"."prepped_by_id") t1);--> statement-breakpoint
CREATE VIEW "view_plates_with_well_counts" AS (select    "plates"."id",
    "plates"."name",
    "plates"."size_x",
    "plates"."size_y",
    "plates"."plate_type",
    "plates"."discarded",
    "plates"."processed",
    "cycles"."id" as cycle_id,
    "cycles"."name" as cycle_name,
    string_agg(distinct "targets"."name", ',') as targets,
    "plate_types"."label" as plate_type_label,
    count(distinct("wells"."id")) as wells_count,
    count(distinct("well_contents"."well_id")) as wells_with_content_count,
    count(distinct("well_content_sources"."source_well_id")) as wells_processed_count,
    "sg_rna_cloning_experiments"."id" as sg_rna_cloning_experiment_id,
    "pcr_experiments"."id" as pcr_experiment_id
    from "plates"
    join "wells" on "plates"."id" = "wells"."plate_id"
    left join "plate_types" on "plate_types"."value" = "plates"."plate_type"
    left join "well_content_sources" on "wells"."id" = "well_content_sources"."source_well_id"
    left join "well_contents" on "wells"."id" = "well_contents"."well_id"
    left join "pcr_experiments" on "plates"."id" = "pcr_experiments"."plate_id"
    left join "pcr_experiment_targets" on "pcr_experiments"."id" = "pcr_experiment_targets"."pcr_experiment_id"
    left join "transfect_targets" on "pcr_experiment_targets"."transfect_target_id" = "transfect_targets"."id"
    left join "targets" on "targets"."id" = "transfect_targets"."target_id"
    left join "transfect_experiments" on "transfect_targets"."experiment_id" = "transfect_experiments"."id"
    left join "cycles" on "transfect_experiments"."cycle_id" = "cycles"."id"
    left join "sg_rna_cloning_experiments" on "plates"."id" = "sg_rna_cloning_experiments"."plate_id"
    group by "plates"."id", "plate_types"."label", "cycles"."id", "sg_rna_cloning_experiments"."id", "pcr_experiments"."id");--> statement-breakpoint
CREATE VIEW "view_sequencing_run_all_samples" AS (
WITH index_plate_well (source_well_id, index_plate_well_label) AS (
    SELECT
        source_well_id,
        string_agg(plate_well_label, ', ') as index_plate_well_label
    FROM (
        SELECT DISTINCT ON (wells.id)
            sequencing_run_samples.source_well_id,
            plates.name || ': ' || CHR(wells.y + 64) || wells.x AS plate_well_label
        FROM sequencing_run_samples
            JOIN well_contents on well_contents.well_id = source_well_id
            JOIN well_content_sources ON well_content_id = well_contents.id
            JOIN wells ON well_content_sources.source_well_id = wells.id
            JOIN plates ON wells.plate_id = plates.id
        WHERE plate_type = 'seq-index'
    )
    GROUP BY source_well_id
)
SELECT
  sequencing_run_samples.id AS id,
  CASE
    WHEN dna_pellets.name IS NOT NULL THEN dna_pellets.name || '_DNA'
    WHEN rna_pellets.name IS NOT NULL THEN rna_pellets.name || '_RNA'
    ELSE null
  END AS sample_name,
  sequencing_run_id,
  'internal' AS sample_type,
  dna_id,
  rna_id,
  NULL AS external_sample_id,
  index_primer_1_id,
  index_primer_2_id,
  primer1.index_sequence || ' (' || primer1.primer_type || ')' AS index_primer_1_label,
  primer2.index_sequence || ' (' || primer2.primer_type || ')' AS index_primer_2_label,
  index_plate_well_label,
  sequencing_run_samples.source_well_id,
  wells.x AS source_well_x,
  wells.y AS source_well_y,
  plates.name AS source_plate_name,
  NULL AS custom_index_seq_1,
  NULL AS custom_index_seq_2,
  million_reads_required,
  CASE
    WHEN index_primer_1_id IS NOT NULL AND index_primer_2_id IS NOT NULL THEN 'Y151;I10;I10;Y151'
    WHEN index_primer_1_id IS NOT NULL AND index_primer_2_id IS NULL THEN 'Y151;I10;N10;Y151'
    WHEN index_primer_1_id IS NULL AND index_primer_2_id IS NOT NULL THEN 'Y151;N10;I10;Y151'
  ELSE
    NULL
  END AS override_cycles,
  sequencing_run_samples.notes AS notes,
  created_at
  FROM sequencing_run_samples
  LEFT JOIN dna ON sequencing_run_samples.dna_id = dna.id
  LEFT JOIN rna ON sequencing_run_samples.rna_id = rna.id
  LEFT JOIN pellets AS dna_pellets ON dna.pellet_id = dna_pellets.id
  LEFT JOIN pellets AS rna_pellets ON rna.pellet_id = rna_pellets.id
  LEFT JOIN index_primers AS primer1 ON sequencing_run_samples.index_primer_1_id = primer1.id
  LEFT JOIN index_primers AS primer2 ON sequencing_run_samples.index_primer_2_id = primer2.id
  LEFT JOIN wells ON sequencing_run_samples.source_well_id = wells.id
  LEFT JOIN plates ON wells.plate_id = plates.id
  LEFT JOIN index_plate_well ON sequencing_run_samples.source_well_id = index_plate_well.source_well_id
  UNION
  SELECT
  sequencing_run_external_samples.id AS id,
  external_samples.name AS sample_name,
  sequencing_run_id,
  'external' AS sample_type,
  NULL AS dna_id,
  NULL AS rna_id,
  external_sample_id,
  COALESCE(sequencing_run_external_samples.index_primer_1_id, external_samples.index_primer_1_id) AS index_primer_1_id,
  COALESCE(sequencing_run_external_samples.index_primer_2_id, external_samples.index_primer_2_id) AS index_primer_2_id,
  COALESCE(primer1.index_sequence, ext_primer1.index_sequence) || ' (' || COALESCE(primer1.primer_type, ext_primer1.primer_type) || ')' AS index_primer_1_label,
  COALESCE(primer2.index_sequence, ext_primer2.index_sequence) || ' (' || COALESCE(primer2.primer_type, ext_primer2.primer_type) || ')' AS index_primer_2_label,
  NULL AS index_plate_well_label,
  source_well_id,
  wells.x AS source_well_x,
  wells.y AS source_well_y,
  plates.name AS source_plate_name,
  COALESCE(sequencing_run_external_samples.custom_index_seq_1, external_samples.custom_index_seq_1) as custom_index_seq_1,
  COALESCE(sequencing_run_external_samples.custom_index_seq_2, external_samples.custom_index_seq_2) as custom_index_seq_2,
  million_reads_required,
  CASE
    WHEN (COALESCE(sequencing_run_external_samples.index_primer_1_id, external_samples.index_primer_1_id) IS NOT NULL AND COALESCE(sequencing_run_external_samples.index_primer_2_id, external_samples.index_primer_2_id) IS NOT NULL) OR (COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_1, external_samples.custom_index_seq_1)), '') <> '' AND COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_2, external_samples.custom_index_seq_2)), '') <> '') THEN 'Y151;I10;I10;Y151'
    WHEN (COALESCE(sequencing_run_external_samples.index_primer_1_id, external_samples.index_primer_1_id) IS NOT NULL AND COALESCE(sequencing_run_external_samples.index_primer_2_id, external_samples.index_primer_2_id) IS NULL) OR (COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_1, external_samples.custom_index_seq_1)), '') <> '' AND COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_2, external_samples.custom_index_seq_2)), '') = '') THEN 'Y151;I10;N10;Y151'
    WHEN (COALESCE(sequencing_run_external_samples.index_primer_1_id, external_samples.index_primer_1_id) IS NULL AND COALESCE(sequencing_run_external_samples.index_primer_2_id, external_samples.index_primer_2_id) IS NOT NULL) OR (COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_1, external_samples.custom_index_seq_1)), '') = '' AND COALESCE(TRIM(COALESCE(sequencing_run_external_samples.custom_index_seq_2, external_samples.custom_index_seq_2)), '') <> '') THEN 'Y151;N10;I10;Y151'
  ELSE
    NULL
  END AS override_cycles,
  notes,
  sequencing_run_external_samples.created_at AS created_at
  FROM sequencing_run_external_samples
  JOIN external_samples ON sequencing_run_external_samples.external_sample_id = external_samples.id
  LEFT JOIN index_primers AS primer1 ON sequencing_run_external_samples.index_primer_1_id = primer1.id
  LEFT JOIN index_primers AS primer2 ON sequencing_run_external_samples.index_primer_2_id = primer2.id
  LEFT JOIN index_primers AS ext_primer1 ON external_samples.index_primer_1_id = ext_primer1.id
  LEFT JOIN index_primers AS ext_primer2 ON external_samples.index_primer_2_id = ext_primer2.id
  LEFT JOIN wells ON sequencing_run_external_samples.source_well_id = wells.id
  LEFT JOIN plates ON wells.plate_id = plates.id);--> statement-breakpoint
CREATE VIEW "view_snv_lib_gibson_products" AS (SELECT
    *,
    CASE WHEN total_reaction_volume IS NOT NULL THEN total_reaction_volume/2 ELSE NULL END AS two_x_nebuilder_reagent_volume,
	CASE WHEN total_reaction_volume IS NOT NULL AND lin_volume IS NOT NULL THEN total_reaction_volume/2 - lin_volume ELSE NULL END AS nc_water_volume,
    CASE WHEN total_reaction_volume IS NOT NULL AND amp_volume IS NOT NULL AND lin_volume IS NOT NULL THEN total_reaction_volume/2 - (amp_volume + lin_volume) ELSE NULL END AS h2o_volume,
	CASE
		WHEN amp_volume IS NOT NULL AND lin_volume IS NOT NULL
		THEN amp_volume + lin_volume
		ELSE NULL
	END AS total_volume
FROM (
	SELECT *,
	CASE
		WHEN amp_product_vector_amount IS NOT NULL AND amp_product_concentration != 0
		THEN amp_product_vector_amount / amp_product_concentration
		ELSE NULL
	END AS amp_volume,
	CASE
		WHEN lin_product_vector_amount IS NOT NULL AND lin_product_concentration != 0
		THEN lin_product_vector_amount / lin_product_concentration
		ELSE NULL
	END AS lin_volume
FROM (
	SELECT
	"snv_lib_gibson_products"."id" AS id,
    "snv_lib_gibson_products"."name" AS name,
    "snv_lib_gibson_products"."snv_lib_cloning_experiment_id" AS snv_lib_cloning_experiment_id,
    "snv_lib_gibson_products"."lin_product_vector_amount" AS lin_product_vector_amount,
    "snv_lib_gibson_products"."gibson_on" AS gibson_on,
    "snv_lib_gibson_products"."cleaned_on" AS cleaned_on,
    "snv_lib_gibson_products"."transformed_on" AS transformed_on,
    "snv_lib_gibson_products"."prepped_on" AS prepped_on,
    "snv_lib_gibson_products"."quant" AS quant,
    "snv_lib_gibson_products"."plasmidsaurus_checked" AS plasmidsaurus_checked,
    "snv_lib_gibson_products"."ngs_checked" AS ngs_checked,
    "snv_lib_gibson_products"."passed_qc" AS passed_qc,
    "snv_lib_gibson_products"."benchling_link" AS benchling_link,
    "snv_lib_gibson_products"."notes" AS notes,
    "snv_lib_gibson_products"."total_reaction_volume" AS total_reaction_volume,
    "snv_lib_cloning_experiments"."name" AS snv_lib_cloning_experiment_name,
	amp_products.id AS amp_product_id,
	amp_products.name AS amp_product_name,
	amp_products.amp_product_size AS amp_product_size,
	amp_products.quant AS amp_product_concentration,
	lin_products.id AS lin_product_id,
	lin_products.name AS lin_product_name,
	lin_products.quant AS lin_product_concentration,
	lin_products.ha_pcr_product_size AS ha_pcr_product_size,
    gibson_by_user.name AS gibson_by_name,
    cleaned_by_user.name AS cleaned_by_name,
    transformed_by_user.name AS transformed_by_name,
    prepped_by_user.name AS prepped_by_name,
	CASE
		WHEN lin_products.ha_pcr_product_size IS NOT NULL AND amp_products.amp_product_size IS NOT NULL
	 	THEN lin_products.ha_pcr_product_size - amp_products.amp_product_size + 2649
	 	ELSE NULL
	END AS lin_product_size,
	CASE
		WHEN lin_products.ha_pcr_product_size IS NOT NULL AND amp_products.amp_product_size IS NOT NULL
		AND amp_products.amp_product_size IS NOT NULL AND snv_lib_gibson_products.lin_product_vector_amount IS NOT NULL
		AND amp_products.amp_product_size - lin_products.ha_pcr_product_size != 2649
		THEN 7.0 * amp_products.amp_product_size / (lin_products.ha_pcr_product_size - amp_products.amp_product_size + 2649) * snv_lib_gibson_products.lin_product_vector_amount
		ELSE NULL
	END AS amp_product_vector_amount
FROM "snv_lib_gibson_products"
JOIN "snv_lib_cloning_experiments" ON "snv_lib_cloning_experiments"."id" = "snv_lib_gibson_products"."snv_lib_cloning_experiment_id"
LEFT JOIN "users"."users" AS prepped_by_user ON prepped_by_user.id = "snv_lib_gibson_products"."prepped_by_id"
LEFT JOIN "users"."users" AS transformed_by_user ON transformed_by_user.id = "snv_lib_gibson_products"."transformed_by_id"
LEFT JOIN "users"."users" AS cleaned_by_user ON cleaned_by_user.id = "snv_lib_gibson_products"."cleaned_by_id"
LEFT JOIN "users"."users" AS gibson_by_user ON gibson_by_user.id = "snv_lib_gibson_products"."gibson_by_id"
LEFT JOIN
	(SELECT "snv_lib_lin_products"."id" AS id,
		"snv_lib_lin_products"."name" AS name,
		"snv_lib_lin_products"."snv_lib_cloning_experiment_id" AS snv_lib_cloning_experiment_id,
		"snv_lib_lin_products"."quant" AS quant,
		CASE
			 WHEN "ha_pcr_products"."start_position" IS NOT NULL AND "ha_pcr_products"."stop_position" IS NOT NULL
			 THEN
			 	"ha_pcr_products"."stop_position" - "ha_pcr_products"."start_position" + 1
			 ELSE NULL
		END AS ha_pcr_product_size
		FROM "snv_lib_lin_products"
			LEFT JOIN "ha_puc19_plasmids" ON "ha_puc19_plasmids"."id" = "snv_lib_lin_products"."ha_puc19_plasmid_id"
			LEFT JOIN "ha_puc19_gibson_products" ON "ha_puc19_plasmids"."ha_puc19_gibson_product_id" = "ha_puc19_gibson_products"."id"
			LEFT JOIN "ha_puc19_pcr_products" ON "ha_puc19_gibson_products"."ha_puc19_pcr_product_id" = "ha_puc19_pcr_products"."id"
			LEFT JOIN "ha_pcr_products" ON "ha_puc19_pcr_products"."ha_pcr_product_id" = "ha_pcr_products"."id"
	) lin_products ON lin_products.snv_lib_cloning_experiment_id = "snv_lib_gibson_products"."snv_lib_cloning_experiment_id"
LEFT JOIN (
	SELECT
        "snv_lib_amp_products"."id" AS id,
		"snv_lib_amp_products"."name" AS name,
		"snv_lib_amp_products"."snv_lib_cloning_experiment_id" AS snv_lib_cloning_experiment_id,
		"snv_lib_amp_products"."quant" AS quant,
		CASE
			 WHEN "snv_lib_amp_products"."start_position" IS NOT NULL AND "snv_lib_amp_products"."stop_position" IS NOT NULL
			 THEN "snv_lib_amp_products"."stop_position" - "snv_lib_amp_products"."start_position" + 1
			 ELSE NULL
		END AS amp_product_size
	FROM "snv_lib_amp_products"
    ) amp_products ON amp_products.snv_lib_cloning_experiment_id = "snv_lib_gibson_products"."snv_lib_cloning_experiment_id"
) t2 ) t3);

-- ============================================================
-- Triggers: wellables polymorphic association
-- (from 0109_majestic_zaran.sql — not expressible in Drizzle)
-- ============================================================

CREATE OR REPLACE FUNCTION "wellables_insert"()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "wellables" (id, table_name) VALUES (NEW.id, TG_TABLE_NAME::regclass::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE OR REPLACE TRIGGER "amplification_primers_wellables_insert"
BEFORE INSERT ON "amplification_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "linearization_primers_wellables_insert"
BEFORE INSERT ON "linearization_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "homology_arm_primers_wellables_insert"
BEFORE INSERT ON "homology_arm_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "preseq_1_primers_wellables_insert"
BEFORE INSERT ON "preseq_1_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "preseq_2_primers_wellables_insert"
BEFORE INSERT ON "preseq_2_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "index_primers_wellables_insert"
BEFORE INSERT ON "index_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "nucleic_acids_wellables_insert"
BEFORE INSERT ON "nucleic_acids"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "pellets_wellables_insert"
BEFORE INSERT ON "pellets"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "sg_rna_plasmids_wellables_insert"
BEFORE INSERT ON "sg_rna_plasmids"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "snv_lib_plasmids_wellables_insert"
BEFORE INSERT ON "snv_lib_plasmids"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "sg_rna_oligos_wellables_insert"
BEFORE INSERT ON "sg_rna_oligos"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "external_samples_wellables_insert"
BEFORE INSERT ON "external_samples"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE FUNCTION "wellables_delete"()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM "wellables" WHERE id = OLD.id AND table_name = TG_TABLE_NAME::regclass::text;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE OR REPLACE TRIGGER "amplification_primers_wellables_delete"
BEFORE DELETE ON "amplification_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "linearization_primers_wellables_delete"
BEFORE DELETE ON "linearization_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "homology_arm_primers_wellables_delete"
BEFORE DELETE ON "homology_arm_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "preseq_1_primers_wellables_delete"
BEFORE DELETE ON "preseq_1_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "preseq_2_primers_wellables_delete"
BEFORE DELETE ON "preseq_2_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "index_primers_wellables_delete"
BEFORE DELETE ON "index_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "nucleic_acids_wellables_delete"
BEFORE DELETE ON "nucleic_acids"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "pellets_wellables_delete"
BEFORE DELETE ON "pellets"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "sg_rna_plasmids_wellables_delete"
BEFORE DELETE ON "sg_rna_plasmids"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "snv_lib_plasmids_wellables_delete"
BEFORE DELETE ON "snv_lib_plasmids"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "sg_rna_oligos_wellables_delete"
BEFORE DELETE ON "sg_rna_oligos"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "external_samples_wellables_delete"
BEFORE DELETE ON "external_samples"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

-- ============================================================
-- Triggers: unique multitarget primer constraint
-- (from 0174_multitarget-primer-constraint-triggers.sql — not expressible in Drizzle)
-- ============================================================

CREATE OR REPLACE FUNCTION unique_primer_targets()
RETURNS TRIGGER AS $$
DECLARE
    primer_table REGCLASS := TG_ARGV[0];
    related_targets_table REGCLASS := TG_ARGV[1];
    join_field TEXT := TG_ARGV[2];
 	result boolean;
BEGIN
	EXECUTE format('SELECT EXISTS (
		SELECT COUNT(*) FROM (
			SELECT sequence_type, array_agg(target_id ORDER BY target_id) AS targets
			FROM %I
			JOIN %I ON %I.id = %I
			WHERE archived IS NOT TRUE
			GROUP BY %I.id
		) GROUP BY sequence_type, targets
		HAVING COUNT(*) > 1)', primer_table, related_targets_table, primer_table, join_field, primer_table)
	INTO result;
  IF result THEN
    RAISE EXCEPTION 'Constraint violated';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Homology arm primers

DROP TRIGGER IF EXISTS homology_arm_primers_unique_targets ON homology_arm_primers;--> statement-breakpoint

CREATE CONSTRAINT TRIGGER homology_arm_primers_unique_targets
AFTER INSERT OR UPDATE ON homology_arm_primers
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION unique_primer_targets('homology_arm_primers', 'homology_arm_primer_targets', 'homology_arm_primer_id');--> statement-breakpoint

DROP TRIGGER IF EXISTS homology_arm_primer_targets_unique_targets ON homology_arm_primer_targets;--> statement-breakpoint

CREATE CONSTRAINT TRIGGER homology_arm_primer_targets_unique_targets
AFTER INSERT OR UPDATE ON homology_arm_primer_targets
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION unique_primer_targets('homology_arm_primers', 'homology_arm_primer_targets', 'homology_arm_primer_id');--> statement-breakpoint

-- DNA preseq 1 primers

DROP TRIGGER IF EXISTS preseq_1_primers_unique_targets ON preseq_1_primers;--> statement-breakpoint

CREATE CONSTRAINT TRIGGER preseq_1_primers_unique_targets
AFTER INSERT OR UPDATE ON preseq_1_primers
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION unique_primer_targets('preseq_1_primers', 'preseq_1_primer_targets', 'preseq_1_primer_id');--> statement-breakpoint

DROP TRIGGER IF EXISTS preseq_1_primer_targets_unique_targets ON preseq_1_primer_targets;--> statement-breakpoint

CREATE CONSTRAINT TRIGGER preseq_1_primer_targets_unique_targets
AFTER INSERT OR UPDATE ON preseq_1_primer_targets
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION unique_primer_targets('preseq_1_primers', 'preseq_1_primer_targets', 'preseq_1_primer_id');--> statement-breakpoint

-- RNA preseq 1 primers

DROP TRIGGER IF EXISTS rna_preseq_1_primers_unique_targets ON rna_preseq_1_primers;--> statement-breakpoint

CREATE CONSTRAINT TRIGGER rna_preseq_1_primers_unique_targets
AFTER INSERT OR UPDATE ON rna_preseq_1_primers
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION unique_primer_targets('rna_preseq_1_primers', 'rna_preseq_1_primer_targets', 'rna_preseq_1_primer_id');--> statement-breakpoint

DROP TRIGGER IF EXISTS rna_preseq_1_primer_targets_unique_targets ON rna_preseq_1_primer_targets;--> statement-breakpoint

CREATE CONSTRAINT TRIGGER rna_preseq_1_primer_targets_unique_targets
AFTER INSERT OR UPDATE ON rna_preseq_1_primer_targets
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION unique_primer_targets('rna_preseq_1_primers', 'rna_preseq_1_primer_targets', 'rna_preseq_1_primer_id');--> statement-breakpoint

-- RNA preseq 2 primers

DROP TRIGGER IF EXISTS rna_preseq_2_primers_unique_targets ON rna_preseq_2_primers;--> statement-breakpoint

CREATE CONSTRAINT TRIGGER rna_preseq_2_primers_unique_targets
AFTER INSERT OR UPDATE ON rna_preseq_2_primers
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION unique_primer_targets('rna_preseq_2_primers', 'rna_preseq_2_primer_targets', 'rna_preseq_2_primer_id');--> statement-breakpoint

DROP TRIGGER IF EXISTS rna_preseq_2_primer_targets_unique_targets ON rna_preseq_2_primer_targets;--> statement-breakpoint

CREATE CONSTRAINT TRIGGER rna_preseq_2_primer_targets_unique_targets
AFTER INSERT OR UPDATE ON rna_preseq_2_primer_targets
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION unique_primer_targets('rna_preseq_2_primers', 'rna_preseq_2_primer_targets', 'rna_preseq_2_primer_id');

-- ============================================================
-- Triggers: additional wellables tables
-- (from 0119_greedy_firedrake.sql — not expressible in Drizzle)
-- ============================================================

CREATE OR REPLACE TRIGGER "homology_arm_puc19_primers_wellables_insert"
BEFORE INSERT ON "homology_arm_puc19_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "homology_arm_puc19_primers_wellables_delete"
BEFORE DELETE ON "homology_arm_puc19_primers"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "ha_pcr_products_wellables_insert"
BEFORE INSERT ON "ha_pcr_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "ha_pcr_products_wellables_delete"
BEFORE DELETE ON "ha_pcr_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "ha_puc19_pcr_products_wellables_insert"
BEFORE INSERT ON "ha_puc19_pcr_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "ha_puc19_pcr_products_wellables_delete"
BEFORE DELETE ON "ha_puc19_pcr_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "ha_puc19_gibson_products_wellables_insert"
BEFORE INSERT ON "ha_puc19_gibson_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "ha_puc19_gibson_products_wellables_delete"
BEFORE DELETE ON "ha_puc19_gibson_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "ha_puc19_plasmids_wellables_insert"
BEFORE INSERT ON "ha_puc19_plasmids"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "ha_puc19_plasmids_wellables_delete"
BEFORE DELETE ON "ha_puc19_plasmids"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

-- ============================================================
-- Triggers: snv_lib product wellables
-- (from 0129_damp_warpath.sql — not expressible in Drizzle)
-- ============================================================

CREATE OR REPLACE TRIGGER "snv_lib_amp_products_wellables_insert"
BEFORE INSERT ON "snv_lib_amp_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "snv_lib_amp_products_wellables_delete"
BEFORE DELETE ON "snv_lib_amp_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "snv_lib_lin_products_wellables_insert"
BEFORE INSERT ON "snv_lib_lin_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "snv_lib_lin_products_wellables_delete"
BEFORE DELETE ON "snv_lib_lin_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "snv_lib_gibson_products_wellables_insert"
BEFORE INSERT ON "snv_lib_gibson_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "snv_lib_gibson_products_wellables_delete"
BEFORE DELETE ON "snv_lib_gibson_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

-- ============================================================
-- Triggers: dna and rna wellables
-- (from 0139_dna_rna_wellable_funcs.sql — not expressible in Drizzle)
-- ============================================================

CREATE OR REPLACE TRIGGER dna_wellables_insert
BEFORE INSERT ON dna
FOR EACH ROW
EXECUTE FUNCTION wellables_insert();--> statement-breakpoint

CREATE OR REPLACE TRIGGER dna_wellables_delete
BEFORE DELETE ON dna
FOR EACH ROW
EXECUTE FUNCTION wellables_delete();--> statement-breakpoint

CREATE OR REPLACE TRIGGER rna_wellables_insert
BEFORE INSERT ON rna
FOR EACH ROW
EXECUTE FUNCTION wellables_insert();--> statement-breakpoint

CREATE OR REPLACE TRIGGER rna_wellables_delete
BEFORE DELETE ON rna
FOR EACH ROW
EXECUTE FUNCTION wellables_delete();--> statement-breakpoint

-- ============================================================
-- Triggers: RNA preseq and RT primer wellables
-- (from 0154_nice_mister_sinister.sql — not expressible in Drizzle)
-- ============================================================

CREATE OR REPLACE TRIGGER "rna_preseq1_primers_wellables_insert"
BEFORE INSERT ON "rna_preseq_1_primers"
FOR EACH ROW
EXECUTE FUNCTION wellables_insert();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "rna_preseq1_primers_wellables_delete"
BEFORE DELETE ON "rna_preseq_1_primers"
FOR EACH ROW
EXECUTE FUNCTION wellables_delete();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "rna_preseq2_primers_wellables_insert"
BEFORE INSERT ON "rna_preseq_2_primers"
FOR EACH ROW
EXECUTE FUNCTION wellables_insert();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "rna_preseq2_primers_wellables_delete"
BEFORE DELETE ON "rna_preseq_2_primers"
FOR EACH ROW
EXECUTE FUNCTION wellables_delete();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "rna_rt_primers_wellables_insert"
BEFORE INSERT ON "rna_rt_primers"
FOR EACH ROW
EXECUTE FUNCTION wellables_insert();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "rna_rt_primers_wellables_delete"
BEFORE DELETE ON "rna_rt_primers"
FOR EACH ROW
EXECUTE FUNCTION wellables_delete();--> statement-breakpoint

-- ============================================================
-- Triggers: clonal_has wellables
-- (from 0169_clonal_ha_triggers.sql — not expressible in Drizzle)
-- ============================================================

CREATE OR REPLACE TRIGGER "clonal_has_wellables_insert"
BEFORE INSERT ON "clonal_has"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "clonal_has_wellables_delete"
BEFORE DELETE ON "clonal_has"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

-- ============================================================
-- Triggers: snv_lib_clonal_dna_products and snv_lib_golden_gate_products wellables
-- (listed in wellable_table_name CHECK constraint in 0154 but never given trigger definitions)
-- ============================================================

CREATE OR REPLACE TRIGGER "snv_lib_clonal_dna_products_wellables_insert"
BEFORE INSERT ON "snv_lib_clonal_dna_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "snv_lib_clonal_dna_products_wellables_delete"
BEFORE DELETE ON "snv_lib_clonal_dna_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "snv_lib_golden_gate_products_wellables_insert"
BEFORE INSERT ON "snv_lib_golden_gate_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_insert"();--> statement-breakpoint

CREATE OR REPLACE TRIGGER "snv_lib_golden_gate_products_wellables_delete"
BEFORE DELETE ON "snv_lib_golden_gate_products"
FOR EACH ROW
EXECUTE FUNCTION "wellables_delete"();