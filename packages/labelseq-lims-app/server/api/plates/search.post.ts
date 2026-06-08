import _ from 'lodash'

export default defineEventHandler(async (event) => {
    const db = useAppDrizzle()

    try {
        const body = await readBody(event)
        const queryParams = _.mapValues(body.query || {}, (x) => JSON.stringify(x)) as unknown as QueryParams
        const selectParams = queryToSelectParams(queryParams) as SelectParams

        const queryBuilder = _.get(db.query, 'plates')
        return await selectRecords(queryBuilder, selectParams)
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
