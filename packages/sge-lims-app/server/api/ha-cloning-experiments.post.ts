import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'
import { haCloningExperiments, haCloningExperimentTargets } from '#shared/db/schema/plasmid-experiment'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    if (body.length !== 1) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid request body. Expected a single object.`,
      })
    }
    const insertSchema = (schemas as any).haCloningExperiments.insert
    const record = _.mapValues(body[0], (value) => _.isString(value) && _.isEmpty(value) ? null : value)
    const parsedRecord = insertSchema.parse(record)

    const db = useSgeDrizzle()
    const result = await db.transaction(async (tx) => {
      const newRecords = await tx.insert(haCloningExperiments).values([parsedRecord]).returning({
        id: haCloningExperiments.id,
        name: haCloningExperiments.name,
        startedOn: haCloningExperiments.startedOn,
        endedOn: haCloningExperiments.endedOn,
      })

      if (newRecords.length !== 1) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to create HA cloning experiment.' })
      }
      const newRecord = newRecords[0]!

      let newTargets: any[] = []
      if (_.size(body[0].haCloningExperimentTargets) > 0) {
        const toInsert = _.map(
          _.filter(body[0].haCloningExperimentTargets, (x) => !_.isEmpty(x.targetId)),
          (x) => ({ haCloningExperimentId: newRecord.id, targetId: x.targetId })
        )
        newTargets = await tx.insert(haCloningExperimentTargets).values(toInsert).returning({
          id: haCloningExperimentTargets.id,
          haCloningExperimentId: haCloningExperimentTargets.haCloningExperimentId,
          targetId: haCloningExperimentTargets.targetId,
        })
      }

      return { ...newRecord, haCloningExperimentTargets: newTargets }
    })
    return [result]
  } catch (e: any) {
    const { error, data } = parsePutPostError(e)
    throw createError({ statusCode: 400, statusMessage: error.message, data })
  }
})
