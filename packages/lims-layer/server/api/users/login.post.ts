import { getUserByEmail } from '../../utils/user'
import { schemas } from '../../../shared/db/zod/zodSchemas'
import argon2 from 'argon2'
import { generateTokens } from '../../utils/jwt'
import _ from 'lodash'

export default defineEventHandler<{ body: LoginUser }>(async (event) => {
    try {
        const body = await readBody(event)
        const values = schemas.users.login.parse(body)

        if (!values) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Could not parse request body'
            })
        }
        const existingUser = values.email ? await getUserByEmail(values.email) : null
        if (!existingUser) {
            throw createError({
                statusCode: 401,
                statusMessage: 'INVALID CREDENTIALS'
            })
        } else if (!existingUser.isVerified) {
            throw createError({
                statusCode: 401,
                statusMessage: 'NOT VERIFIED',
                message: 'Pending verification'
            })
        }

        const matchPassword = await argon2.verify(
            existingUser.password,
            values.password || ''
        )
        if (!matchPassword) {
            throw createError({
                statusCode: 401,
                statusMessage: 'INVALID CREDENTIALS'
            })
        }
        const tokens = generateTokens(existingUser.id)

        const sessionUser = _.omit(existingUser, ['password', 'code'])
        await setUserSession(event, {user: sessionUser, secure: tokens, loggedInAt: new Date()})
        return {success: true}
    } catch (e: unknown) {
        // Re-throw H3 errors as-is so intentional status codes (404, 401, 400) reach the client.
        // Wrapping all errors as 400 previously masked these codes.
        if (isError(e)) throw e
        throw createError({
            statusCode: 500,
            statusMessage: 'An unexpected error occurred'
        })
    }
})
