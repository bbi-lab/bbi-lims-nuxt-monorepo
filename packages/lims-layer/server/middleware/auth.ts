export default defineEventHandler(async (event) => {
    const path = getRequestURL(event).pathname

    // Skip non-API routes (SSR page renders)
    if (!path.startsWith('/api/')) return

    // CRITICAL: skip nuxt-auth-utils internal session endpoint.
    // Blocking this breaks useUserSession() composable SSR-wide.
    if (path.startsWith('/api/_auth/')) return

    // Skip public auth routes
    if (event.method === 'POST' && [
      '/api/users/login',
      '/api/users/register',
      '/api/users/request-password-reset',
      '/api/users/reset-password',
    ].includes(path)) return

    let session: Awaited<ReturnType<typeof getUserSession>> | null = null
    let accessToken: string | null = null
    let refreshToken: string | null = null

    const headers = getHeaders(event)

    if (headers.authorization) {
        // to support standard REST API requests using access token
        if (!headers.authorization.startsWith('Bearer ')) {
            throw createError({
                statusCode: 401,
                statusMessage: 'UNAUTHORIZED'
            })
        }
        accessToken = headers.authorization.split(' ')[1]
    } else {
        // to support sessions stored in cookies (via nuxt-auth-utils)
        // getUserSession returns {} (empty object) when no session — not null
        session = await getUserSession(event)
        if (session?.user) {
            const secure = session.secure as { accessToken?: string; refreshToken?: string } | undefined
            accessToken = secure?.accessToken ?? null
            refreshToken = secure?.refreshToken ?? null
        }
    }

    if (!accessToken) {
        if (session) await clearUserSession(event)
        throw createError({
            statusCode: 401,
            statusMessage: 'UNAUTHORIZED'
        })
    } else {
        try {
            verifyToken(accessToken)
        } catch (err: any) {
            // if expired, attempt token refresh and update user session
            if (session?.user && err.statusCode === 401 && err.message === 'TOKEN EXPIRED' && refreshToken) {
                const result = refreshTokens(refreshToken)
                if (!result.authenticated) {
                    // clear session if refresh token is invalid or expired
                    await clearUserSession(event)
                    throw createError({
                        statusCode: 401,
                        statusMessage: 'TOKEN EXPIRED',
                    })
                } else {
                    // add new access and refresh tokens to the session
                    await setUserSession(event, { ...session, secure: result })
                }
            } else {
                if (session) await clearUserSession(event)
                throw err
            }
        }
    }
})
