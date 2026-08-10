// Centralized handling of "not authorized" (HTTP 401) API responses.
//
// Every client request — whether via `$fetch`, `useFetch`/`useAsyncData` (which use
// `globalThis.$fetch` under the hood), or the shared `RecordService` — routes through the
// wrapped fetch below. When the session/token has expired or become invalid mid-use, the
// server returns a 401 in one of several shapes (statusMessage `UNAUTHORIZED` or
// `TOKEN EXPIRED`); rather than have each of the ~30 call sites check for that (most did so
// incompletely or not at all), we react to it in one place and open the login modal.
//
// The modal (mounted in the default layout) lets the user re-authenticate in place;
// SmartTable reloads its data when the modal closes. Requests to the public auth endpoints
// are ignored so a bad-credentials 401 on the login form doesn't trigger the modal.

const IGNORED_PATHS = [
    '/api/_auth/',
    '/api/users/login',
    '/api/users/register',
    '/api/users/request-password-reset',
    '/api/users/reset-password',
]

export default defineNuxtPlugin(() => {
    const base = globalThis.$fetch
    globalThis.$fetch = base.create({
        onResponseError({ response }) {
            if (response?.status !== 401) return
            const url = response.url || ''
            if (IGNORED_PATHS.some(p => url.includes(p))) return
            // showLoginModal() just flips a shared reactive flag — safe to call here and
            // idempotent if the modal is already open.
            useLayout().showLoginModal()
        },
    }) as typeof base
})
