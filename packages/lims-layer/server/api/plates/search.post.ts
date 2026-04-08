import { selectRecords } from '../../utils/record'
import _ from 'lodash'
import { type QueryParams, type SelectParams, queryToSelectParams } from '../../utils/restApi'
import { useDrizzle } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const db = useDrizzle()

    try {
        const body = await readBody(event)
        const queryParams = _.mapValues(body.query || {}, (x) => JSON.stringify(x)) as unknown as QueryParams
        const selectParams = queryToSelectParams(queryParams) as SelectParams

        const queryBuilder = _.get(db.query, 'plates')
        return await selectRecords(queryBuilder, selectParams, queryParams.expandEnums == 'true' ? true : false)
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
