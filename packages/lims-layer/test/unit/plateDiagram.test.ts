import { describe, expect, it } from 'vitest'
import { VALID_WELL_COLORS, leastUsedWellColor } from '../../shared/lib/plate-diagram'

// ── leastUsedWellColor ─────────────────────────────────────────────────────
// Backs usePlateLayout's nextColorToUse. The regression it guards: ranking only the
// colours already in use returns undefined once every palette colour is taken, which
// renders the source plate's wells grey.

describe('leastUsedWellColor', () => {
    it('returns the first palette colour when nothing is in use', () => {
        expect(leastUsedWellColor({})).toBe(VALID_WELL_COLORS[0])
    })

    it('prefers an unused colour over a used one', () => {
        const counts = { [VALID_WELL_COLORS[0]!]: 3 }
        expect(leastUsedWellColor(counts)).toBe(VALID_WELL_COLORS[1])
    })

    it('counts the synced plate against a colour too', () => {
        // free on this plate, but taken on the synced one — the next colour should win
        const synced = { [VALID_WELL_COLORS[0]!]: 1 }
        expect(leastUsedWellColor({}, synced)).toBe(VALID_WELL_COLORS[1])
    })

    it('sums this plate and the synced plate when ranking', () => {
        const counts = { [VALID_WELL_COLORS[0]!]: 1, [VALID_WELL_COLORS[1]!]: 2 }
        const synced = { [VALID_WELL_COLORS[0]!]: 2, [VALID_WELL_COLORS[1]!]: 0 }
        // colour 0 totals 3, colour 1 totals 2 — but colour 2 is untouched and wins
        expect(leastUsedWellColor(counts, synced)).toBe(VALID_WELL_COLORS[2])
    })

    it('still returns a colour once the synced plate has taken every one', () => {
        const synced: Record<string, number> = {}
        VALID_WELL_COLORS.forEach((color) => { synced[color] = 1 })
        // the whole palette is saturated; reuse the least-used rather than returning undefined
        expect(leastUsedWellColor({}, synced)).toBe(VALID_WELL_COLORS[0])
    })

    it('reuses the least-used colour when the palette is saturated unevenly', () => {
        const synced: Record<string, number> = {}
        VALID_WELL_COLORS.forEach((color) => { synced[color] = 2 })
        synced[VALID_WELL_COLORS[5]!] = 1
        expect(leastUsedWellColor({}, synced)).toBe(VALID_WELL_COLORS[5])
    })
})
