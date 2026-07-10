import { haCloningExperiments } from '#shared/db/schema/plasmid-experiment'
import { count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const db = useSgeDrizzle()
    try {
        const queryParams = getQuery(event) as QueryParams
        const selectParams = queryToSelectParams(queryParams) as SelectParams

        const sqlFilter = selectParams.where
            ? jsonLogicToSql(selectParams.where, (name) => (haCloningExperiments as any)[name])
            : undefined

        const [result] = await db.select({ count: count() }).from(haCloningExperiments).where(sqlFilter ?? undefined)
        return { count: Number(result?.count ?? 0) }
    } catch (e: any) {
        throw createError({ statusCode: 400, statusMessage: e.message })
    }
})
