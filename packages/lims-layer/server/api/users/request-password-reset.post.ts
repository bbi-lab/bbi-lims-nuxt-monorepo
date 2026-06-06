import { schemas } from '../../../shared/db/zod/zodSchemas'

export default defineEventHandler<{ body: RequestPasswordReset }>(async (event) => {
  try {
    const body = await readBody(event)
    const values = schemas.users.requestPasswordReset.parse(body)

    const config = useRuntimeConfig(event)
    const appUrl = config.public.appUrl || 'http://localhost:3000'

    const user = await getUserByEmail(values.email)

    // Only send the email if the user exists and is verified.
    // Always return success to prevent email enumeration.
    if (user && user.isVerified) {
      const rawToken = await createPasswordResetToken(user.id)
      const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`

      await sendPasswordResetEmail(user.email, resetUrl)
    }

    return { success: true }
  } catch (e: unknown) {
    console.error('[request-password-reset]', e)
    // Return success even on internal errors to prevent information leakage
    return { success: true }
  }
})
