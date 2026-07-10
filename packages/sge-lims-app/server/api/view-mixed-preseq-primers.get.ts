import _ from 'lodash'
import { sgeSchema } from '../utils/db'
import { type PgViewWithSelection } from 'drizzle-orm/pg-core'

export default defineEventHandler(async (event) => {
    const db = useSgeDrizzle()

    try {
        const queryParams = getQuery(event) as QueryParams
        const selectParams = queryToSelectParams(queryParams) as SelectParams

        const view = sgeSchema.viewMixedPreseqPrimers as PgViewWithSelection<any, any, any>
        const results = await selectRecordsFromView(view, selectParams)

        const wellables = await db.query.wellables.findMany({
            where: { id: { in: results.map((r: any) => r.id) } },
            with: {
                wellContents: {
                    with: {
                        well: {
                            with: {
                                plate: true
                            }
                        }
                    }
                }
            }
        })

        const wellableById = new Map(wellables.map((w) => [w.id, w]))
        return results.map((r: any) => ({ ...r, wellable: wellableById.get(r.id) }))

    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
