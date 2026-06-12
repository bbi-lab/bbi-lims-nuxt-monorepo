import { haCloningExperiments } from '#shared/db/schema/sge/plasmid-experiment'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const db = useSgeDrizzle()
  const queryParams = getQuery(event) as QueryParams
  const selectParams = queryToSelectParams(queryParams) as SelectParams

  try {
    return await selectRecord(db.query.haCloningExperiments, haCloningExperiments, id, selectParams.with, selectParams.columns)
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e.message })
  }
})
