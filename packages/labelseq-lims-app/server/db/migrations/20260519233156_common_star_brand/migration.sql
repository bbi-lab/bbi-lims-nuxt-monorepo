CREATE TYPE "amino_acids" AS ENUM('A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y', 'X');--> statement-breakpoint
CREATE TYPE "dna_codons" AS ENUM('AAA', 'AAC', 'AAG', 'AAT', 'ACA', 'ACC', 'ACG', 'ACT', 'AGA', 'AGC', 'AGG', 'AGT', 'ATA', 'ATC', 'ATG', 'ATT', 'CAA', 'CAC', 'CAG', 'CAT', 'CCA', 'CCC', 'CCG', 'CCT', 'CGA', 'CGC', 'CGG', 'CGT', 'CTA', 'CTC', 'CTG', 'CTT', 'GAA', 'GAC', 'GAG', 'GAT', 'GCA', 'GCC', 'GCG', 'GCT', 'GGA', 'GGC', 'GGG', 'GGT', 'GTA', 'GTC', 'GTG', 'GTT', 'TAA', 'TAC', 'TAG', 'TAT', 'TCA', 'TCC', 'TCG', 'TCT', 'TGA', 'TGC', 'TGG', 'TGT', 'TTA', 'TTC', 'TTG', 'TTT');--> statement-breakpoint
CREATE TABLE "tile_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tile_id" uuid NOT NULL,
	"aa_position" integer NOT NULL,
	"aa_ref" "amino_acids" NOT NULL,
	"aa_alt" "amino_acids",
	"nt_position" integer NOT NULL,
	"nt_ref" "dna_codons" NOT NULL,
	"nt_alt" "dna_codons"
);
--> statement-breakpoint
DROP VIEW "view_tiles_with_sequences";--> statement-breakpoint
ALTER TABLE "tile_variants" ADD CONSTRAINT "tile_variants_tile_id_tiles_id_fkey" FOREIGN KEY ("tile_id") REFERENCES "tiles"("id");--> statement-breakpoint
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
