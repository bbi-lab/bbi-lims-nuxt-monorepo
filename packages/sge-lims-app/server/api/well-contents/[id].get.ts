import _ from 'lodash'
import { wellContents } from 'lims-layer/shared/db/schema/well'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const db = useSgeDrizzle()
  const queryParams = getQuery(event) as QueryParams
  const selectParams = queryToSelectParams(queryParams) as SelectParams

  try {
    return await selectRecord(db.query.wellContents, wellContents, id, selectParams.with, selectParams.columns)
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e.message })
  }
})
