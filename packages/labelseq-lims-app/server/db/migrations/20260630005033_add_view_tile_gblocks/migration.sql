CREATE VIEW "view_tile_gblocks" AS (select *,
    concat(gblock_pad_seq, gblock_seq) as gblock_order_seq
    from (
        select *,
        substring('ACGCCGCCACGTGTTCGTTAACTGTTGATTGGTGGCACATAAGTAATACCATGGTCCCTGAAATTCGGCTCAGTTACTTCGAGCGTAATGTCTCAAATGGCGTAGAACGGCAATGACTGTTTGACACTAGGTGGTGTTCAGTTCGGTAACGGAGAGTCTGTGCGGCATTCTTATTAATACATTTGAAACGCGCCCAACTGACGCTAGGCAAGTCAGTGCAGGCTCCCGTGTTAGGATAAGGGTAAACATACAAGTCGATAGAAGATGGGTAGGGGCCTTCAATTCATCCAGCACTCTACG' from 1 for greatest(0, 300 - length(gblock_seq))) as gblock_pad_seq
        from (
            select *,
            concat(gblock_capseq_f_seq, gblock_nterm_overhang_seq, gblock_nterm_restriction_enzyme_seq, gblock_core_seq, gblock_cterm_restriction_enzyme_seq_rev_comp, gblock_cterm_overhang_seq, gblock_capseq_r_rev_comp_seq) as gblock_seq
            from (
        select
        concat(base.tile_id, '-', g.side) as id,
        base.tile_id,
        base.superblock_id,
        base.tile_name,
        g.side,
        base.superblock_first,
        base.superblock_last,
        base.mutagenesis_start,
        base.mutagenesis_end,
        base.restriction_enzyme_name,
        base.apply_capseq_to_gblocks,
        case when base.apply_capseq_to_gblocks then 'CCGCGTGATTACGAGTCGGGCTACGGTCTCT' end as gblock_capseq_f_seq,
        case when g.side = '5-prime' then 'CGTC' end as gblock_nterm_overhang_seq,
        case when g.side = '5-prime' then base.recog_seq_plus_overhang end as gblock_nterm_restriction_enzyme_seq,
        case when g.side = '5-prime'
            then substring(base.seq from 1 for base.tile_start + 3)
            else substring(base.seq from base.tile_end - 3)
        end as gblock_core_seq,
        case when g.side = '3-prime' then base.recog_seq_plus_overhang_rev_comp end as gblock_cterm_restriction_enzyme_seq_rev_comp,
        case when g.side = '3-prime' then 'GCAT' end as gblock_cterm_overhang_seq,
        case when base.apply_capseq_to_gblocks then 'AGAGACCGTAGCCAGGCTGCCACTTGCTAACCC' end as gblock_capseq_r_rev_comp_seq
        from (
            select
            "tiles"."id" as tile_id,
            "tiles"."superblock_id",
            "tiles"."tile_name",
            "tiles"."superblock_first",
            "tiles"."superblock_last",
            "tiles"."tile_start",
            "tiles"."tile_end",
            "tiles"."mutagenesis_start",
            "tiles"."mutagenesis_end",
            "superblocks"."seq" as seq,
            "restriction_enzymes"."name" as restriction_enzyme_name,
            "restriction_enzymes"."recog_seq_plus_overhang" as recog_seq_plus_overhang,
            "restriction_enzymes"."recog_seq_plus_overhang_rev_comp" as recog_seq_plus_overhang_rev_comp,
            "projects"."apply_capseq_to_gblocks" as apply_capseq_to_gblocks
            from "tiles"
            join "superblocks" on "tiles"."superblock_id" = "superblocks"."id"
            join "projects" on "superblocks"."project_id" = "projects"."id"
            join "restriction_enzymes" on "projects"."restriction_enzyme_id" = "restriction_enzymes"."id"
        ) base
        cross join (values ('5-prime'), ('3-prime')) as g(side)
        where (g.side = '5-prime' and not coalesce(base.superblock_first, false))
           or (g.side = '3-prime' and not coalesce(base.superblock_last, false))
            ) gblocks
        ) assembled
    ) padded);