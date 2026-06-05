import { schemas } from '../../../shared/db/zod/zodSchemas'

import _ from 'lodash'

export default defineEventHandler<{ body: UpdateUserGroup }>(async (event) => {
    const { id } = event.context.params as {id: string}
    try {
        const body = await readBody(event)
        //const query = getQuery(event)
        const values = schemas.userGroups.update.parse(body)
        const updatedUserGroup = await updateUserGroup(_.toInteger(id), values)
        return updatedUserGroup
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
