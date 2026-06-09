import _ from 'lodash'
import { count } from 'drizzle-orm'
import { type QueryParams, queryToSelectParams, type SelectParams, jsonLogicToSql } from 'lims-layer/server/utils/restApi'
import { refseqTranscripts } from '~~/shared/db/schema/transcripts'

export default defineEventHandler(async (event) => {
    const db = useAppDrizzle()

    try {
        const queryParams = getQuery(event) as QueryParams
        const selectParams = queryToSelectParams(queryParams) as SelectParams

        const sqlFilter = selectParams.where
            ? jsonLogicToSql(selectParams.where, (name) => (refseqTranscripts as any)[name])
            : undefined

        if (sqlFilter === null) {
            throw new Error(`Filter expression not supported for count queries on Refseq Transcripts`)
        }

        const [result] = await db.select({ count: count() }).from(refseqTranscripts).where(sqlFilter)
        return { count: Number(result?.count ?? 0) }
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message,
        })
    }
})
