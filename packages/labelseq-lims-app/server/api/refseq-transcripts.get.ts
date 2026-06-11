import _ from 'lodash'

export default defineEventHandler(async (event) => {
    const db = useAppDrizzle()

    try {
        const queryParams = getQuery(event) as QueryParams
        const selectParams = queryToSelectParams(queryParams) as SelectParams

        // requires relevant schema to have been passed on drizzle db init
        return await selectRecords(db.query.refseqTranscripts, selectParams)

    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message,
        })
    }
})
