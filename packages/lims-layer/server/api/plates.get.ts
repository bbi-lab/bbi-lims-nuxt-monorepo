import { selectRecords } from '../utils/record'
import { type QueryParams, type SelectParams, queryToSelectParams } from '../utils/restApi'
import { useDrizzle } from '../utils/db'

export default defineEventHandler(async (event) => {
    const db = useDrizzle()

    try {
        const queryParams = getQuery(event) as QueryParams
        const selectParams = queryToSelectParams(queryParams) as SelectParams

        // requires relevant schema to have been passed on drizzle db init
        return await selectRecords(db.query.plates, selectParams)
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
