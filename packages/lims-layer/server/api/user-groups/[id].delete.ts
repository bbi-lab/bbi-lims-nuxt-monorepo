import { deleteUserGroup } from '../../utils/user'
import _ from 'lodash'

export default defineEventHandler(async (event) => {
    const { id } = event.context.params as {id: string}
    try {
        const deletedUserGroup = await deleteUserGroup(_.toInteger(id))
        return deletedUserGroup
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
