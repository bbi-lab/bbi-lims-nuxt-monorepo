import { getUserByEmail } from '../../utils/user'
import { schemas, type LoginUser } from '../../db/schema/user'
import argon2 from 'argon2'
import { generateTokens } from '../../utils/jwt'

export default defineEventHandler<{ body: LoginUser }>(async (event) => {
    try {
        const body = await readBody(event)
        const values = schemas?.loginSchema?.parse(body)

        if (!values) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Could not parse request body'
            })
        }
        const existingUser = values.email ? await getUserByEmail(values.email) : null
        if (!existingUser) {
            throw createError({
                statusCode: 404,
                statusMessage: 'USER NOT FOUND'
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
                statusCode: 400,
                statusMessage: 'INVALID PASSWORD'
            })
        }
        const tokens = generateTokens(existingUser.id)

        await setUserSession(event, {user: existingUser, secure: tokens, loggedInAt: new Date()})
        return {success: true}
    } catch (e: unknown) {
        throw createError({
            statusCode: 400,
            statusMessage: (e as { message?: string }).message || 'An error occurred'
        })
    }
})
