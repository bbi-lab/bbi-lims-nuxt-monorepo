import type { H3Event } from 'h3'

/**
 * Require an authenticated session. Throws 401 if no session.
 *
 * Use in event handlers that need the authenticated user object.
 * The global middleware (server/middleware/auth.ts) already enforces authentication
 * before any handler runs — requireAuth is for handlers that need the user object.
 *
 * @returns The authenticated user object from the session
 */
export async function requireAuth(event: H3Event) {
    const { user } = await requireUserSession(event)
    return user
}

/**
 * Require a specific role. Throws 403 if the authenticated user does not hold the role.
 *
 * This is the RBAC extension point. To add multi-role support in a future milestone,
 * update hasRole() only — no handler rewrites needed.
 *
 * @param event - H3 request event
 * @param role  - Role name: 'admin' | future role strings
 * @returns The authenticated user object if the role check passes
 */
export async function requireRole(event: H3Event, role: string) {
    const user = await requireAuth(event)

    if (!hasRole(user, role)) {
        throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
    }

    return user
}

/**
 * Internal role-check logic.
 *
 * This is the single function to modify when upgrading from isAdmin boolean → roles array.
 *
 * Phase 1 (current): maps 'admin' to user.isAdmin; all authenticated users pass any other role.
 * Phase 2 (RBAC):    replace body with: return (user.roles ?? []).includes(role)
 */
function hasRole(user: Awaited<ReturnType<typeof requireAuth>>, role: string): boolean {
    if (role === 'admin') {
        return user.isAdmin === true
    }
    // Phase 2 replacement: return (user.roles ?? []).includes(role)
    return true
}
