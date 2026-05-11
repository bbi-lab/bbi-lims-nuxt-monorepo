import _ from 'lodash'
import { type SelectParams, applySelectParamsToRecords } from './restApi'
import type { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import type { PgViewWithSelection, PgTable } from 'drizzle-orm/pg-core'
import { eq, inArray, getTableName, asc, desc, type ColumnType, type ColumnBaseConfig, Column } from 'drizzle-orm'
import { useDrizzle } from '../utils/db'
import { appConstants } from '../../shared/utils/constants'

export interface RecordValues {[key: string]: string | number | boolean | null | undefined }

const db = useDrizzle()

function expandEnumValues(records: any, tableName: string): void {
    if (!_.has(appConstants.enumLookups, tableName)) return

    const enumLookup = appConstants.enumLookups[tableName] as Record<string, any>
    if (_.isArray(records)) {
        _.forEach(records, (record) => {
            _.forEach(record, (value, key) => {
                if (_.isString(value) && enumLookup[key] && enumLookup[key][value]) {
                    record[key] = {value: record[key], ...enumLookup[key][value]}
                }
            })
        })
    } else {
        _.forEach(records, (value, key) => {
            if (_.isString(value) && enumLookup[key] && enumLookup[key][value]) {
                records[key] = {value: records[key], ...enumLookup[key][value]}
            }
        })
    }
}

function trimObjectValues(records: RecordValues[]): RecordValues[] {
    return _.map(records, (x) => {
        return _.mapValues(x, (value) => {
            return _.isString(value) ? _.trim(value) : value
        })
    })
}

export async function selectRecords(queryBuilder: RelationalQueryBuilder<any, any>, selectParams: SelectParams, expandEnums: boolean = false) {
    // Push limit/offset/orderBy to the DB when there is no JSON Logic `where` filter.
    // When a where filter is present we must fetch all rows first and apply it in Node.js,
    // so DB-level pagination would yield incorrect results.
    const pushToDb = !selectParams.where

    const records = await (queryBuilder as any).findMany({
        columns: selectParams.columns,
        with: selectParams.with,
        ...(pushToDb ? {
            limit: selectParams.limit || undefined,
            offset: selectParams.offset || undefined,
            orderBy: selectParams.order
                ? (fields: Record<string, any>, { asc: a, desc: d }: any) =>
                    Object.entries(selectParams.order!).flatMap(([col, dir]) => {
                        const column = fields[col]
                        return column ? [dir === 'desc' ? d(column) : a(column)] : []
                    })
                : undefined,
        } : {}),
    })

    // Strip DB-applied params so applySelectParamsToRecords does not re-apply them.
    const inMemoryParams: SelectParams = pushToDb
        ? { ...selectParams, limit: undefined as unknown as number, offset: undefined as unknown as number, order: undefined as unknown as SelectParams['order'] }
        : selectParams

    const result = applySelectParamsToRecords(inMemoryParams, records)
    if (expandEnums) expandEnumValues(result, _.get(queryBuilder, 'tableConfig.dbName', ''))
    return result
}

export async function selectRecordsFromView(view: PgViewWithSelection, selectParams: SelectParams) {
    // Push limit/offset/orderBy to the DB when there is no JSON Logic `where` filter.
    const pushToDb = !selectParams.where

    let query = db.select().from(view) as any
    if (pushToDb) {
        if (selectParams.order) {
            const orderClauses = Object.entries(selectParams.order).flatMap(([col, dir]) => {
                const column = (view as any)[col]
                return column ? [dir === 'desc' ? desc(column) : asc(column)] : []
            })
            if (orderClauses.length) query = query.orderBy(...orderClauses)
        }
        if (selectParams.offset) query = query.offset(selectParams.offset)
        if (selectParams.limit) query = query.limit(selectParams.limit)
    }

    const records = await query
    const inMemoryParams: SelectParams = pushToDb
        ? { ...selectParams, limit: undefined as unknown as number, offset: undefined as unknown as number, order: undefined as unknown as SelectParams['order'] }
        : selectParams

    const result = applySelectParamsToRecords(inMemoryParams as SelectParams, records)
    return result
}

export async function selectRecordFromView(view: PgViewWithSelection, id: string | number) {
    if (!view.id) {
        throw createError({
            statusCode: 400,
            statusMessage: `View does not have an id column`
        })
    }
    const record = await db.select().from(view).where(eq(view.id as Column<ColumnBaseConfig<ColumnType>>, id))
    return _.first(record)
}

export async function selectRecord(queryBuilder: RelationalQueryBuilder<any, any>, table: PgTable<any>, id: string | number, withClause: any, columns: any, expandEnums: boolean = false) {
    const record = await (queryBuilder as any).findFirst({
        where: { id },
        with: withClause,
        columns
    })
    if (expandEnums) expandEnumValues(record, getTableName(table))
    return record
}

export async function insertRecord(table: PgTable<any>, values: RecordValues) {
    const trimmedValues = trimObjectValues([values])[0]
    if (!trimmedValues) {
        throw new Error('Invalid values provided for insert')
    }

    const [newRecord] = await db
      .insert(table)
      .values(trimmedValues)
      .returning()

    return newRecord
}

export async function insertRecords(table: PgTable<any>, records: Array<RecordValues>) {
    const newRecords = await db
      .insert(table)
      .values(trimObjectValues(records))
      .returning()

    return newRecords
  }
export async function updateRecord(table: PgTable<any>, id: string | number, values: RecordValues) {
    const trimmedValues = trimObjectValues([values])[0]
    if (!trimmedValues) {
        throw new Error('Invalid values provided for insert')
    }
    const [updatedRecord] = await db
        .update(table)
        .set(trimmedValues)
        .where(eq((table as any).id, id))
        .returning() as any[]

    return updatedRecord
}

export async function updateRecords(table: PgTable<any>, ids: string[] | number[], values: RecordValues) {
    const trimmedValues = trimObjectValues([values])[0]
    if (!trimmedValues) {
        throw new Error('Invalid values provided for insert')
    }
    const updatedRecords = await db
        .update(table)
        .set(trimmedValues)
        .where(inArray((table as any).id, ids))
        .returning() as any[]

    return updatedRecords
}

export async function deleteRecord(table: PgTable<any>, id: string | number) {
    const [deletedRecord] = await db
        .delete(table)
        .where(eq((table as any).id, id))
        .returning() as any[]

    return deletedRecord
}
