import _ from 'lodash'
import { schemas, plates } from '#shared/db/schema/sge/plate'

export default defineEventHandler(async (event) => {
  try {
    const { ids, values } = await readBody(event)

    const valuesWithEmptyAsNull = _.mapValues(values, (value) => _.isString(value) && _.isEmpty(value) ? null : value)
    const schemaPicks = _.mapValues(values, () => true) as Record<string, true>
    const parsedValues = schemas.updatePlateSchema.pick(schemaPicks).parse(valuesWithEmptyAsNull) as RecordValues

    const updatedRecords = await updateRecords(plates, ids, parsedValues)
    return updatedRecords
  } catch (e: any) {
    const { error, data } = parsePutPostError(e)
    throw createError({ statusCode: 400, statusMessage: error.message, data })
  }
})
