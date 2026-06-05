import _ from 'lodash'
import { schemas as baseSchemas } from 'lims-layer/shared/db/zod/zodSchemas'
import { schemas as appSchemas } from '#shared/db/zod/zodSchemas'
import type { ZodObject } from 'zod'

const allSchemas = { ...baseSchemas, ...appSchemas }

export default defineEventHandler(async (event) => {
    const { recordType, id } = event.context.params as { recordType: string, id: string }
    if (recordType != _.kebabCase(recordType)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid record type: ${recordType}. Record type must be kebab-case.`,
        })
    }

    const db = useAppDrizzle()

    try {
        const body = await readBody(event)
        const updateSchema = (allSchemas as any)[_.camelCase(recordType)]?.update as ZodObject | undefined
        if (!updateSchema) {
            throw new Error(`No update schema found for record type ${recordType}`)
        }
        const values = _.mapValues(body, (value) => _.isString(value) && _.isEmpty(value) ? null : value)
        const parsedValues = updateSchema.parse(values) as RecordValues

        const updatedRecord = await updateRecord(_.get(db, ['query', _.camelCase(recordType), 'table']), id, parsedValues)

        return updatedRecord
    } catch (e: unknown) {
        const { error, data } = parsePutPostError(e)
        throw createError({
            statusCode: 400,
            statusMessage: error.message,
            data,
        })
    }
})
