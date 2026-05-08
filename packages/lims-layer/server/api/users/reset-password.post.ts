import { getValidPasswordResetToken, deletePasswordResetToken, changePassword } from '../../utils/user'
import { schemas } from '../../../shared/db/zod/zodSchemas'
import { isValidPassword } from '../../utils/auth'

export default defineEventHandler<{ body: ResetPassword }>(async (event) => {
  try {
    const body = await readBody(event)
    const values = schemas.users.resetPassword.parse(body)

    const tokenRow = await getValidPasswordResetToken(values.token)

    if (!tokenRow) {
      throw createError({
        statusCode: 400,
        statusMessage: 'INVALID_OR_EXPIRED_TOKEN',
      })
    }

    if (!isValidPassword(values.newPassword)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 8 characters long and include a combination of uppercase letters, lowercase letters, numbers, and special characters (@$!%*?&)',
      })
    }

    await changePassword(tokenRow.userId, values.newPassword)
    // Single-use: delete the token immediately after a successful reset
    await deletePasswordResetToken(tokenRow.id)

    return { success: true }
  } catch (e: unknown) {
    if ((e as { statusCode?: number }).statusCode) throw e
    throw createError({
      statusCode: 400,
      statusMessage: (e as { message?: string }).message || 'An error occurred',
    })
  }
})
