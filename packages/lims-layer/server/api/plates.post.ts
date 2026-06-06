import { schemas } from '../../shared/db/zod/zodSchemas'
import _ from 'lodash'

export default defineEventHandler<{ body: NewPlate }>(async (event) => {
    try {
        const body = await readBody(event)
        const records = _.map(body, (x) => {
            const record = _.mapValues(x as any, (value) => _.isString(value) && _.isEmpty(value) ? null : value)
            return schemas.plates.insert!.parse(record) as NewPlate
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
