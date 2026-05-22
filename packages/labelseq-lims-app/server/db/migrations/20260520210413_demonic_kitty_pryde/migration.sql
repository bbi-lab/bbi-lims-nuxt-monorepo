CREATE VIEW "view_tile_variants_with_sequences" AS (select *,
    concat(retriever_primer_f_seq, bsa1_plusone_seq, bsa1_plusone_nterm_overhang_seq, superblock_nterm_restriction_enzyme_seq, tile_variant_seq, superblock_cterm_restriction_enzyme_seq_rev_comp, bsa1_plusone_cterm_overhang_seq, bsa1_plusone_seq_rev_comp, retriever_primer_r_seq_rev_comp) as full_sequence
    from (select
        tile_variants.*,
        view_tiles_with_sequences.superblock_id,
        view_tiles_with_sequences.tile_name,
        view_tiles_with_sequences.tile_start,
        view_tiles_with_sequences.tile_end,
        view_tiles_with_sequences.mutagenesis_start,
        view_tiles_with_sequences.mutagenesis_end,
        view_tiles_with_sequences.retriever_primer_forward_id,
        view_tiles_with_sequences.retriever_primer_reverse_id,
        view_tiles_with_sequences.superblock_first,
        view_tiles_with_sequences.superblock_last,
        view_tiles_with_sequences.tile_length,
        view_tiles_with_sequences.mutagenesis_length,
        view_tiles_with_sequences.retriever_primer_f_seq,
        view_tiles_with_sequences.bsa1_plusone_seq,
        view_tiles_with_sequences.bsa1_plusone_nterm_overhang_seq,
        view_tiles_with_sequences.superblock_nterm_restriction_enzyme_seq,
        view_tiles_with_sequences.tile_seq,
        view_tiles_with_sequences.superblock_cterm_restriction_enzyme_seq_rev_comp,
        view_tiles_with_sequences.bsa1_plusone_cterm_overhang_seq,
        view_tiles_with_sequences.bsa1_plusone_seq_rev_comp,
        view_tiles_with_sequences.retriever_primer_r_seq_rev_comp,
        view_tiles_with_sequences.restriction_enzyme_name,
        case when tile_variants.nt_alt is not null then
            overlay(view_tiles_with_sequences.tile_seq placing tile_variants.nt_alt::text from tile_variants.nt_position)
        else
            overlay(view_tiles_with_sequences.tile_seq placing '' from tile_variants.nt_position for 3)
        end as tile_variant_seq
        from tile_variants
        join view_tiles_with_sequences on tile_variants.tile_id = view_tiles_with_sequences.id));