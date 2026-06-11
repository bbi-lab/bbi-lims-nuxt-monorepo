import _ from 'lodash'
import { plates } from 'lims-layer/shared/db/schema/plate'
import { schemas } from 'lims-layer/shared/db/zod/zodSchemas'

export default defineEventHandler(async (event) => {
    try {
        const {ids, values} = await readBody(event)

        const updateSchema = schemas.plates.update
        const valuesWithEmptyAsNull = _.mapValues(values, (value) => _.isString(value) && _.isEmpty(value) ? null : value)

        // excludes fields from schema that are not present in incoming values
        const schemaPicks = _.mapValues(values, () => true) as Record<keyof typeof values, true>

        // @ts-expect-error - Zod's pick method has complex intersection types that are hard to satisfy
        const parsedValues = updateSchema!.pick(schemaPicks).parse(valuesWithEmptyAsNull) as RecordValues

        const updatedRecords = await updateRecords(plates, ids, parsedValues)

        return updatedRecords
    } catch (e: unknown) {
        const { data } = parsePutPostError(e)

        throw createError({
            statusCode: 400,
            statusMessage: (e as Error).message,
            data
        })
    }
})
