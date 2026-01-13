import _ from 'lodash'
import { updateRecords } from '../utils/record'
import { parsePutPostError } from '../utils/restApi'
import { schemas, plates } from '../db/schema/plate'

export default defineEventHandler(async (event) => {
    try {
        const {ids, values} = await readBody(event)

        const updateSchema = schemas.updatePlateSchema
        const valuesWithEmptyAsNull = _.mapValues(values, (value) => _.isString(value) && _.isEmpty(value) ? null : value)

        // excludes fields from schema that are not present in incoming values
        const schemaPicks = _.mapValues(values, () => true) as Record<keyof typeof values, true>

        const parsedValues = updateSchema!.pick(schemaPicks).parse(valuesWithEmptyAsNull) as RecordValues

        const updatedRecords = await updateRecords(plates, ids, parsedValues)

        return updatedRecords
    } catch (e: any) {
        const { data } = parsePutPostError(e)

        throw createError({
            statusCode: 400,
            statusMessage: e.message,
            data
        })
    }
})
