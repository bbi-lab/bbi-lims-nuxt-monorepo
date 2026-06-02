interface RateLimitEntry {
  count: number
  resetAt: number
}

/**
 * Per-route rate limit configuration.
 * Keyed by exact request pathname.
 */
const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/users/login': { max: 10, windowMs: 15 * 60 * 1000 },
  '/api/users/register': { max: 5, windowMs: 60 * 60 * 1000 },
  '/api/users/request-password-reset': { max: 5, windowMs: 60 * 60 * 1000 },
}

/** In-memory store: `"<path>:<ip>"` → RateLimitEntry */
const store = new Map<string, RateLimitEntry>()

/** Remove entries whose window has already expired (lazy eviction). */
function pruneExpired(): void {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}

/**
 * Runs before the auth middleware (file named `00.rateLimitAuth.ts` so Nitro
 * processes it first alphabetically).  Only POST requests to the three public
 * auth endpoints are inspected; all other requests pass through immediately.
 */
export default defineEventHandler((event) => {
  if (event.method !== 'POST') return

  const path = getRequestURL(event).pathname
  const limit = RATE_LIMITS[path]
  if (!limit) return

  pruneExpired()

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const key = `${path}:${ip}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + limit.windowMs })
    return
  }

  entry.count++

  if (entry.count > limit.max) {
    const retryAfterSecs = Math.ceil((entry.resetAt - now) / 1000)
    setResponseHeader(event, 'Retry-After', retryAfterSecs)
    throw createError({
      statusCode: 429,
      statusMessage: 'TOO MANY REQUESTS',
      message: 'Too many attempts. Please try again later.',
    })
  }
})
