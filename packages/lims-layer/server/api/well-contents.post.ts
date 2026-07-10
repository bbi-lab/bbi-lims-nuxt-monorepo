import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const records = _.map(body, (x) => {
      const record = _.mapValues(x, (value: any) => _.isString(value) && _.isEmpty(value) ? null : value)
      record.id = uuidv4()
      return record
    }) as WellContentWithSource[]

    return await insertWellContentsAndSources(records)
  } catch (e: any) {
    const { error, data } = parsePutPostError(e)
    throw createError({ statusCode: 400, statusMessage: error.message, data })
  }
})
