import _ from 'lodash'
import { count } from 'drizzle-orm'
import { type QueryParams, queryToSelectParams, type SelectParams, jsonLogicToSql } from '../../utils/restApi'
import { useDrizzle, schema } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const { recordType } = event.context.params as { recordType: string }
    if (recordType !== _.kebabCase(recordType)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid record type: ${recordType}. Record type must be kebab-case.`,
        })
    }

    const db = useDrizzle()

    try {
        const queryParams = getQuery(event) as QueryParams
        const selectParams = queryToSelectParams(queryParams) as SelectParams

        const table = _.get(schema, _.camelCase(recordType))
        if (!table) {
            throw new Error(`Record type ${recordType} not found in schema`)
        }

        const sqlFilter = selectParams.where
            ? jsonLogicToSql(selectParams.where, (name) => (table as any)[name])
            : undefined

        if (selectParams.where && sqlFilter === null) {
            throw new Error(`Filter expression not supported for count queries on ${recordType}`)
        }

        const [result] = await db.select({ count: count() }).from(table as any).where(sqlFilter)
        return { count: Number(result?.count ?? 0) }
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message,
        })
    }
})
