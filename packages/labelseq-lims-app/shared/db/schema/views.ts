import { pgView, uuid, varchar, integer, boolean } from 'drizzle-orm/pg-core'
import { superblocks, tiles } from './tiles'
import { eq, sql } from 'drizzle-orm/sql'
import { projects } from './project'
import { restrictionEnzymes } from './reagents'
import { retrieverPrimers } from './primers'

export const viewTilesWithSequences = pgView('view_tiles_with_sequences', {
    id: uuid('id'),
    superblockId: uuid('superblock_id'),
    tileName: varchar('tile_name', { length: 50 }),
    tileStart: integer('tile_start'),
    tileEnd: integer('tile_end'),
    mutagenesisStart: integer('mutagenesis_start'),
    mutagenesisEnd: integer('mutagenesis_end'),
    retrieverPrimerForwardId: uuid('retriever_primer_forward_id'),
    retrieverPrimerReverseId: uuid('retriever_primer_reverse_id'),
    superblockFirst: boolean('superblock_first'),
    superblockLast: boolean('superblock_last'),
    tileLength: integer('tile_length'),
    mutagenesisLength: integer('mutagenesis_length'),
    retrieverPrimerFSeq: varchar('retriever_primer_f_seq'),
    bsa1PlusOneSeq: varchar('bsa1_plusone_seq'),
    bsa1PlusOneNtermOverhangSeq: varchar('bsa1_plusone_nterm_overhang_seq'),
    superblockNtermRestrictionEnzymeSeq: varchar('superblock_nterm_restriction_enzyme_seq'),
    tileSeq: varchar('tile_seq'),
    superblockCtermRestrictionEnzymeSeqRevComp: varchar('superblock_cterm_restriction_enzyme_seq_rev_comp'),
    bsa1PlusOneCtermOverhangSeq: varchar('bsa1_plusone_cterm_overhang_seq'),
    bsa1PlusOneSeqRevComp: varchar('bsa1_plusone_seq_rev_comp'),
    retrieverPrimerRSeqRevComp: varchar('retriever_primer_r_seq_rev_comp'),
    restrictionEnzymeName: varchar('restriction_enzyme_name'),
    fullSequence: varchar('full_sequence'),
}).as(sql`select *,
    concat(retriever_primer_f_seq, bsa1_plusone_seq, bsa1_plusone_nterm_overhang_seq, superblock_nterm_restriction_enzyme_seq, tile_seq, superblock_cterm_restriction_enzyme_seq_rev_comp, bsa1_plusone_cterm_overhang_seq, bsa1_plusone_seq_rev_comp, retriever_primer_r_seq_rev_comp) as full_sequence
    from (
        select
        ${tiles.id},
        ${tiles.superblockId},
        ${tiles.tileName},
        ${tiles.tileStart},
        ${tiles.tileEnd},
        ${tiles.mutagenesisStart},
        ${tiles.mutagenesisEnd},
        ${tiles.retrieverPrimerForwardId},
        ${tiles.retrieverPrimerReverseId},
        ${tiles.superblockFirst},
        ${tiles.superblockLast},
        ${tiles.tileEnd} - ${tiles.tileStart} + 1 as tile_length,
        ${tiles.mutagenesisEnd} - ${tiles.mutagenesisStart} + 1 as mutagenesis_length,
        "retriever_primer_f"."seq" as retriever_primer_f_seq,
        'GGTCTCT' as bsa1_plusone_seq,
        case when ${tiles.superblockFirst} then 'CGTC' end as bsa1_plusone_nterm_overhang_seq,
        case when ${tiles.superblockFirst} then ${restrictionEnzymes.recogSeqPlusOverhang} end as superblock_nterm_restriction_enzyme_seq,
        substring(${superblocks.seq} from ${tiles.tileStart} for ${tiles.tileEnd} - ${tiles.tileStart} + 1) as tile_seq,
        case when ${tiles.superblockLast} then ${restrictionEnzymes.recogSeqPlusOverhangRevComp} end as superblock_cterm_restriction_enzyme_seq_rev_comp,
        case when ${tiles.superblockLast} then 'GCAT' end as bsa1_plusone_cterm_overhang_seq,
        'AGAGACC' as bsa1_plusone_seq_rev_comp,
        "retriever_primer_r"."seq_rev_comp" as retriever_primer_r_seq_rev_comp,
        ${restrictionEnzymes.name} as restriction_enzyme_name
        from ${tiles}
        join ${superblocks} on ${eq(tiles.superblockId, superblocks.id)}
        join ${projects} on ${eq(superblocks.projectId, projects.id)}
        join ${restrictionEnzymes} on ${eq(projects.restrictionEnzymeId, restrictionEnzymes.id)}
        join ${retrieverPrimers} as retriever_primer_f on ${tiles.retrieverPrimerForwardId} = "retriever_primer_f"."id"
        join ${retrieverPrimers} as retriever_primer_r on ${tiles.retrieverPrimerReverseId} = "retriever_primer_r"."id")`
)

// Generates the gblock sequences that flank each tile. For a given tile, the gblock(s)
// cover the rest of its superblock: the 5' gblock spans the superblock N-terminus up to
// the tile, the 3' gblock spans from the tile to the C-terminus. Assembled (Golden Gate)
// with the tile they reconstitute the full superblock sequence. A first tile
// (superblockFirst) has no 5' gblock; a last tile (superblockLast) has no 3' gblock, so
// each tile yields one row per existing gblock piece (side = '5-prime' / '3-prime').
//
// The gblock core is sliced on the tile boundaries (tileStart/tileEnd) with a 4 bp overlap
// into the tile: the 5' core runs to tileStart+3 and the 3' core starts at tileEnd-3, so
// each gblock shares the 4 bp Golden Gate junction with the tile it flanks. This matches the
// design notebook, which cuts each piece at the block breakpoint + 4 bp overlap. (Slicing on
// the mutagenesis window instead is wrong: that window is codon-rounded and lands 0-2 bp
// short of the breakpoint, making the gblock 0-2 bp too long at the junction.) The
// superblock-terminal end of each gblock carries the same BsaI overhang ('CGTC'/'GCAT') +
// restriction-enzyme caps as the oligo view.
//
// When the parent project's apply_capseq_to_gblocks is true, each gblock is additionally
// flanked by the constant capseq oligos (gbl_capseq_F prepended, reverse-complement of
// gbl_capseq_R appended), matching the design notebook.
//
// gblock_seq is the assembled (unpadded) sequence — gblock_seq + tile reconstitutes the
// superblock. gblock_order_seq is the orderable sequence: per the notebook's Twist 300 bp
// minimum, when gblock_seq is shorter than 300 bp the leading (300 - length) bases of a
// fixed random pad (randomsequencepad) are prepended (gblock_pad_seq); otherwise the pad is
// empty and gblock_order_seq == gblock_seq. The pad sits 5' of everything (outside the BsaI
// site) so it never affects assembly.
export const viewTileGblocks = pgView('view_tile_gblocks', {
    id: varchar('id'),
    tileId: uuid('tile_id'),
    superblockId: uuid('superblock_id'),
    tileName: varchar('tile_name', { length: 50 }),
    side: varchar('side'),
    superblockFirst: boolean('superblock_first'),
    superblockLast: boolean('superblock_last'),
    mutagenesisStart: integer('mutagenesis_start'),
    mutagenesisEnd: integer('mutagenesis_end'),
    restrictionEnzymeName: varchar('restriction_enzyme_name'),
    applyCapseqToGblocks: boolean('apply_capseq_to_gblocks'),
    gblockCapseqFSeq: varchar('gblock_capseq_f_seq'),
    gblockNtermOverhangSeq: varchar('gblock_nterm_overhang_seq'),
    gblockNtermRestrictionEnzymeSeq: varchar('gblock_nterm_restriction_enzyme_seq'),
    gblockCoreSeq: varchar('gblock_core_seq'),
    gblockCtermRestrictionEnzymeSeqRevComp: varchar('gblock_cterm_restriction_enzyme_seq_rev_comp'),
    gblockCtermOverhangSeq: varchar('gblock_cterm_overhang_seq'),
    gblockCapseqRRevCompSeq: varchar('gblock_capseq_r_rev_comp_seq'),
    gblockSeq: varchar('gblock_seq'),
    gblockPadSeq: varchar('gblock_pad_seq'),
    gblockOrderSeq: varchar('gblock_order_seq'),
}).as(sql`select *,
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
            ${tiles.id} as tile_id,
            ${tiles.superblockId},
            ${tiles.tileName},
            ${tiles.superblockFirst},
            ${tiles.superblockLast},
            ${tiles.tileStart},
            ${tiles.tileEnd},
            ${tiles.mutagenesisStart},
            ${tiles.mutagenesisEnd},
            ${superblocks.seq} as seq,
            ${restrictionEnzymes.name} as restriction_enzyme_name,
            ${restrictionEnzymes.recogSeqPlusOverhang} as recog_seq_plus_overhang,
            ${restrictionEnzymes.recogSeqPlusOverhangRevComp} as recog_seq_plus_overhang_rev_comp,
            ${projects.applyCapseqToGblocks} as apply_capseq_to_gblocks
            from ${tiles}
            join ${superblocks} on ${eq(tiles.superblockId, superblocks.id)}
            join ${projects} on ${eq(superblocks.projectId, projects.id)}
            join ${restrictionEnzymes} on ${eq(projects.restrictionEnzymeId, restrictionEnzymes.id)}
        ) base
        cross join (values ('5-prime'), ('3-prime')) as g(side)
        where (g.side = '5-prime' and not coalesce(base.superblock_first, false))
           or (g.side = '3-prime' and not coalesce(base.superblock_last, false))
            ) gblocks
        ) assembled
    ) padded`
)

export const viewTileVariantsWithSequences = pgView('view_tile_variants_with_sequences', {
    id: uuid('id'),
    tileId: uuid('tile_id'),
    aaPosition: integer('aa_position'),
    aaRef: varchar('aa_ref'),
    aaAlt: varchar('aa_alt'),
    ntPosition: integer('nt_position'),
    ntRef: varchar('nt_ref'),
    ntAlt: varchar('nt_alt'),
    superblockId: uuid('superblock_id'),
    tileName: varchar('tile_name', { length: 50 }),
    tileStart: integer('tile_start'),
    tileEnd: integer('tile_end'),
    mutagenesisStart: integer('mutagenesis_start'),
    mutagenesisEnd: integer('mutagenesis_end'),
    retrieverPrimerForwardId: uuid('retriever_primer_forward_id'),
    retrieverPrimerReverseId: uuid('retriever_primer_reverse_id'),
    superblockFirst: boolean('superblock_first'),
    superblockLast: boolean('superblock_last'),
    tileLength: integer('tile_length'),
    mutagenesisLength: integer('mutagenesis_length'),
    retrieverPrimerFSeq: varchar('retriever_primer_f_seq'),
    bsa1PlusOneSeq: varchar('bsa1_plusone_seq'),
    bsa1PlusOneNtermOverhangSeq: varchar('bsa1_plusone_nterm_overhang_seq'),
    superblockNtermRestrictionEnzymeSeq: varchar('superblock_nterm_restriction_enzyme_seq'),
    tileSeq: varchar('tile_seq'),
    superblockCtermRestrictionEnzymeSeqRevComp: varchar('superblock_cterm_restriction_enzyme_seq_rev_comp'),
    bsa1PlusOneCtermOverhangSeq: varchar('bsa1_plusone_cterm_overhang_seq'),
    bsa1PlusOneSeqRevComp: varchar('bsa1_plusone_seq_rev_comp'),
    retrieverPrimerRSeqRevComp: varchar('retriever_primer_r_seq_rev_comp'),
    restrictionEnzymeName: varchar('restriction_enzyme_name'),
    fullSequence: varchar('full_sequence'),
}).as(sql`select *,
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
        join view_tiles_with_sequences on tile_variants.tile_id = view_tiles_with_sequences.id)`)
