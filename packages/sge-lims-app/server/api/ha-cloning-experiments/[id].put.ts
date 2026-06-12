import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'
import type { ZodObject } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import { haCloningExperiments, haCloningExperimentTargets } from '#shared/db/schema/sge/plasmid-experiment'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const db = useSgeDrizzle()

  try {
    const body = await readBody(event)
    const updateSchema = (schemas as any).haCloningExperiments.update as ZodObject<any>
    const record = _.mapValues(body, (value) => _.isString(value) && _.isEmpty(value) ? null : value)
    const parsedRecord = updateSchema.parse(record)

    const result = await db.transaction(async (tx) => {
      const updated = await tx.update(haCloningExperiments).set(parsedRecord).where(eq(haCloningExperiments.id, id)).returning({
        id: haCloningExperiments.id,
        startedOn: haCloningExperiments.startedOn,
        endedOn: haCloningExperiments.endedOn,
      })

      if (updated.length !== 1) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to update HA cloning experiment.' })
      }

      let existingTargets: any[] = []

      if (_.isArray(body.haCloningExperimentTargets)) {
        const toSync = _.map(
          _.filter(body.haCloningExperimentTargets, (x) => !_.isEmpty(x.targetId)),
          (x) => ({ haCloningExperimentId: updated[0].id, targetId: x.targetId })
        )
        existingTargets = await tx.select().from(haCloningExperimentTargets)
          .where(eq(haCloningExperimentTargets.haCloningExperimentId, updated[0].id))

        const missing = _.difference(_.map(existingTargets, 'targetId'), _.map(body.haCloningExperimentTargets, 'targetId'))
        if (!_.isEmpty(missing)) {
          await tx.delete(haCloningExperimentTargets).where(inArray(haCloningExperimentTargets.targetId, missing))
        }

        const toInsert = _.filter(toSync, (x) => !_.includes(_.map(existingTargets, 'targetId'), x.targetId))
        if (!_.isEmpty(toInsert)) {
          existingTargets.push(...await tx.insert(haCloningExperimentTargets).values(toInsert).returning())
        }
      }

      return { ...updated[0], haCloningExperimentTargets: existingTargets }
    })
    return result
  } catch (e: any) {
    const { error, data } = parsePutPostError(e)
    throw createError({ statusCode: 400, statusMessage: error.message, data })
  }
})
