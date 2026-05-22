CREATE SCHEMA "users";
--> statement-breakpoint
CREATE TYPE "primer_directions" AS ENUM('forward', 'reverse');--> statement-breakpoint
CREATE TYPE "gene_orientations" AS ENUM('plus', 'minus');--> statement-breakpoint
CREATE TABLE "retriever_primers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"seq" text NOT NULL,
	"seq_rev_comp" text GENERATED ALWAYS AS (reverse(translate("retriever_primers"."seq", 'aAcCgGtT', 'tTgGcCaA'))) STORED,
	"direction" "primer_directions" NOT NULL,
	CONSTRAINT "seq_check" CHECK ("seq" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"restriction_enzyme_id" uuid,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "restriction_enzymes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(10) NOT NULL UNIQUE,
	"recog_seq_plus_overhang" varchar(20),
	"overhang_length" integer NOT NULL,
	"recog_seq" varchar(20) GENERATED ALWAYS AS (substring("restriction_enzymes"."recog_seq_plus_overhang", 1, length("restriction_enzymes"."recog_seq_plus_overhang") - "restriction_enzymes"."overhang_length")) STORED,
	"recog_seq_rev_comp" varchar GENERATED ALWAYS AS (reverse(translate(substring("restriction_enzymes"."recog_seq_plus_overhang", 1, length("restriction_enzymes"."recog_seq_plus_overhang") - "restriction_enzymes"."overhang_length"), 'aAcCgGtT', 'tTgGcCaA'))) STORED,
	"recog_seq_plus_overhang_rev_comp" varchar GENERATED ALWAYS AS (reverse(translate("restriction_enzymes"."recog_seq_plus_overhang", 'aAcCgGtT', 'tTgGcCaA'))) STORED,
	CONSTRAINT "recog_seq_plus_overhang_check" CHECK ("recog_seq_plus_overhang" ~* '^[actgn]*$')
);
--> statement-breakpoint
CREATE TABLE "superblocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"refseq_transcript_id" uuid,
	"name" varchar(50) NOT NULL,
	"description" varchar(255),
	"start" integer,
	"end" integer,
	"seq" text,
	CONSTRAINT "seq_check" CHECK ("seq" ~* '^[actg]*$')
);
--> statement-breakpoint
CREATE TABLE "tiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"superblock_id" uuid NOT NULL,
	"tile_name" varchar(50) NOT NULL,
	"tile_start" integer NOT NULL,
	"tile_end" integer NOT NULL,
	"mutagenesis_start" integer,
	"mutagenesis_end" integer,
	"retriever_primer_forward_id" uuid,
	"retriever_primer_reverse_id" uuid,
	"superblock_first" boolean DEFAULT false,
	"superblock_last" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "refseq_transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"transcript_id" varchar(50) NOT NULL UNIQUE,
	"gene_id" uuid NOT NULL,
	"seq" text,
	CONSTRAINT "seq_check" CHECK ("seq" ~* '^[actg]*$')
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
CREATE TABLE "plates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL CONSTRAINT "plates_name_unique" UNIQUE,
	"size_x" smallint DEFAULT 12 NOT NULL,
	"size_y" smallint DEFAULT 8 NOT NULL,
	"plate_type" varchar(100) NOT NULL,
	"discarded" boolean DEFAULT false,
	"processed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "plate_types" (
	"value" varchar(100) PRIMARY KEY,
	"label" varchar(255) NOT NULL,
	"desc" varchar(500)
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
	CONSTRAINT "wellable_table_name" CHECK ("table_name" IN (NULL))
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
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "users"."password_reset_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "users"."password_reset_tokens" ("user_id");--> statement-breakpoint
CREATE INDEX "ncbi_accession_idx" ON "genes" ("ncbi_accession");--> statement-breakpoint
CREATE INDEX "symbol_idx" ON "genes" ("symbol");--> statement-breakpoint
CREATE INDEX "gene_type_idx" ON "genes" ("gene_type");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_restriction_enzyme_id_restriction_enzymes_id_fkey" FOREIGN KEY ("restriction_enzyme_id") REFERENCES "restriction_enzymes"("id");--> statement-breakpoint
ALTER TABLE "superblocks" ADD CONSTRAINT "superblocks_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "superblocks" ADD CONSTRAINT "superblocks_refseq_transcript_id_refseq_transcripts_id_fkey" FOREIGN KEY ("refseq_transcript_id") REFERENCES "refseq_transcripts"("id");--> statement-breakpoint
ALTER TABLE "tiles" ADD CONSTRAINT "tiles_superblock_id_superblocks_id_fkey" FOREIGN KEY ("superblock_id") REFERENCES "superblocks"("id");--> statement-breakpoint
ALTER TABLE "tiles" ADD CONSTRAINT "tiles_retriever_primer_forward_id_retriever_primers_id_fkey" FOREIGN KEY ("retriever_primer_forward_id") REFERENCES "retriever_primers"("id");--> statement-breakpoint
ALTER TABLE "tiles" ADD CONSTRAINT "tiles_retriever_primer_reverse_id_retriever_primers_id_fkey" FOREIGN KEY ("retriever_primer_reverse_id") REFERENCES "retriever_primers"("id");--> statement-breakpoint
ALTER TABLE "refseq_transcripts" ADD CONSTRAINT "refseq_transcripts_gene_id_genes_id_fkey" FOREIGN KEY ("gene_id") REFERENCES "genes"("id");--> statement-breakpoint
ALTER TABLE "users"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "users"."user_group_memberships" ADD CONSTRAINT "user_group_memberships_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "users"."user_group_memberships" ADD CONSTRAINT "user_group_memberships_user_group_id_user_groups_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "users"."user_groups"("id");--> statement-breakpoint
ALTER TABLE "plates" ADD CONSTRAINT "plates_plate_type_plate_types_value_fkey" FOREIGN KEY ("plate_type") REFERENCES "plate_types"("value");--> statement-breakpoint
ALTER TABLE "well_content_sources" ADD CONSTRAINT "well_content_sources_well_content_id_well_contents_id_fkey" FOREIGN KEY ("well_content_id") REFERENCES "well_contents"("id");--> statement-breakpoint
ALTER TABLE "well_content_sources" ADD CONSTRAINT "well_content_sources_source_well_id_wells_id_fkey" FOREIGN KEY ("source_well_id") REFERENCES "wells"("id");--> statement-breakpoint
ALTER TABLE "well_content_sources" ADD CONSTRAINT "well_content_sources_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"."users"("id");--> statement-breakpoint
ALTER TABLE "well_contents" ADD CONSTRAINT "well_contents_well_id_wells_id_fkey" FOREIGN KEY ("well_id") REFERENCES "wells"("id");--> statement-breakpoint
ALTER TABLE "well_contents" ADD CONSTRAINT "well_contents_wellable_id_wellables_id_fkey" FOREIGN KEY ("wellable_id") REFERENCES "wellables"("id");--> statement-breakpoint
ALTER TABLE "wells" ADD CONSTRAINT "wells_plate_id_plates_id_fkey" FOREIGN KEY ("plate_id") REFERENCES "plates"("id");--> statement-breakpoint
CREATE VIEW "view_tiles_with_sequences" AS (select *,
    concat(retriever_primer_f_seq, bsa1_plusone_seq, bsa1_plusone_nterm_overhang_seq, superblock_nterm_restriction_enzyme_seq, tile_seq, superblock_cterm_restriction_enzyme_seq_rev_comp, bsa1_plusone_cterm_overhang_seq, bsa1_plusone_seq_rev_comp, retriever_primer_r_seq_rev_comp) as full_sequence
    from (
        select
        "tiles"."id",
        "tiles"."superblock_id",
        "tiles"."tile_name",
        "tiles"."tile_start",
        "tiles"."tile_end",
        "tiles"."mutagenesis_start",
        "tiles"."mutagenesis_end",
        "tiles"."retriever_primer_forward_id",
        "tiles"."retriever_primer_reverse_id",
        "tiles"."superblock_first",
        "tiles"."superblock_last",
        "tiles"."tile_end" - "tiles"."tile_start" + 1 as tile_length,
        "tiles"."mutagenesis_end" - "tiles"."mutagenesis_start" + 1 as mutagenesis_length,
        "retriever_primer_f"."seq" as retriever_primer_f_seq,
        'GGTCTCT' as bsa1_plusone_seq,
        case when "tiles"."superblock_first" then 'CGTC' end as bsa1_plusone_nterm_overhang_seq,
        case when "tiles"."superblock_first" then "restriction_enzymes"."recog_seq_plus_overhang" end as superblock_nterm_restriction_enzyme_seq,
        substring("superblocks"."seq" from "tiles"."tile_start" for "tiles"."tile_end" - "tiles"."tile_start" + 1) as tile_seq,
        case when "tiles"."superblock_last" then "restriction_enzymes"."recog_seq_plus_overhang_rev_comp" end as superblock_cterm_restriction_enzyme_seq_rev_comp,
        case when "tiles"."superblock_last" then 'GCAT' end as bsa1_plusone_cterm_overhang_seq,
        'AGAGACC' as bsa1_plusone_seq_rev_comp,
        "retriever_primer_r"."seq_rev_comp" as retriever_primer_r_seq_rev_comp
        from "tiles"
        join "superblocks" on "tiles"."superblock_id" = "superblocks"."id"
        join "projects" on "superblocks"."project_id" = "projects"."id"
        join "restriction_enzymes" on "projects"."restriction_enzyme_id" = "restriction_enzymes"."id"
        join "retriever_primers" as retriever_primer_f on "tiles"."retriever_primer_forward_id" = "retriever_primer_f"."id"
        join "retriever_primers" as retriever_primer_r on "tiles"."retriever_primer_reverse_id" = "retriever_primer_r"."id"));--> statement-breakpoint
CREATE VIEW "view_plates_with_well_counts" AS (select
    "plates"."id",
    "plates"."name",
    "plates"."size_x",
    "plates"."size_y",
    "plates"."plate_type",
    "plates"."discarded",
    "plates"."processed",
    "plate_types"."label" as plate_type_label,
    count(distinct("wells"."id")) as wells_count,
    count(distinct("well_contents"."well_id")) as wells_with_content_count,
    count(distinct("well_content_sources"."source_well_id")) as wells_processed_count
    from "plates"
    join "wells" on "plates"."id" = "wells"."plate_id"
    left join "plate_types" on "plate_types"."value" = "plates"."plate_type"
    left join "well_content_sources" on "wells"."id" = "well_content_sources"."source_well_id"
    left join "well_contents" on "wells"."id" = "well_contents"."well_id"
    group by "plates"."id", "plate_types"."label");