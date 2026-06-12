export default defineEventHandler(async (event) => {
  const db = useSgeDrizzle()
  try {
    const queryParams = getQuery(event) as QueryParams
    const selectParams = queryToSelectParams(queryParams) as SelectParams
    return await selectRecords(db.query.wellContents, selectParams)
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e.message })
  }
})
