import _ from 'lodash'
import jsonLogic, { type JsonLogicFilter, type JsonLogicAll  } from 'json-logic-js'

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

    const regex = /^Key \(([^)]*)\)=\(([^)]*)\) already exists[.]$/
    const match = error?.cause?.detail ? error.cause.detail.match(regex) : null
    if (error?.cause?.routine == '_bt_check_unique' && match) {
        const fieldName = match[1]
        data = fieldName ? [{
            code: 'duplicate_key_value',
            path: [fieldName],
            message: 'Must be unique',
        }] : undefined
    }

    if (!data) {
        try {
            data = JSON.parse(error.message)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e: unknown) {
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
