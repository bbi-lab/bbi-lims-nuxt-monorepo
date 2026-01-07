import { updateRecord } from '../../utils/record'
import _ from 'lodash'
import { schemas } from '../../db/zod/zodSchemas'
import type { ZodObject } from 'zod'
// import { updateTargets as updateTranfectExperimentTargets} from '~/server/services/transfect-experiment-services'
import { parsePutPostError } from '../../utils/restApi'
// import { updateHomologyArmPrimerTargets } from '~/server/utils/sge'
import type { RecordValues } from '../../utils/record'

export default defineEventHandler(async (event) => {
    const { recordType, id } = event.context.params as {recordType: string, id: string}
    if (recordType != _.kebabCase(recordType)) {
        throw createError({
            statusCode: 400,
            statusMessage: `Invalid record type: ${recordType}. Record type must be kebab-case.`
        })
    }

    try {
        const body = await readBody(event)
        const updateSchema = schemas[_.camelCase(recordType)].update as ZodObject
        const values = _.mapValues(body, (value) => _.isString(value) && _.isEmpty(value) ? null : value)
        const parsedValues = updateSchema.parse(values) as RecordValues

        // many-to-many
        // if (_.camelCase(recordType) == 'transfectExperiments' && _.isArray(body.transfectTargets)) {
        //     const transfectionTargets = _.map(body.transfectTargets, (x) => {
        //         return {
        //             id: x.id,
        //             targetId: x.targetId,
        //             transfectionCount: x.transfectionCount,
        //             negativeControl: x.negativeControl
        //         }
        //     })
        //     await updateTranfectExperimentTargets(id, transfectionTargets)
        // } else if (_.camelCase(recordType) == 'homologyArmPrimers' && _.isArray(body.targets)) {
        //     const haPrimerTargetIds = _.map(body.targets, 'targetId')
        //     await updateHomologyArmPrimerTargets(id, haPrimerTargetIds)
        // }

        const updatedRecord = await updateRecord(_.get(db, ['query', _.camelCase(recordType), 'table']), id, parsedValues)

        return updatedRecord
    } catch (e: unknown) {
        const { error, data } = parsePutPostError(e)

        throw createError({
            statusCode: 400,
            statusMessage: error.message,
            data
        })
    }
})
