import { getUserGroups } from '../utils/user'

export default defineEventHandler(async (event) => {
    const queryParams = getQuery(event) as QueryParams
    const selectParams = queryToSelectParams(queryParams) as SelectParams
    try {
        return await getUserGroups(selectParams)
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
