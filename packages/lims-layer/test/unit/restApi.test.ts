import { describe, expect, it } from 'vitest'
import {
    queryToSelectParams,
    applySelectParamsToRecords,
    parsePutPostError,
} from '../../server/utils/restApi'
import type { QueryParams, SelectParams } from '../../server/utils/restApi'

// ── queryToSelectParams ────────────────────────────────────────────────────

describe('queryToSelectParams', () => {
    it('parses columns array string to keyed object', () => {
        const result = queryToSelectParams({
            columns: '["id","name"]',
        } as QueryParams)
        expect(result.columns).toEqual({ id: true, name: true })
    })

    it('passes columns object through as-is', () => {
        const result = queryToSelectParams({
            columns: '{"id":true,"name":true}',
        } as QueryParams)
        expect(result.columns).toEqual({ id: true, name: true })
    })

    it('parses where JSON Logic string', () => {
        const where = JSON.stringify({ '==': [{ var: 'name' }, 'test'] })
        const result = queryToSelectParams({ where } as QueryParams)
        expect(result.where).toEqual({ '==': [{ var: 'name' }, 'test'] })
    })

    it('parses with clause string', () => {
        const result = queryToSelectParams({
            with: '{"userGroup":{}}',
        } as QueryParams)
        expect(result.with).toEqual({ userGroup: {} })
    })

    it('parses order string', () => {
        const result = queryToSelectParams({
            order: '{"name":"asc"}',
        } as QueryParams)
        expect(result.order).toEqual({ name: 'asc' })
    })

    it('returns undefined for omitted parameters', () => {
        const result = queryToSelectParams({} as QueryParams)
        expect(result.where).toBeUndefined()
        expect(result.columns).toBeUndefined()
        expect(result.order).toBeUndefined()
        expect(result.with).toBeUndefined()
    })

    it('passes limit and offset through', () => {
        const result = queryToSelectParams({
            limit: 10,
            offset: 20,
        } as QueryParams)
        expect(result.limit).toBe(10)
        expect(result.offset).toBe(20)
    })
})

// ── applySelectParamsToRecords ─────────────────────────────────────────────

describe('applySelectParamsToRecords', () => {
    const records = [
        { id: '1', name: 'Alice', age: 30 },
        { id: '2', name: 'Bob', age: 25 },
        { id: '3', name: 'Charlie', age: 35 },
        { id: '4', name: 'Diana', age: 28 },
    ]

    it('filters records with JSON Logic equality', () => {
        const params: SelectParams = {
            where: { '==': [{ var: 'name' }, 'Bob'] },
        } as SelectParams
        const result = applySelectParamsToRecords(params, records)
        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({ name: 'Bob' })
    })

    it('returns all records when no where clause', () => {
        const result = applySelectParamsToRecords({} as SelectParams, records)
        expect(result).toHaveLength(4)
    })

    it('sorts records ascending', () => {
        const params: SelectParams = {
            order: { age: 'asc' },
        } as SelectParams
        const result = applySelectParamsToRecords(params, records) as typeof records
        expect(result[0]!.name).toBe('Bob')
        expect(result[result.length - 1]!.name).toBe('Charlie')
    })

    it('sorts records descending', () => {
        const params: SelectParams = {
            order: { age: 'desc' },
        } as SelectParams
        const result = applySelectParamsToRecords(params, records) as typeof records
        expect(result[0]!.name).toBe('Charlie')
    })

    it('applies limit', () => {
        const params: SelectParams = {
            limit: 2,
        } as SelectParams
        const result = applySelectParamsToRecords(params, records)
        expect(result).toHaveLength(2)
    })

    it('applies offset', () => {
        const params: SelectParams = {
            offset: 2,
        } as SelectParams
        const result = applySelectParamsToRecords(params, records)
        expect(result).toHaveLength(2)
        expect(result[0]).toMatchObject({ name: 'Charlie' })
    })

    it('applies offset + limit together', () => {
        const params: SelectParams = {
            offset: 1,
            limit: 2,
        } as SelectParams
        const result = applySelectParamsToRecords(params, records)
        expect(result).toHaveLength(2)
        expect(result[0]).toMatchObject({ name: 'Bob' })
        expect(result[1]).toMatchObject({ name: 'Charlie' })
    })

    it('filters with custom startsWith operator (case-insensitive)', () => {
        const params: SelectParams = {
            where: { startsWith: [{ var: 'name' }, 'al'] },
        } as SelectParams
        const result = applySelectParamsToRecords(params, records)
        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({ name: 'Alice' })
    })

    it('combines filter + sort + limit', () => {
        const params: SelectParams = {
            where: { '>': [{ var: 'age' }, 26] },
            order: { age: 'asc' },
            limit: 2,
        } as SelectParams
        const result = applySelectParamsToRecords(params, records) as typeof records
        expect(result).toHaveLength(2)
        expect(result[0]!.name).toBe('Diana')  // age 28
        expect(result[1]!.name).toBe('Alice')  // age 30
    })
})

// ── parsePutPostError ──────────────────────────────────────────────────────

describe('parsePutPostError', () => {
    it('parses unique constraint violation into structured error', () => {
        const error = {
            cause: {
                routine: '_bt_check_unique',
                detail: 'Key (email)=(test@test.com) already exists.',
            },
        }
        const result = parsePutPostError(error)
        expect(result.data).toEqual([
            {
                code: 'duplicate_key_value',
                path: ['email'],
                message: 'Must be unique',
                description: 'test@test.com already exists',
            },
        ])
    })

    it('handles SQL-wrapped field names in unique constraint', () => {
        const error = {
            cause: {
                routine: '_bt_check_unique',
                detail: 'Key (lower(trim(both from email)))=(test@test.com) already exists.',
            },
        }
        const result = parsePutPostError(error)
        expect(result.data).toEqual([
            {
                code: 'duplicate_key_value',
                path: ['email'],
                message: 'Must be unique',
                description: 'test@test.com already exists',
            },
        ])
    })

    it('falls back to JSON parsing of error message', () => {
        const errorData = [{ path: ['name'], message: 'too short' }]
        const error = { message: JSON.stringify(errorData) }
        const result = parsePutPostError(error)
        expect(result.data).toEqual(errorData)
    })

    it('returns empty object when message is not JSON', () => {
        const error = { message: 'something broke' }
        const result = parsePutPostError(error)
        expect(result.data).toEqual({})
    })

    it('returns the original error object', () => {
        const error = { message: 'test' }
        const result = parsePutPostError(error)
        expect(result.error).toBe(error)
    })
})
