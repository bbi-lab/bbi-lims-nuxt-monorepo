import { selectUserGroup } from '../../utils/user'
import _ from 'lodash'

export default defineEventHandler(async (event) => {
    const { id } = event.context.params as {id: string}

    try {
        const selectedUserGroup = await selectUserGroup(_.toInteger(id))
        return selectedUserGroup
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
