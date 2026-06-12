import _ from 'lodash'
import { insertPlate } from '../utils/sge'
import { schemas, type NewPlate } from '#shared/db/schema/sge/plate'

export default defineEventHandler<{ body: NewPlate[] }>(async (event) => {
  try {
    const body = await readBody(event)
    const records = _.map(body, (x) => {
      const record = _.mapValues(x, (value) => _.isString(value) && _.isEmpty(value) ? null : value)
      return schemas.insertPlateSchema.parse(record) as NewPlate
    })

    const newRecords = []
    for (const r of records) {
      const newRecord = await insertPlate(r)
      newRecords.push(newRecord)
    }
    return newRecords
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e.message })
  }
})
