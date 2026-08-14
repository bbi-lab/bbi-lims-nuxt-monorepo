import type { EventHandler } from 'h3'

/**
 * Adding a static route file for a record type (e.g. `pcr-experiments.post.ts`) shadows the
 * whole `/api/pcr-experiments/**` subtree in h3's router: the generic `[recordType]` routes
 * either stop matching (404 on sub-paths) or match with empty params. Re-registering the
 * generic handlers under the static path with `recordType` injected keeps them working.
 */
export function withRecordType(recordType: string, handler: EventHandler): EventHandler {
    return defineEventHandler((event) => {
        event.context.params = { ...event.context.params, recordType }
        return handler(event)
    })
}
