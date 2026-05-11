// Augments nuxt-auth-utils User interface with RBAC and multi-tenancy seams.
//
// These fields are optional and empty in Phase 1 (single-role auth).
// They are populated at login in a future RBAC milestone.
//
// Migration guide:
// - roles: In the RBAC milestone, set this at login via generateTokens/session.
//          Update hasRole() in server/utils/authGuard.ts to use roles.includes(role).
// - tenantId: In the multi-tenancy milestone, set this at login and use it to
//             scope DB queries per request.

declare module '#auth-utils' {
    interface User {
        /**
         * Assigned roles for this user.
         * Phase 1: always undefined (single-role model — use isAdmin flag instead).
         * Phase 2 (RBAC): populated at login, e.g. ['admin', 'labManager'].
         */
        roles?: string[]

        /**
         * Tenant identifier for multi-tenancy scoping.
         * Phase 1: always undefined.
         * Phase 3 (multi-tenancy): set at login from the user's organization record.
         */
        tenantId?: string
    }
}
