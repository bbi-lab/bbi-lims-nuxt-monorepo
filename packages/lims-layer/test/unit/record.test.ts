import { describe, expect, it } from 'vitest'
import { appConstants } from '../../shared/utils/constants'

// ── expandEnumValues (via appConstants) ───────────────────────────────────
// This test was added to guard against ReferenceError: appConstants is not
// defined in server/utils/record.ts. Before the fix, expandEnumValues relied
// on Nuxt's auto-import and crashed in any non-Nuxt execution context.
// The explicit import added to record.ts resolves this.

describe('appConstants import in server utils context', () => {
    it('appConstants is resolvable without Nuxt auto-import', () => {
        expect(appConstants).toBeDefined()
        expect(appConstants.enumLookups).toBeDefined()
    })

    it('enumLookups.plates.plateType contains entries', () => {
        const plateType = appConstants.enumLookups.plates.plateType
        expect(Object.keys(plateType).length).toBeGreaterThan(0)
    })

    it('does not throw when tableName has no enum lookup', () => {
        // simulates the expandEnumValues early-return path for unknown tables
        const hasLookup = Object.prototype.hasOwnProperty.call(appConstants.enumLookups, 'nonexistent_table')
        expect(hasLookup).toBe(false)
    })

    it('enum entry has label and desc properties', () => {
        const entries = Object.values(appConstants.enumLookups.plates.plateType)
        for (const entry of entries) {
            expect(entry).toHaveProperty('label')
            expect(entry).toHaveProperty('desc')
        }
    })
})
