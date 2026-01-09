import { addUserGroups } from '../utils/user'
import { userGroupSchemas, type NewUserGroup } from '../db/schema/user'
import _ from 'lodash'

export default defineEventHandler<{ body: NewUserGroup[] }>(async (event) => {
    const session = await getUserSession(event)
    try {
        console.log(session.user)
        if (_.get(session, 'user.isAdmin')) {
            const body = await readBody(event)

            const records = _.map(body, (x) => {
                return userGroupSchemas.newUserGroupSchema.parse(x) as NewUserGroup
            })

            const newUserGroups = await addUserGroups(records)
            return newUserGroups
        } else {
            throw createError({
                statusCode: 401,
                statusMessage: 'UNAUTHORIZED'
            })
        }
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
