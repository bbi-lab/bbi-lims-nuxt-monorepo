// Colors mirrored from lims-layer/shared/lib/plate-diagram.ts
const VALID_COLORS = [
    '#0075DC', '#F0A3FF', '#993F00', '#4C005C', '#005C31',
    '#2BCE48', '#FFCC99', '#94FFB5', '#8F7C00', '#9DCC00',
    '#C20088', '#003380', '#FFA405', '#FFA8BB', '#426600',
    '#FF0010', '#5EF1F2', '#00998F', '#E0FF66', '#740AFF',
    '#990000', '#FFFF80', '#FFE100', '#FF5005',
]

export interface OligoItem {
    label: string
    type: string
    sequence: string
}

/**
 * Convert a row from the view-tiles-with-sequences API into an ordered
 * array of OligoItem objects suitable for the OligoViewer component.
 * Entries with null/empty sequences (conditional columns) are omitted.
 */
export function buildOligoItems(tile: Record<string, any>): OligoItem[] {
    const superblockRestrictionEnzymeName = tile.restrictionEnzymeName ?? 'RE Site'

    const items: OligoItem[] = []
    if (tile.retrieverPrimerFSeq) {
        items.push({ label: 'Forward Primer', type: 'Forward Primer', sequence: tile.retrieverPrimerFSeq })
    }
    if (tile.bsa1PlusOneSeq) {
        items.push({ label: 'BsaI+1', type: 'BsaI', sequence: tile.bsa1PlusOneSeq })
    }
    if (tile.bsa1PlusOneNtermOverhangSeq) {
        items.push({ label: 'BsaI Overhang', type: 'BsaI Overhang', sequence: tile.bsa1PlusOneNtermOverhangSeq })
    }
    if (tile.superblockNtermRestrictionEnzymeSeq) {
        items.push({ label: superblockRestrictionEnzymeName, type: superblockRestrictionEnzymeName, sequence: tile.superblockNtermRestrictionEnzymeSeq })
    }
    if (tile.tileSeq) {
        items.push({ label: 'Tile Sequence', type: 'Tile Sequence', sequence: tile.tileSeq })
    }
    if (tile.superblockCtermRestrictionEnzymeSeqRevComp) {
        items.push({ label:  `${superblockRestrictionEnzymeName} (RC)`, type: superblockRestrictionEnzymeName, sequence: tile.superblockCtermRestrictionEnzymeSeqRevComp })
    }
    if (tile.bsa1PlusOneCtermOverhangSeq) {
        items.push({ label: 'BsaI Overhang', type: 'BsaI Overhang', sequence: tile.bsa1PlusOneCtermOverhangSeq })
    }
    if (tile.bsa1PlusOneSeqRevComp) {
        items.push({ label: 'BsaI+1 (RC)', type: 'BsaI', sequence: tile.bsa1PlusOneSeqRevComp })
    }
    if (tile.retrieverPrimerRSeqRevComp) {
        items.push({ label: 'Reverse Primer (RC)', type: 'Reverse Primer', sequence: tile.retrieverPrimerRSeqRevComp })
    }
    return items
}

/**
 * Convert a row from the view-tile-gblocks API into an ordered (5' -> 3')
 * array of OligoItem objects for the OligoViewer. The items concatenate to the
 * full orderable gblock (gblockOrderSeq), including the leading random pad.
 * Entries with null/empty sequences (the side-specific caps and the empty pad)
 * are omitted. Shared `type` names ('BsaI Overhang', the restriction-enzyme
 * name) match buildOligoItems so a shared color map stays consistent across the
 * tile and gblock viewers.
 */
export function buildGblockOligoItems(gblock: Record<string, any>): OligoItem[] {
    const reName = gblock.restrictionEnzymeName ?? 'RE Site'

    const items: OligoItem[] = []
    if (gblock.gblockPadSeq) {
        items.push({ label: 'Random Pad', type: 'Random Pad', sequence: gblock.gblockPadSeq })
    }
    if (gblock.gblockCapseqFSeq) {
        items.push({ label: 'Capseq F', type: 'Capseq', sequence: gblock.gblockCapseqFSeq })
    }
    if (gblock.gblockNtermOverhangSeq) {
        items.push({ label: 'BsaI Overhang', type: 'BsaI Overhang', sequence: gblock.gblockNtermOverhangSeq })
    }
    if (gblock.gblockNtermRestrictionEnzymeSeq) {
        items.push({ label: reName, type: reName, sequence: gblock.gblockNtermRestrictionEnzymeSeq })
    }
    if (gblock.gblockCoreSeq) {
        items.push({ label: 'Gblock Core', type: 'Gblock Core', sequence: gblock.gblockCoreSeq })
    }
    if (gblock.gblockCtermRestrictionEnzymeSeqRevComp) {
        items.push({ label: `${reName} (RC)`, type: reName, sequence: gblock.gblockCtermRestrictionEnzymeSeqRevComp })
    }
    if (gblock.gblockCtermOverhangSeq) {
        items.push({ label: 'BsaI Overhang', type: 'BsaI Overhang', sequence: gblock.gblockCtermOverhangSeq })
    }
    if (gblock.gblockCapseqRRevCompSeq) {
        items.push({ label: 'Capseq R (RC)', type: 'Capseq', sequence: gblock.gblockCapseqRRevCompSeq })
    }
    return items
}

/**
 * Build a shared color map from all OligoItems across multiple tiles so that
 * every OligoViewer on the same page uses a consistent color scheme.
 *
 * Types are assigned colors in the order they first appear, scanning tiles
 * left-to-right in the provided array.
 */
export function buildSharedOligoColorMap(allTilesItems: OligoItem[][]): Record<string, string> {
    const map: Record<string, string> = {}
    let colorIndex = 0
    for (const items of allTilesItems) {
        for (const item of items) {
            if (!(item.type in map)) {
                map[item.type] = VALID_COLORS[colorIndex % VALID_COLORS.length]!
                colorIndex++
            }
        }
    }
    return map
}
