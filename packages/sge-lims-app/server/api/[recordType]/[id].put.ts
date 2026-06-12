import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'
import type { ZodObject } from 'zod'
import { eq } from 'drizzle-orm'
import { homologyArmPrimerTargets, preseq1PrimerTargets, rnaPreseq1PrimerTargets, rnaPreseq2PrimerTargets } from '#shared/db/schema/sge/primer'
import { pcrExperimentTargets } from '#shared/db/schema/sge/pcr-experiment'
import { clonalHaTargets, sgeOligoLots, sgRnaOligoTargets } from '#shared/db/schema/sge/oligos'
import { sgRnaPlasmidTargets } from '#shared/db/schema/sge/plasmid'

export default defineEventHandler(async (event) => {
  const { recordType, id } = event.context.params as { recordType: string, id: string }
  if (recordType != _.kebabCase(recordType)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid record type: ${recordType}. Record type must be kebab-case.`,
    })
  }

  const db = useSgeDrizzle()
  try {
    const body = await readBody(event)
    const updateSchema = (schemas as any)[_.camelCase(recordType)].update as ZodObject<any>
    const values = _.mapValues(body, (value) => _.isString(value) && _.isEmpty(value) ? null : value)
    const parsedValues = updateSchema.parse(values)

    const updatedRecord = await db.transaction(async (tx) => {
      const table = _.get(db, ['query', _.camelCase(recordType), 'table'])
      const [recordUpdated] = await tx.update(table).set(parsedValues).where(eq(table.id, id)).returning()

      if (_.camelCase(recordType) == 'homologyArmPrimers' && _.isArray(body.targets)) {
        const targets = await updateRelatedTargets(homologyArmPrimerTargets, 'homologyArmPrimerId', 'targetId', id, _.map(body.targets, 'targetId'), tx)
        _.set(recordUpdated, 'targets', targets)
      } else if (_.camelCase(recordType) == 'pcrExperiments' && _.isArray(body.pcrExperimentTargets)) {
        const targets = await updateRelatedTargets(pcrExperimentTargets, 'pcrExperimentId', 'transfectTargetId', id, _.map(body.pcrExperimentTargets, 'transfectTargetId'), tx)
        _.set(recordUpdated, 'pcrExperimentTargets', targets)
      } else if (_.camelCase(recordType) == 'preseq1Primers' && _.isArray(body.preseq1PrimerTargets)) {
        const targets = await updateRelatedTargets(preseq1PrimerTargets, 'preseq1PrimerId', 'targetId', id, _.map(body.preseq1PrimerTargets, 'targetId'), tx)
        _.set(recordUpdated, 'preseq1PrimerTargets', targets)
      } else if (_.camelCase(recordType) == 'rnaPreseq1Primers' && _.isArray(body.rnaPreseq1PrimerTargets)) {
        const ids = _.compact(_.map(body.rnaPreseq1PrimerTargets, 'targetId'))
        const targets = await updateRelatedTargets(rnaPreseq1PrimerTargets, 'rnaPreseq1PrimerId', 'targetId', id, ids, tx)
        _.set(recordUpdated, 'rnaPreseq1PrimerTargets', targets)
      } else if (_.camelCase(recordType) == 'rnaPreseq2Primers' && _.isArray(body.rnaPreseq2PrimerTargets)) {
        const ids = _.compact(_.map(body.rnaPreseq2PrimerTargets, 'targetId'))
        const targets = await updateRelatedTargets(rnaPreseq2PrimerTargets, 'rnaPreseq2PrimerId', 'targetId', id, ids, tx)
        _.set(recordUpdated, 'rnaPreseq2PrimerTargets', targets)
      } else if (_.camelCase(recordType) == 'sgRnaOligos' && _.isArray(body.sgRnaOligoTargets)) {
        const ids = _.compact(_.map(body.sgRnaOligoTargets, 'targetId'))
        const targets = await updateRelatedTargets(sgRnaOligoTargets, 'sgRnaOligoId', 'targetId', id, ids, tx)
        _.set(recordUpdated, 'sgRnaOligoTargets', targets)
      } else if (_.camelCase(recordType) == 'sgRnaPlasmids' && _.isArray(body.sgRnaPlasmidTargets)) {
        const ids = _.compact(_.map(body.sgRnaPlasmidTargets, 'targetId'))
        const targets = await updateRelatedTargets(sgRnaPlasmidTargets, 'sgRnaPlasmidId', 'targetId', id, ids, tx)
        _.set(recordUpdated, 'sgRnaPlasmidTargets', targets)
      } else if (_.camelCase(recordType) == 'clonalHas' && _.isArray(body.clonalHaTargets)) {
        const ids = _.compact(_.map(body.clonalHaTargets, 'targetId'))
        const targets = await updateRelatedTargets(clonalHaTargets, 'clonalHaId', 'targetId', id, ids, tx)
        _.set(recordUpdated, 'clonalHaTargets', targets)
      } else if (_.camelCase(recordType) == 'sgeOligos' && _.isArray(body.sgeOligoLots)) {
        const lotIds = _.compact(_.map(body.sgeOligoLots, 'lotId'))
        const updatedLots = await updateRelatedLots(sgeOligoLots, 'sgeOligoId', 'lotId', id, lotIds, tx)
        _.set(recordUpdated, 'sgeOligoLots', updatedLots)
      }

      return recordUpdated
    })

    return updatedRecord
  } catch (e: any) {
    const { error, data } = parsePutPostError(e)
    throw createError({ statusCode: 400, statusMessage: error.message, data })
  }
})
