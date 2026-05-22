import _ from 'lodash'
import { type SelectParams, applySelectParamsToRecords, jsonLogicToSql, jsonLogicToFilter } from './restApi'
import type { RelationalQueryBuilder } from 'drizzle-orm/pg-core/query-builders/query'
import type { PgViewWithSelection, PgTable } from 'drizzle-orm/pg-core'
import { eq, inArray, asc, desc, type ColumnType, type ColumnBaseConfig, Column } from 'drizzle-orm'
import { useDrizzle } from '../utils/db'

export interface RecordValues {[key: string]: string | number | boolean | null | undefined }

const db = useDrizzle()

function trimObjectValues(records: RecordValues[]): RecordValues[] {
    return _.map(records, (x) => {
        return _.mapValues(x, (value) => {
            return _.isString(value) ? _.trim(value) : value
        })
    })
}

export async function selectRecords(queryBuilder: RelationalQueryBuilder<any, any>, selectParams: SelectParams) {
    // Translate the JSON Logic `where` filter into Drizzle RQB v2's native object filter
    // format. This natively handles relation/with filters via dot-notation vars
    // (e.g. {"var": "sample.name"} → { sample: { name: ... } }) without requiring column
    // object resolution. Returns null for unsupported operators, in which case we fall back
    // to fetching all rows and applying params in Node.js.
    const dbFilter = selectParams.where ? jsonLogicToFilter(selectParams.where) : undefined
    const canPushWhere = !selectParams.where || dbFilter != null

    const records = await (queryBuilder as any).findMany({
        columns: selectParams.columns,
        with: selectParams.with,
        ...(canPushWhere ? {
            where: dbFilter,
            limit: selectParams.limit || undefined,
            offset: selectParams.offset || undefined,
            orderBy: selectParams.order || undefined,
        } : {}),
    })

    const result = canPushWhere ? records : applySelectParamsToRecords(selectParams, records)
    return result
}

export async function selectRecordsFromView(view: PgViewWithSelection, selectParams: SelectParams) {
    // Views use the standard query builder (db.select().from(view)) rather than the
    // relational query builder, so the where filter must be translated to a SQL expression
    // via jsonLogicToSql rather than the RQB object format used by selectRecords.
    // Falls back to full-fetch + in-memory filtering when translation fails.
    const dbFilter = selectParams.where
        ? jsonLogicToSql(selectParams.where, (name) => (view as any)[name])
        : undefined
    const canPushWhere = !selectParams.where || dbFilter != null

    let query = db.select().from(view) as any
    if (canPushWhere) {
        if (dbFilter) query = query.where(dbFilter)
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
    return canPushWhere ? records : applySelectParamsToRecords(selectParams, records)
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

export async function selectRecord(queryBuilder: RelationalQueryBuilder<any, any>, table: PgTable<any>, id: string | number, withClause: any, columns: any) {
    const record = await (queryBuilder as any).findFirst({
        where: { id },
        with: withClause,
        columns
    })
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
