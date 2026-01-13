import { insertPlate } from '../utils/plate'
import { schemas, type NewPlate } from '../db/schema/plate'
import _ from 'lodash'

export default defineEventHandler<{ body: NewPlate }>(async (event) => {
    try {
        const body = await readBody(event)
        const records = _.map(body, (x) => {
            const record = _.mapValues(x, (value) => _.isString(value) && _.isEmpty(value) ? null : value)
            return schemas.insertPlateSchema!.parse(record) as NewPlate
        })

        const newRecord = await insertPlate(records[0]!)
        return [newRecord]
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
