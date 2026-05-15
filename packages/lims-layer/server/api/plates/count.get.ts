import _ from 'lodash'
import { count } from 'drizzle-orm'
import { type QueryParams, queryToSelectParams, type SelectParams, jsonLogicToSql } from '../../utils/restApi'
import { useDrizzle, schema } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const db = useDrizzle()

    try {
        const queryParams = getQuery(event) as QueryParams
        const selectParams = queryToSelectParams(queryParams) as SelectParams

        const sqlFilter = selectParams.where            ? jsonLogicToSql(selectParams.where, (name) => (schema.plates as any)[name])
            : undefined

        if (selectParams.where && sqlFilter === null) {
            throw new Error(`Filter expression not supported for count queries on plates`)
        }

        const query = db.select({ count: count() }).from(schema.plates as any)
        const [result] = sqlFilter ? await query.where(sqlFilter) : await query

        return { count: Number(result?.count ?? 0) }
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message,
        })
    }
})
