import _ from 'lodash'
import { insertRecords, type RecordValues } from '../utils/record'
import { schemas } from '../../shared/db/zod/zodSchemas'
import type { ZodObject } from 'zod'
import { useDrizzle } from '../utils/db'
import { parsePutPostError } from '../utils/restApi'
// import { updateHomologyArmPrimerTargets } from '../utils/sge'

export default defineEventHandler(async (event) => {
    const { recordType } = event.context.params as {recordType: string}
    if (recordType != _.kebabCase(recordType)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid record type: ${recordType}. Record type must be kebab-case.`
        })
    }

    const db = useDrizzle()
    try {
        const body = await readBody(event)
        const insertSchema = (schemas as any)[_.camelCase(recordType)].insert as ZodObject
        const records = _.map(body, (x) => {
            const record = _.mapValues(x, (value) => _.isString(value) && _.isEmpty(value) ? null : value)
            return insertSchema.parse(record)
        }) as RecordValues[]

        const newRecords = await insertRecords(_.get(db, ['query', _.camelCase(recordType), 'table']), records)

        // handle single HA primer inserts that include 1:M targets
        // if (_.camelCase(recordType) == 'homologyArmPrimers' && body.length == 1 && _.isArray(body[0].targets) && newRecords?.length == 1) {
        //    const targets = await updateHomologyArmPrimerTargets(newRecords[0].id, _.map(body[0].targets, 'targetId'))
        //     _.set(newRecords, '0.targets', targets)
        // }

        return newRecords
    } catch (e: unknown) {
        const { error, data } = parsePutPostError(e)

        throw createError({
            statusCode: 400,
            statusMessage: error.message,
            data
        })
    }
})
