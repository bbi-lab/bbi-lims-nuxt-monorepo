import { changePassword } from '../../utils/user'
import { schemas } from '../../../shared/db/zod/zodSchemas'
import argon2 from 'argon2'
import _ from 'lodash'
import {isValidPassword} from '../../utils/auth'

export default defineEventHandler<{ body: ChangePassword }>(async (event) => {
    try {
        const body = await readBody(event)
        const values = schemas.users.changePassword.parse(body)

        if (!values) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Could not parse request body'
            })
        }
        const session = await getUserSession(event)

        const userId = _.get(session.user, 'id', '')
        const dbUser = await getUserById(userId)
        if (!dbUser) {
            throw createError({
                statusCode: 401,
                statusMessage: 'UNAUTHORIZED'
            })
        }

        const matchPassword = await argon2.verify(
            _.get(dbUser, 'password', ''),
            values.oldPassword || ''
        )
        if (!matchPassword) {
            throw createError({
                statusCode: 400,
                statusMessage: 'INVALID PASSWORD'
            })
        }
        if (!isValidPassword(values.newPassword || '')) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Password must be at least 8 characters long and include a combination of uppercase letters, lowercase letters, numbers, and special characters (@$!%*?&)'
            })
        }
        await changePassword(_.get(session.user, 'id', ''), values.newPassword!)
        return {success: true}
    } catch (e: unknown) {
        throw createError({
            statusCode: 400,
            statusMessage: (e as { message?: string }).message || 'An error occurred'
        })
    }
})
