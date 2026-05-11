import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { Ref } from 'vue'
import {
    formatFieldLabel,
    isValidUrl,
    sanitizeFormValues,
    isZodFieldReadonly,
    getBlankFormInitialValues,
    getFormFieldDefinition,
    getFormErrorMessage,
    createMultiEditResolver,
    buildFormFields,
    type CombinedRecordEntry,
} from '../../app/utils/formUtils'

/** Minimal ref-like wrapper so we don't need the full vue package in unit tests. */
function fakeRef<T>(val: T): Ref<T> {
    return { value: val } as Ref<T>
}

// ── formatFieldLabel ───────────────────────────────────────────────────────

describe('formatFieldLabel', () => {
    it('converts camelCase to Start Case', () => {
        expect(formatFieldLabel('firstName')).toBe('First Name')
    })

    it('uppercases DNA', () => {
        expect(formatFieldLabel('dnaSequence')).toBe('DNA Sequence')
    })

    it('uppercases RNA', () => {
        expect(formatFieldLabel('rnaGene')).toBe('RNA Gene')
    })

    it('uppercases PCR', () => {
        expect(formatFieldLabel('pcrResult')).toBe('PCR Result')
    })

    it('replaces Pct with %', () => {
        expect(formatFieldLabel('pctIdentity')).toBe('% Identity')
    })

    it('handles single word', () => {
        expect(formatFieldLabel('name')).toBe('Name')
    })

    it('handles combined acronyms', () => {
        expect(formatFieldLabel('dnaRnaRatio')).toBe('DNA RNA Ratio')
    })
})

// ── isValidUrl ─────────────────────────────────────────────────────────────

describe('isValidUrl', () => {
    it('accepts https URLs', () => {
        expect(isValidUrl('https://example.com')).toBe(true)
    })

    it('accepts http URLs with port', () => {
        expect(isValidUrl('http://localhost:3000')).toBe(true)
    })

    it('rejects plain text', () => {
        expect(isValidUrl('not-a-url')).toBe(false)
    })

    it('rejects empty string', () => {
        expect(isValidUrl('')).toBe(false)
    })

    it('accepts URLs with paths', () => {
        expect(isValidUrl('https://example.com/path/to/resource?q=1')).toBe(true)
    })
})

// ── sanitizeFormValues ─────────────────────────────────────────────────────

describe('sanitizeFormValues', () => {
    it('converts empty strings to null', () => {
        expect(sanitizeFormValues({ name: '', age: 5 })).toEqual({ name: null, age: 5 })
    })

    it('preserves non-empty values', () => {
        const input = { name: 'John', active: true }
        expect(sanitizeFormValues(input)).toEqual({ name: 'John', active: true })
    })

    it('preserves arrays', () => {
        expect(sanitizeFormValues({ arr: [] })).toEqual({ arr: [] })
    })

    it('preserves null values', () => {
        expect(sanitizeFormValues({ field: null })).toEqual({ field: null })
    })

    it('preserves numbers including zero', () => {
        expect(sanitizeFormValues({ count: 0 })).toEqual({ count: 0 })
    })
})

// ── isZodFieldReadonly ─────────────────────────────────────────────────────

describe('isZodFieldReadonly', () => {
    it('returns true for z.string().readonly()', () => {
        const schema = z.object({ field: z.string().readonly() })
        expect(isZodFieldReadonly(schema, 'field')).toBe(true)
    })

    it('returns true for z.string().nullable().readonly() (traverses wrappers)', () => {
        const schema = z.object({ field: z.string().nullable().readonly() })
        expect(isZodFieldReadonly(schema, 'field')).toBe(true)
    })

    it('returns true for z.string().optional().readonly()', () => {
        const schema = z.object({ field: z.string().optional().readonly() })
        expect(isZodFieldReadonly(schema, 'field')).toBe(true)
    })

    it('returns false for z.string()', () => {
        const schema = z.object({ field: z.string() })
        expect(isZodFieldReadonly(schema, 'field')).toBe(false)
    })

    it('returns false for z.string().optional()', () => {
        const schema = z.object({ field: z.string().optional() })
        expect(isZodFieldReadonly(schema, 'field')).toBe(false)
    })

    it('returns false for non-existent field', () => {
        const schema = z.object({ field: z.string() })
        expect(isZodFieldReadonly(schema, 'missing')).toBe(false)
    })
})

// ── getBlankFormInitialValues ──────────────────────────────────────────────

describe('getBlankFormInitialValues', () => {
    it('returns null for string fields', () => {
        const schema = z.object({ name: z.string() })
        expect(getBlankFormInitialValues(schema)).toEqual({ name: null })
    })

    it('returns empty array for array fields', () => {
        const schema = z.object({ tags: z.array(z.string()) })
        expect(getBlankFormInitialValues(schema)).toEqual({ tags: [] })
    })

    it('returns null for number fields', () => {
        const schema = z.object({ age: z.number() })
        expect(getBlankFormInitialValues(schema)).toEqual({ age: null })
    })

    it('returns null for boolean fields', () => {
        const schema = z.object({ active: z.boolean() })
        expect(getBlankFormInitialValues(schema)).toEqual({ active: null })
    })

    it('uses fieldConfig defaultValue when provided', () => {
        const schema = z.object({ name: z.string() })
        const fieldConfigs = { name: { defaultValue: 'foo' } }
        expect(getBlankFormInitialValues(schema, fieldConfigs)).toEqual({ name: 'foo' })
    })

    it('uses fieldConfig defaultValue for arrays', () => {
        const schema = z.object({ tags: z.array(z.string()) })
        const fieldConfigs = { tags: { defaultValue: ['a', 'b'] } }
        expect(getBlankFormInitialValues(schema, fieldConfigs)).toEqual({ tags: ['a', 'b'] })
    })

    it('handles nullable fields (returns null)', () => {
        const schema = z.object({ field: z.string().nullable() })
        expect(getBlankFormInitialValues(schema)).toEqual({ field: null })
    })

    it('handles optional fields (returns null)', () => {
        const schema = z.object({ field: z.string().optional() })
        expect(getBlankFormInitialValues(schema)).toEqual({ field: null })
    })

    it('handles multiple fields together', () => {
        const schema = z.object({
            name: z.string(),
            age: z.number(),
            tags: z.array(z.string()),
            active: z.boolean(),
        })
        expect(getBlankFormInitialValues(schema)).toEqual({
            name: null,
            age: null,
            tags: [],
            active: null,
        })
    })
})

// ── getFormErrorMessage ────────────────────────────────────────────────────

describe('getFormErrorMessage', () => {
    it('converts ", received null" to "Required"', () => {
        const form = { email: { error: { message: 'Expected string, received null' } } }
        expect(getFormErrorMessage(form, 'email')).toBe('Required')
    })

    it('converts ", received undefined" to "Required"', () => {
        const form = { email: { error: { message: 'Expected string, received undefined' } } }
        expect(getFormErrorMessage(form, 'email')).toBe('Required')
    })

    it('passes through other error messages unchanged', () => {
        const form = { email: { error: { message: 'Must be at least 8 characters' } } }
        expect(getFormErrorMessage(form, 'email')).toBe('Must be at least 8 characters')
    })

    it('returns undefined when no error exists', () => {
        const form = { email: {} }
        expect(getFormErrorMessage(form, 'email')).toBeUndefined()
    })
})

// ── getFormFieldDefinition ─────────────────────────────────────────────────

describe('getFormFieldDefinition', () => {
    it('maps z.string() to InputText', () => {
        const schema = z.object({ name: z.string() })
        const result = getFormFieldDefinition('name', schema)
        expect(result.primeVueComponent).toBe('InputText')
    })

    it('maps z.string() + inputType password to Password', () => {
        const schema = z.object({ pass: z.string() })
        const result = getFormFieldDefinition('pass', schema, { inputType: 'password' })
        expect(result.primeVueComponent).toBe('Password')
    })

    it('maps z.string() + inputType textarea to Textarea', () => {
        const schema = z.object({ notes: z.string() })
        const result = getFormFieldDefinition('notes', schema, { inputType: 'textarea' })
        expect(result.primeVueComponent).toBe('Textarea')
    })

    it('maps z.number() to SmartFormInputNumber', () => {
        const schema = z.object({ age: z.number() })
        const result = getFormFieldDefinition('age', schema)
        expect(result.primeVueComponent).toBe('SmartFormInputNumber')
    })

    it('maps z.boolean() to Checkbox with binary=true', () => {
        const schema = z.object({ active: z.boolean() })
        const result = getFormFieldDefinition('active', schema)
        expect(result.primeVueComponent).toBe('Checkbox')
        expect(result.vBindObject).toHaveProperty('binary', true)
    })

    it('maps z.date() to DatePicker', () => {
        const schema = z.object({ createdAt: z.date() })
        const result = getFormFieldDefinition('createdAt', schema)
        expect(result.primeVueComponent).toBe('DatePicker')
    })

    it('maps z.enum() to Select with options', () => {
        const schema = z.object({ status: z.enum(['active', 'inactive']) })
        const result = getFormFieldDefinition('status', schema)
        expect(result.primeVueComponent).toBe('Select')
        expect(result.vBindObject).toHaveProperty('options')
        expect(result.vBindObject).toHaveProperty('optionLabel', 'name')
        expect(result.vBindObject).toHaveProperty('optionValue', 'code')
    })

    it('maps z.array() to SmartFormInputArray with itemSchema', () => {
        const schema = z.object({ tags: z.array(z.string()) })
        const result = getFormFieldDefinition('tags', schema)
        expect(result.primeVueComponent).toBe('SmartFormInputArray')
        expect(result.vBindObject).toHaveProperty('itemSchema')
    })

    it('maps fieldConfig with autoCompleter to SmartFormAutoCompleter', () => {
        const schema = z.object({ userId: z.string() })
        const fieldConfig = {
            autoCompleter: {
                searchBaseUrl: '/api/users',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
            },
        }
        const result = getFormFieldDefinition('userId', schema, fieldConfig)
        expect(result.primeVueComponent).toBe('SmartFormAutoCompleter')
        expect(result.vBindObject).toHaveProperty('searchBaseUrl', '/api/users')
    })

    it('maps fieldConfig with nestedSelect to SmartFormNestedSelect', () => {
        const schema = z.object({ subCategoryId: z.string() })
        const fieldConfig = {
            nestedSelect: {
                parentSearchBaseUrl: '/api/categories',
                parentKeyField: 'categoryId',
                searchBaseUrl: '/api/subcategories',
            },
        }
        const result = getFormFieldDefinition('subCategoryId', schema, fieldConfig)
        expect(result.primeVueComponent).toBe('SmartFormNestedSelect')
    })

    it('throws for unrecognized Zod type', () => {
        // z.literal creates a type with def.type = 'literal' which isn't mapped
        const schema = z.object({ val: z.literal('fixed') })
        expect(() => getFormFieldDefinition('val', schema)).toThrow(
            /Could not determine PrimeVue component for "val"/,
        )
    })

    it('uses fieldConfig label when provided', () => {
        const schema = z.object({ name: z.string() })
        const result = getFormFieldDefinition('name', schema, { label: 'Full Name' })
        expect(result.label).toBe('Full Name')
    })

    it('handles nullable string fields', () => {
        const schema = z.object({ name: z.string().nullable() })
        const result = getFormFieldDefinition('name', schema)
        expect(result.primeVueComponent).toBe('InputText')
    })

    it('handles optional number fields', () => {
        const schema = z.object({ age: z.number().optional() })
        const result = getFormFieldDefinition('age', schema)
        expect(result.primeVueComponent).toBe('SmartFormInputNumber')
    })

    it('passes extra fieldConfig props to vBindObject', () => {
        const schema = z.object({ name: z.string() })
        const result = getFormFieldDefinition('name', schema, { disabled: true })
        expect(result.vBindObject).toHaveProperty('disabled', true)
    })
})

// ── buildFormFields ────────────────────────────────────────────────────────

describe('buildFormFields', () => {
    it('builds field descriptors from schema', () => {
        const schema = z.object({ name: z.string(), active: z.boolean() })
        const componentMap: Record<string, string> = {
            InputText: 'InputText',
            Checkbox: 'Checkbox',
        }
        const fields = buildFormFields(schema, undefined, componentMap)
        expect(fields).toHaveLength(2)
        expect(fields[0]).toMatchObject({ id: 'name', name: 'name', component: 'InputText' })
        expect(fields[1]).toMatchObject({ id: 'active', name: 'active', component: 'Checkbox' })
    })

    it('disables readonly fields when no fieldConfig override', () => {
        const schema = z.object({ id: z.string().readonly() })
        const fields = buildFormFields(schema, undefined, { InputText: 'InputText' })
        expect(fields[0]!.vBindObject).toHaveProperty('disabled', true)
    })

    it('does not disable readonly field when fieldConfig sets disabled=false', () => {
        const schema = z.object({ id: z.string().readonly() })
        const fields = buildFormFields(schema, { id: { disabled: false } }, { InputText: 'InputText' })
        expect(fields[0]!.vBindObject).toHaveProperty('disabled', false)
    })

    it('uses fieldConfig label', () => {
        const schema = z.object({ name: z.string() })
        const fields = buildFormFields(schema, { name: { label: 'User Name' } }, { InputText: 'InputText' })
        expect(fields[0]!.label).toBe('User Name')
    })
})

// ── createMultiEditResolver ────────────────────────────────────────────────

describe('createMultiEditResolver', () => {
    const schema = z.object({
        name: z.string(),
        email: z.string(),
    })

    it('passes valid values', () => {
        const combinedRecord = fakeRef<Record<string, CombinedRecordEntry>>({
            name: { val: 'Alice' },
            email: { val: 'alice@test.com' },
        })
        const resolver = createMultiEditResolver(schema, combinedRecord)
        const result = resolver({ values: { name: 'Alice', email: 'alice@test.com' } })
        expect(result.errors).toEqual({})
    })

    it('fails when required field is null (no conflict)', () => {
        const combinedRecord = fakeRef<Record<string, CombinedRecordEntry>>({
            name: { val: 'Alice' },
            email: { val: null },
        })
        const resolver = createMultiEditResolver(schema, combinedRecord)
        const result = resolver({ values: { name: 'Alice', email: '' } })
        // empty string is sanitized to null → fails required string validation
        expect(Object.keys(result.errors)).toContain('email')
    })

    it('makes conflicting+untouched fields optional (does not fail)', () => {
        const combinedRecord = fakeRef<Record<string, CombinedRecordEntry>>({
            name: { val: 'Alice' },
            email: { val: null, conflictingValueCount: 3 },
        })
        const resolver = createMultiEditResolver(schema, combinedRecord)
        const result = resolver({ values: { name: 'Alice', email: '' } })
        // email is conflicting + untouched → made optional → null passes
        expect(result.errors).toEqual({})
    })

    it('validates conflicting field cleared by user (null fails required)', () => {
        const combinedRecord = fakeRef<Record<string, CombinedRecordEntry>>({
            name: { val: 'Alice' },
            email: { val: null, conflictingValueCount: 3, valClearedByUser: true },
        })
        const resolver = createMultiEditResolver(schema, combinedRecord)
        const result = resolver({ values: { name: 'Alice', email: '' } })
        // valClearedByUser=true → not treated as untouched → validates normally → fails
        expect(Object.keys(result.errors)).toContain('email')
    })

    it('sanitizes empty strings to null before validation', () => {
        const combinedRecord = fakeRef<Record<string, CombinedRecordEntry>>({
            name: { val: '' },
            email: { val: 'test@test.com' },
        })
        const resolver = createMultiEditResolver(schema, combinedRecord)
        const result = resolver({ values: { name: '', email: 'test@test.com' } })
        // name is empty string → sanitized to null → required string fails
        expect(Object.keys(result.errors)).toContain('name')
    })

    it('conflicting field with actual value set passes', () => {
        const combinedRecord = fakeRef<Record<string, CombinedRecordEntry>>({
            name: { val: 'Alice' },
            email: { val: 'new@test.com', conflictingValueCount: 3 },
        })
        const resolver = createMultiEditResolver(schema, combinedRecord)
        const result = resolver({ values: { name: 'Alice', email: 'new@test.com' } })
        // email has a value now → not null → passes even with conflictingValueCount
        expect(result.errors).toEqual({})
    })
})
