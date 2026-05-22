import { describe, expect, it } from 'vitest'
import { wellableTableNames } from '../../shared/utils/constants'

// ── wellableTableNames constant ────────────────────────────────────────────
// Guards that the wellableTableNames constant is still importable and has the
// expected shape after the appConstants refactor (enumLookups moved to DB).

describe('wellableTableNames constant', () => {
    it('is importable and is an array', () => {
        expect(Array.isArray(wellableTableNames)).toBe(true)
    })
})
