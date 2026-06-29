import _ from 'lodash'
import { sgeSchema } from '../utils/db'

export default defineEventHandler(async (event) => {
  const { recordType } = event.context.params as { recordType: string }
  if (recordType != _.kebabCase(recordType)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid record type: ${recordType}. Record type must be kebab-case.`,
    })
  }

  const db = useSgeDrizzle()

  try {
    const queryParams = getQuery(event) as QueryParams
    const selectParams = queryToSelectParams(queryParams) as SelectParams
    const queryBuilder = _.get(db.query, _.camelCase(recordType))
    if (queryBuilder) {
      return await selectRecords(queryBuilder, selectParams)
    } else {
      const view = _.get(sgeSchema, _.camelCase(recordType))
      if (!view) {
        throw new Error(`Record type ${recordType} not found in queryBuilder or schema`)
      }
      return await selectRecordsFromView(view, selectParams)
    }
  } catch (e: any) {
    throw createError({
      statusCode: 400,
      statusMessage: e.message,
    })
  }
})
