-- Custom SQL migration file, adding "restriction_enzyme_name" to view_tiles_with_sequences --
DROP VIEW IF EXISTS "view_tiles_with_sequences";--> statement-breakpoint
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
        "retriever_primer_r"."seq_rev_comp" as retriever_primer_r_seq_rev_comp,
        "restriction_enzymes"."name" as restriction_enzyme_name
        from "tiles"
        join "superblocks" on "tiles"."superblock_id" = "superblocks"."id"
        join "projects" on "superblocks"."project_id" = "projects"."id"
        join "restriction_enzymes" on "projects"."restriction_enzyme_id" = "restriction_enzymes"."id"
        join "retriever_primers" as retriever_primer_f on "tiles"."retriever_primer_forward_id" = "retriever_primer_f"."id"
        join "retriever_primers" as retriever_primer_r on "tiles"."retriever_primer_reverse_id" = "retriever_primer_r"."id"));
