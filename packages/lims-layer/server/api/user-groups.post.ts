import { addUserGroups } from '../utils/user'
import { schemas } from '../../shared/db/zod/zodSchemas'

import _ from 'lodash'

export default defineEventHandler<{ body: NewUserGroup[] }>(async (event) => {
    const session = await getUserSession(event)
    try {
        if (_.get(session, 'user.isAdmin')) {
            const body = await readBody(event)

            const records = _.map(body, (x) => {
                return schemas.userGroups.insert.parse(x) as NewUserGroup
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
