import { describe, expect, it } from 'vitest'
import { recordStatusLabel, recordStatusLink, recordStatusTag } from '../../app/utils/recordStatus'

// The {value, label, desc} shape the standalone repo also handled came from its ?expandEnums=true
// API, which the monorepo does not have — status arrives either bare or, once SmartTable has
// rewritten a column with a format function, as {originalValue, displayValue}.

describe('recordStatusLabel', () => {
    it('resolves the label for a bare enum value', () => {
        expect(recordStatusLabel('next-step-ready')).toBe('Next step ready')
    })

    it('returns an empty string for an unset status', () => {
        expect(recordStatusLabel(null)).toBe('')
        expect(recordStatusLabel(undefined)).toBe('')
    })

    it('returns an empty string for a value with no lookup entry', () => {
        expect(recordStatusLabel('retired-value')).toBe('')
    })

    // SmartTable rewrites a column that has a format function to {originalValue, displayValue}, so
    // the element/export/search callbacks see this shape rather than the raw value
    it('resolves the label after SmartTable has rewritten the column', () => {
        expect(recordStatusLabel({ originalValue: 'complete', displayValue: 'Complete' })).toBe('Complete')
    })
})

describe('recordStatusTag', () => {
    it('renders a tag carrying the label and the status colour', () => {
        const tag = recordStatusTag('complete')
        expect(tag).toContain('>Complete<')
        expect(tag).toContain('bg-emerald-100')
        expect(tag).toContain('rounded-full')
    })

    it('gives each status a distinct colour', () => {
        const colors = ['not-started', 'in-progress', 'on-hold', 'next-step-ready', 'complete', 'discarded']
            .map((s) => (recordStatusTag(s).match(/bg-([a-z]+)-100/) ?? [])[1])
        expect(colors).toEqual(['slate', 'blue', 'amber', 'violet', 'emerald', 'red'])
        expect(new Set(colors).size).toBe(6)
    })

    it('renders the same tag whether the status is bare or rewritten', () => {
        const expected = recordStatusTag('on-hold')
        expect(recordStatusTag({ originalValue: 'on-hold', displayValue: 'On hold' })).toBe(expected)
    })

    it('renders nothing for an unset or unknown status', () => {
        expect(recordStatusTag(null)).toBe('')
        expect(recordStatusTag({ originalValue: null, displayValue: '' })).toBe('')
        expect(recordStatusTag('retired-value')).toBe('')
    })
})

describe('recordStatusLink', () => {
    it('links to the record and carries its name', () => {
        const link = recordStatusLink('in-progress', 'BRCA1_X1_AMP', '/snv-lib-amp-products?id=abc')
        expect(link).toContain('href="/snv-lib-amp-products?id=abc"')
        expect(link).toContain('>BRCA1_X1_AMP<')
    })

    it('colours by status and shows the status label as the tooltip', () => {
        expect(recordStatusLink('on-hold', 'x', '/y')).toContain('bg-amber-100')
        expect(recordStatusLink('on-hold', 'x', '/y')).toContain('title="On hold"')
    })

    it('falls back to a neutral tag when the record has no status', () => {
        const link = recordStatusLink(null, 'CLONAL_HA_1', '/clonal-has?id=abc')
        expect(link).toContain('title="No status set"')
        expect(link).toContain('bg-white')
        expect(link).not.toContain('bg-slate-100')
    })

    it('escapes the name and href, since the column is injected as raw HTML', () => {
        const link = recordStatusLink('complete', 'a"><script>b', '/x?n="y')
        expect(link).not.toContain('<script>')
        expect(link).toContain('&quot;')
    })
})
