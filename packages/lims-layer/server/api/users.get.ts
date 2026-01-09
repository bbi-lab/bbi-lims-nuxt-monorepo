import { getAllUsers } from '../utils/user'
import { type QueryParams, type SelectParams, queryToSelectParams } from '../utils/restApi'

export default defineEventHandler(async (event) => {
    const queryParams = getQuery(event) as QueryParams
    const selectParams = queryToSelectParams(queryParams) as SelectParams
    try {
        return await getAllUsers(selectParams)
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
