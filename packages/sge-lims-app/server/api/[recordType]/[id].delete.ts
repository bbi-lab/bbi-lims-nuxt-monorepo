import _ from 'lodash'
import { eq } from 'drizzle-orm'
import { transfectTargets } from '#shared/db/schema/sge/transfect-experiment'
import { homologyArmPrimerTargets, preseq1PrimerTargets, rnaPreseq1PrimerTargets, rnaPreseq2PrimerTargets } from '#shared/db/schema/sge/primer'
import { clonalHaTargets, sgRnaOligoTargets, sgeOligoLots } from '#shared/db/schema/sge/oligos'
import { deleteEmptyPlate } from '../../utils/sge'
import { pcr1ExperimentMasterMixVolumes, pcr2ExperimentMasterMixVolumes, pcrExperimentTargets } from '#shared/db/schema/sge/pcr-experiment'
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
    const table = _.get(db, ['query', _.camelCase(recordType), 'table'])

    if (!table) {
      throw createError({
        statusCode: 500,
        statusMessage: `Could not find table, check to make sure ${_.camelCase(recordType)} is included in drizzle db schemas`,
      })
    }

    const deletedRecord = await db.transaction(async (tx) => {
      if (_.camelCase(recordType) == 'transfectExperiments') {
        await tx.delete(transfectTargets).where(eq(transfectTargets.experimentId, id))
      } else if (_.camelCase(recordType) == 'homologyArmPrimers') {
        await tx.delete(homologyArmPrimerTargets).where(eq(homologyArmPrimerTargets.homologyArmPrimerId, id))
      } else if (_.camelCase(recordType) == 'preseq1Primers') {
        await tx.delete(preseq1PrimerTargets).where(eq(preseq1PrimerTargets.preseq1PrimerId, id))
      } else if (_.camelCase(recordType) == 'rnaPreseq1Primers') {
        await tx.delete(rnaPreseq1PrimerTargets).where(eq(rnaPreseq1PrimerTargets.rnaPreseq1PrimerId, id))
      } else if (_.camelCase(recordType) == 'rnaPreseq2Primers') {
        await tx.delete(rnaPreseq2PrimerTargets).where(eq(rnaPreseq2PrimerTargets.rnaPreseq2PrimerId, id))
      } else if (_.camelCase(recordType) == 'sgRnaOligos') {
        await tx.delete(sgRnaOligoTargets).where(eq(sgRnaOligoTargets.sgRnaOligoId, id))
      } else if (_.camelCase(recordType) == 'pcrExperiments') {
        await tx.delete(pcrExperimentTargets).where(eq(pcrExperimentTargets.pcrExperimentId, id))
        await tx.delete(pcr1ExperimentMasterMixVolumes).where(eq(pcr1ExperimentMasterMixVolumes.pcrExperimentId, id))
        await tx.delete(pcr2ExperimentMasterMixVolumes).where(eq(pcr2ExperimentMasterMixVolumes.pcrExperimentId, id))
      } else if (_.camelCase(recordType) == 'clonalHas') {
        await tx.delete(clonalHaTargets).where(eq(clonalHaTargets.clonalHaId, id))
      } else if (_.camelCase(recordType) == 'sgRnaPlasmids') {
        await tx.delete(sgRnaPlasmidTargets).where(eq(sgRnaPlasmidTargets.sgRnaPlasmidId, id))
      } else if (_.camelCase(recordType) == 'sgeOligos') {
        await tx.delete(sgeOligoLots).where(eq(sgeOligoLots.sgeOligoId, id))
      } else if (_.camelCase(recordType) == 'lots') {
        await tx.delete(sgeOligoLots).where(eq(sgeOligoLots.lotId, id))
      }

      const deleteResult = await tx.delete(table).where(eq(table.id, id)).returning()

      if (_.camelCase(recordType) == 'pcrExperiments') {
        const plateId = _.get(deleteResult, '0.plateId')
        if (plateId) await deleteEmptyPlate(plateId, tx)
      }

      return _.get(deleteResult, '0')
    })

    return deletedRecord
  } catch (e: any) {
    await parseDeleteError(e)
    throw createError({ statusCode: 400, statusMessage: e.statusMessage || e.message })
  }
})
