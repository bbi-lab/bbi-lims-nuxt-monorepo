import { addUser, getUserByEmail } from '../../utils/user'
import { schemas } from '../../../shared/db/zod/zodSchemas'
import {isValidPassword} from '../../utils/auth'

export default defineEventHandler<{ body: NewUser }>(async (event) => {
    try {
        const body = await readBody(event)
        const values = schemas.users.insert.parse(body)

        if (!values) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Could not parse request body'
            })
        }

        const existingUser = await getUserByEmail(values.email)

        if (existingUser) {
            throw createError({
                statusCode: 400,
                statusMessage: 'User already exists.'
            })
        }

        if (!isValidPassword(values.password)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Password must be at least 8 characters long and include a combination of uppercase letters, lowercase letters, numbers, and special characters (@$!%*?&)'
            })
        }

        const newUser = await addUser(values)
        return newUser
    } catch (e: unknown) {
        throw createError({
            statusCode: 400,
            statusMessage: (e as { message?: string }).message || 'An error occurred'
        })
    }
})
