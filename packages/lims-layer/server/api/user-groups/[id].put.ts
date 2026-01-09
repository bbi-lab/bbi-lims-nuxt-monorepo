import { updateUserGroup } from '../../utils/user'
import { userGroupSchemas, type UpdateUserGroup } from '../../db/schema/user'
import _ from 'lodash'

export default defineEventHandler<{ body: UpdateUserGroup }>(async (event) => {
    const { id } = event.context.params as {id: string}
    try {
        const body = await readBody(event)
        //const query = getQuery(event)
        const values = userGroupSchemas.updateUserGroupSchema.parse(body) as UpdateUserGroup
        const updatedUserGroup = await updateUserGroup(_.toInteger(id), values)
        return updatedUserGroup
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
