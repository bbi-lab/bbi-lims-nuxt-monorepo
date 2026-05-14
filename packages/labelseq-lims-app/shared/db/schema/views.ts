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
        "retriever_primer_r"."seq_rev_comp" as retriever_primer_r_seq_rev_comp
        from ${tiles}
        join ${superblocks} on ${eq(tiles.superblockId, superblocks.id)}
        join ${projects} on ${eq(superblocks.projectId, projects.id)}
        join ${restrictionEnzymes} on ${eq(projects.restrictionEnzymeId, restrictionEnzymes.id)}
        join ${retrieverPrimers} as retriever_primer_f on ${tiles.retrieverPrimerForwardId} = "retriever_primer_f"."id"
        join ${retrieverPrimers} as retriever_primer_r on ${tiles.retrieverPrimerReverseId} = "retriever_primer_r"."id")`
)
