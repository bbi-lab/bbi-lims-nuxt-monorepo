import { getUserById } from '../../utils/user'

export default defineEventHandler(async (event) => {
    const { id } = event.context.params as {id: string}

    const queryParams = getQuery(event) as QueryParams
    const selectParams = queryToSelectParams(queryParams) as SelectParams

    try {
        // ignoring any order, limit, or offset params
        const selectedUser =  await getUserById(id, selectParams.with, selectParams.columns)
        return selectedUser
    } catch (e: unknown) {
        throw createError({
            statusCode: 400,
            statusMessage: (e as { message?: string }).message || 'An error occurred'
        })
    }
})
