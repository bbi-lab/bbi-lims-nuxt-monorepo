import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'
import type { ZodObject } from 'zod'

export default defineEventHandler(async (event) => {
    const { recordType } = event.context.params as {recordType: string}
    if (recordType != _.kebabCase(recordType)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid record type: ${recordType}. Record type must be kebab-case.`
        })
    }

    const db = useAppDrizzle()
    try {
        const {ids, values} = await readBody(event)

        const updateSchema = (schemas as any)[_.camelCase(recordType)].update as ZodObject
        const valuesWithEmptyAsNull = _.mapValues(values, (value) => _.isString(value) && _.isEmpty(value) ? null : value)

        // excludes fields from schema that are not present in incoming values
        const schemaPicks = _.mapValues(values, () => true) as Record<string, true>
        const parsedValues = updateSchema.pick(schemaPicks).parse(valuesWithEmptyAsNull) as RecordValues

        const updatedRecords = await updateRecords(_.get(db, ['query', _.camelCase(recordType), 'table']), ids, parsedValues)

        return updatedRecords
    } catch (e: unknown) {
        const { error, data } = parsePutPostError(e)

        throw createError({
            statusCode: 400,
            statusMessage: error.message,
            data
        })
    }
})
