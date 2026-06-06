import { schemas } from '../../../shared/db/zod/zodSchemas'
import _ from 'lodash'

export default defineEventHandler<{ body: AdminUpdateUser }>(async (event) => {
    const { id } = event.context.params as {id: string}
    const session = await getUserSession(event)
    try {
        if (_.get(session, 'user.isAdmin')) {
            const body = await readBody(event)
            const values = schemas?.users?.adminUpdate?.strict().parse(body) as AdminUpdateUser
            const updatedUser = await adminUpdateUser(id, values)
            return updatedUser
        } else {
            throw createError({
                statusCode: 401,
                statusMessage: 'UNAUTHORIZED'
            })
        }
    } catch (e: unknown) {
        throw createError({
            statusCode: 400,
            statusMessage: (e as { message?: string }).message || 'An error occurred'
        })
    }
})
