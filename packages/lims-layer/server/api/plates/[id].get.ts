import { selectRecord } from '../../utils/record'
import { plates } from '../../db/schema/plate'
import _ from 'lodash'

export default defineEventHandler(async (event) => {
    const { id } = event.context.params as {id: string}

    const queryParams = getQuery(event) as QueryParams
    const selectParams = queryToSelectParams(queryParams) as SelectParams

    try {
         // requires relevant schema to have been passed on drizzle db init
        const queryBuilder = _.get(db.query, 'plates')

        // ignoring any order, limit, or offset params
        const selectedPlate = await selectRecord(queryBuilder, plates, id, selectParams.with, selectParams.columns, queryParams.expandEnums == 'true' ? true : false)

        return selectedPlate
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
