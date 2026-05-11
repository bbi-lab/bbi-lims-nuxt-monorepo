import _ from 'lodash'
import jsonLogic, { type JsonLogicFilter, type JsonLogicAll  } from 'json-logic-js'
import { and, or, not, eq, ne, lt, lte, gt, gte, ilike, inArray, type SQL } from 'drizzle-orm'

export interface QueryParams {
    where: string,
    columns: string,
    order: string,
    limit: number,
    offset: number,
    with: string,
    expandEnums: string,
}

export interface SelectParams {
    where: JsonLogicAll,
    columns: { [key: string]: boolean },
    order: { [key: string]: 'asc' | 'desc' }
    limit: number,
    offset: number,
    with: any,
}

export function queryToSelectParams<SelectParams>(queryParams: QueryParams) {
    // if columns is array, convert to object with boolean property set to true for each entry
    const columnsToInclude = queryParams.columns ? (_.isArray(JSON.parse(queryParams.columns)) ? _.reduce(JSON.parse(queryParams.columns), (obj:any,key:string) => {
        obj[key] = true
        return obj
    }, {}) : JSON.parse(queryParams.columns)) : undefined

    const selectParams = {
        where: queryParams.where ? JSON.parse(queryParams.where) : undefined,
        columns: columnsToInclude,
        order: queryParams.order ? JSON.parse(queryParams.order) : undefined,
        limit: queryParams.limit,
        offset: queryParams.offset,
        with: queryParams.with ? JSON.parse(queryParams.with) : undefined
    } as SelectParams

    return selectParams
}

/**
 * Resolves a JSON Logic argument to either a Drizzle column (when it's a `{var}`
 * accessor) or the raw literal value.  Returns `null` when the column name is not
 * found in the provided fields map.
 */
function resolveArg(arg: unknown, getColumn: (name: string) => unknown): { column: unknown } | { value: unknown } | null {
    if (arg !== null && typeof arg === 'object' && 'var' in (arg as object)) {
        const varName = (arg as { var: string }).var
        const col = getColumn(varName)
        if (col == null) return null
        return { column: col }
    }
    // toLower(field) — treated as a no-op because ilike is already case-insensitive
    if (arg !== null && typeof arg === 'object' && 'toLower' in (arg as object)) {
        const inner = ((arg as { toLower: unknown[] }).toLower)[0]
        return resolveArg(inner, getColumn)
    }
    return { value: arg }
}

/**
 * Translates a JSON Logic `where` expression into a Drizzle `SQL` condition.
 *
 * Supported operators: `==`, `!=`, `<`, `<=`, `>`, `>=`, `and`, `or`, `!`,
 * `in` (value-in-array), `startsWith` (custom, maps to `ilike`).
 *
 * Returns `null` for any unsupported operator or unresolvable column reference —
 * callers should fall back to in-memory filtering in that case.
 *
 * @param logic  - JSON Logic expression (the `where` from SelectParams)
 * @param getColumn - function that maps a field name to its Drizzle column object
 */
export function jsonLogicToSql(logic: unknown, getColumn: (name: string) => unknown): SQL | null {
    if (logic === null || logic === undefined || typeof logic !== 'object') return null

    const entries = Object.entries(logic as object)
    if (entries.length !== 1) return null

    const [op, rawArgs] = entries[0]!
    const args: unknown[] = Array.isArray(rawArgs) ? rawArgs : [rawArgs]

    switch (op) {
        case '==':
        case '!=':
        case '<':
        case '<=':
        case '>':
        case '>=': {
            if (args.length < 2) return null
            const left = resolveArg(args[0], getColumn)
            const right = resolveArg(args[1], getColumn)
            if (!left || !right) return null
            // At least one side must be a column reference
            const col = 'column' in left ? left.column : ('column' in right ? right.column : null)
            const val = 'value' in right ? right.value : ('value' in left ? left.value : null)
            if (col == null) return null
            if (op === '==')  return eq(col as any, val as any)
            if (op === '!=')  return ne(col as any, val as any)
            if (op === '<')   return lt(col as any, val as any)
            if (op === '<=')  return lte(col as any, val as any)
            if (op === '>')   return gt(col as any, val as any)
            if (op === '>=')  return gte(col as any, val as any)
            return null
        }

        case 'and': {
            const parts = args.map(a => jsonLogicToSql(a, getColumn)).filter((s): s is SQL => s !== null)
            if (parts.length !== args.length) return null // unsupported sub-expression
            if (parts.length === 0) return null
            return and(...parts) ?? null
        }

        case 'or': {
            const parts = args.map(a => jsonLogicToSql(a, getColumn)).filter((s): s is SQL => s !== null)
            if (parts.length !== args.length) return null
            if (parts.length === 0) return null
            return or(...parts) ?? null
        }

        case '!': {
            const inner = jsonLogicToSql(args[0], getColumn)
            if (!inner) return null
            return not(inner) ?? null
        }

        case 'in': {
            // JSON Logic `in`: first arg is the value/var, second is the array to search in
            if (args.length < 2) return null
            const left = resolveArg(args[0], getColumn)
            if (!left || !('column' in left)) return null
            const list = args[1]
            if (!Array.isArray(list) || list.length === 0) return null
            return inArray(left.column as any, list as any[])
        }

        case 'startsWith': {
            // Custom operation: startsWith(field | toLower(field), prefix)
            // Maps to ilike(col, 'prefix%') — ilike is case-insensitive so toLower is a no-op
            if (args.length < 2) return null
            const fieldArg = resolveArg(args[0], getColumn)
            if (!fieldArg || !('column' in fieldArg)) return null
            const prefix = args[1]
            if (typeof prefix !== 'string') return null
            return ilike(fieldArg.column as any, `${prefix}%`)
        }

        default:
            return null // unsupported operator — caller should fall back to in-memory
    }
}

const COMPARISON_OP_MAP: Record<string, string> = {
    '==': 'eq', '!=': 'ne', '<': 'lt', '<=': 'lte', '>': 'gt', '>=': 'gte',
}

/**
 * Resolves the field path from a JSON Logic `{var}` or `{toLower: [{var}]}` argument.
 * Returns the dot-split path (e.g. `["sample", "name"]`) or `null` if not a var reference.
 * `toLower` is a no-op here because Drizzle's `ilike` is already case-insensitive.
 */
function resolveVarPath(arg: unknown): string[] | null {
    if (arg !== null && typeof arg === 'object') {
        if ('var' in (arg as object)) {
            const varName = (arg as { var: string }).var
            return varName ? varName.split('.') : null
        }
        if ('toLower' in (arg as object)) {
            return resolveVarPath(((arg as { toLower: unknown[] }).toLower)[0])
        }
    }
    return null
}

/**
 * Builds a nested Drizzle RQB filter object from a dot-split field path and a leaf condition.
 * e.g. `(["sample", "name"], { ilike: "foo%" })` → `{ sample: { name: { ilike: "foo%" } } }`
 */
function buildNestedFilter(path: string[], leaf: Record<string, unknown>): Record<string, unknown> {
    return path.reduceRight<Record<string, unknown>>((acc, key) => ({ [key]: acc }), leaf)
}

/**
 * Translates a JSON Logic `where` expression into a Drizzle RQB v2 **object filter**
 * — the structured format accepted by `findMany`'s `where` parameter.
 *
 * Unlike `jsonLogicToSql`, this approach:
 * - Requires no Drizzle column object resolution
 * - Natively supports relation/`with` filters via dot-notation vars:
 *   `{"var": "posts.content"}` → `{ posts: { content: ... } }`
 * - Produces conditions Drizzle can apply at the SQL level for both primary-table
 *   and related-table columns
 *
 * Supported operators: `==`, `!=`, `<`, `<=`, `>`, `>=`, `and`, `or`, `!`,
 * `in` (value-in-array), `startsWith` (custom → `ilike`).
 *
 * Returns `null` for unsupported operators — callers should fall back to in-memory filtering.
 */
export function jsonLogicToFilter(logic: unknown): Record<string, unknown> | null {
    if (logic === null || logic === undefined || typeof logic !== 'object') return null

    const entries = Object.entries(logic as object)
    if (entries.length !== 1) return null

    const [op, rawArgs] = entries[0]!
    const args: unknown[] = Array.isArray(rawArgs) ? rawArgs : [rawArgs]

    switch (op) {
        case '==':
        case '!=':
        case '<':
        case '<=':
        case '>':
        case '>=': {
            if (args.length < 2) return null
            const fieldPath = resolveVarPath(args[0])
            if (!fieldPath) return null
            return buildNestedFilter(fieldPath, { [COMPARISON_OP_MAP[op]!]: args[1] })
        }

        case 'and': {
            const parts = args.map(a => jsonLogicToFilter(a))
            if (parts.some(p => p === null)) return null
            if (parts.length === 0) return null
            return { AND: parts }
        }

        case 'or': {
            const parts = args.map(a => jsonLogicToFilter(a))
            if (parts.some(p => p === null)) return null
            if (parts.length === 0) return null
            return { OR: parts }
        }

        case '!': {
            const inner = jsonLogicToFilter(args[0])
            if (!inner) return null
            return { NOT: inner }
        }

        case 'in': {
            if (args.length < 2) return null
            const fieldPath = resolveVarPath(args[0])
            if (!fieldPath) return null
            const list = args[1]
            if (!Array.isArray(list) || list.length === 0) return null
            return buildNestedFilter(fieldPath, { in: list })
        }

        case 'startsWith': {
            if (args.length < 2) return null
            const fieldPath = resolveVarPath(args[0])
            if (!fieldPath || typeof args[1] !== 'string') return null
            return buildNestedFilter(fieldPath, { ilike: `${args[1]}%` })
        }

        default:
            return null
    }
}

export function applySelectParamsToRecords<T>(selectParams: SelectParams, records: T): T {
    // wrapping Json logic query with this so that it will be applied to every item in array
    // (e.g. query for filtering on property name=='test' would be {"==":[{"var":"name"},"test"]} )
    const queryFinal  = selectParams.where ? {filter:[{var:""}, selectParams.where]} : null

    jsonLogic.add_operation("startsWith", (a, b) => _.startsWith(_.toLower(a), _.toLower(b)))
    jsonLogic.add_operation("toLower", (a) => _.toLower(a))

    // TODO - apply filter logic as where clause on query above
    let result = queryFinal ? jsonLogic.apply(queryFinal as JsonLogicFilter, records) || [] : records

    if (selectParams.order) {
        result = _.orderBy(result, Object.keys(selectParams.order), Object.values(selectParams.order))
    }
    if (selectParams.offset) {
        result = _.slice(result, selectParams.offset)
    }
    if (selectParams.limit) {
        result = _.take(result, selectParams.limit)
    }

    return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePutPostError(error: any) {
    let data

    if (error?.cause?.routine == '_bt_check_unique' && error.cause.detail) {
        // Postgres wraps the field name in SQL functions in the error detail, so we need to remove those to get the actual field name
        // This handles one such common pattern where the field is wrapped in lower(trim(both from ...)) but could be adapted if we encounter other patterns in the future
        const sqlModifiersRegex = /^(.*)lower\(trim\(both from ([^\s]*)\)\)(.*)$/i
        const errorCauseDetail = error.cause.detail.replace(sqlModifiersRegex, "$1$2$3")

        const regex = /^Key \(([^)]*)\)=\(([^)]*)\) already exists[.]$/
        const match = errorCauseDetail.match(regex)

        if (match) {
            const fieldName = match[1]
            data = fieldName ? [{
                code: 'duplicate_key_value',
                path: [fieldName],
                message: 'Must be unique',
                description: `${match[2]} already exists`
            }] : undefined
        }
    }

    if (!data) {
        try {
            data = JSON.parse(error.message)
        } catch (err) {
            data = {}
        }
    }

    return {error, data}
}

export async function parseDeleteError(error: any) {
    const regex = /^Key \(([^)]*)\)=\(([^)]*)\) is still referenced from table "([^"]*)"[.]$/
    const match = error?.cause?.detail ? error.cause.detail.match(regex) : null

    if (error?.cause?.routine == 'ri_ReportViolation' && match) {
        const relatedTable = match[3]
        error.statusMessage = `Cannot delete due to related records in ${_.lowerCase(_.startCase(relatedTable))} table.`
    }
}
