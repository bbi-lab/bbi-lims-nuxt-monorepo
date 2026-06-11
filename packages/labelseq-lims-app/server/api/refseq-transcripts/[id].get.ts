import _ from 'lodash'
import { refseqTranscripts } from '~~/shared/db/schema/transcripts'

export default defineEventHandler(async (event) => {
    const { id } = event.context.params as { id: string }
    const db = useAppDrizzle()

    try {
        const queryParams = getQuery(event) as QueryParams
        const selectParams = queryToSelectParams(queryParams) as SelectParams

        // requires relevant schema to have been passed on drizzle db init
        return await selectRecord(db.query.refseqTranscripts, refseqTranscripts, id,  selectParams.with, selectParams.columns)

    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message,
        })
    }
})
