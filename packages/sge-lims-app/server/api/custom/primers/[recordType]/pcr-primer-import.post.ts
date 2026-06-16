import _ from 'lodash'
import { v4 as uuid } from 'uuid'
import { rnaPreseq2Primers, rnaPreseq1Primers, preseq2Primers, preseq1Primers, rnaPreseq1PrimerTargets, rnaPreseq2PrimerTargets, preseq1PrimerTargets } from '#shared/db/schema/primer'
import { schemas } from '#shared/db/zod/zodSchemas'
import type { RecordValues } from 'lims-layer/server/utils/record'
import { wellContents } from 'lims-layer/shared/db/schema/well'
import type { PgTable } from 'drizzle-orm/pg-core'

const RECORD_TYPE_CONFIG_MAP: Record<string, any> = {
  'rna-preseq1-primers': {
    table: rnaPreseq1Primers,
    zodSchema: (schemas as any).rnaPreseq1Primers.insert,
    updateRelatedTargetParams: { table: rnaPreseq1PrimerTargets, parentIdKey: 'rnaPreseq1PrimerId', targetIdKey: 'targetId' },
    plateType: 'rna-preseq-1-primer-storage',
  },
  'rna-preseq2-primers': {
    table: rnaPreseq2Primers,
    zodSchema: (schemas as any).rnaPreseq2Primers.insert,
    updateRelatedTargetParams: { table: rnaPreseq2PrimerTargets, parentIdKey: 'rnaPreseq2PrimerId', targetIdKey: 'targetId' },
    plateType: 'rna-preseq-2-primer-storage',
  },
  'preseq1-primers': {
    table: preseq1Primers,
    zodSchema: (schemas as any).preseq1Primers.insert,
    updateRelatedTargetParams: { table: preseq1PrimerTargets, parentIdKey: 'preseq1PrimerId', targetIdKey: 'targetId' },
    plateType: 'dna-preseq-1-primer-storage',
  },
  'preseq2-primers': {
    table: preseq2Primers,
    zodSchema: (schemas as any).preseq2Primers.insert,
    plateType: 'dna-preseq-2-primer-storage',
  },
}

export default defineEventHandler(async (event) => {
  try {
    const { recordType } = event.context.params as { recordType: string }
    const recordTypeConfig = _.get(RECORD_TYPE_CONFIG_MAP, recordType)
    if (!recordTypeConfig) {
      throw createError({ statusCode: 400, statusMessage: `Invalid record type: ${recordType}.` })
    }

    const body = await readBody(event)
    if (!Array.isArray(body) || body.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Request body must be a non-empty array of records' })
    }

    const targetNames = _.uniq(
      _.flatMap(body, (row) =>
        _.map(_.split(row.targetNameS || '', ','), (name) => _.trim(name)).filter(Boolean)
      )
    )

    if (targetNames.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No target names found in the uploaded data' })
    }

    const targetIdsByName = await targetNamesToIdsMap(targetNames)

    const missingTargets = _.difference(targetNames, _.keys(targetIdsByName))
    if (missingTargets.length > 0) {
      throw createError({ statusCode: 400, statusMessage: `Target names not found in database: ${missingTargets.join(', ')}` })
    }

    const plateNames = _.uniq(_.map(body, (row) => _.trim(row.plateStorageBoxName || '')).filter(Boolean))
    const plateIdsByName = plateNames.length > 0 ? await plateStorageBoxNamesToIdsMap(plateNames, recordTypeConfig.plateType) : {}

    const missingPlates = _.difference(plateNames, _.keys(plateIdsByName))
    if (missingPlates.length > 0) {
      const plateType = await useSgeDrizzle().query.plateTypes.findFirst({ where: { value: recordTypeConfig.plateType } })
      const plateTypeName = plateType?.label ?? recordTypeConfig.plateType
      throw createError({ statusCode: 400, statusMessage: `${plateTypeName} not found in database: ${missingPlates.join(', ')}` })
    }

    const primerRecords = _.map(body, (row) => {
      const primerRecord: any = {
        id: uuid(),
        name: _.trim(row.primerName || row.name || ''),
        sequence: _.trim(row.sequence || ''),
        sequenceType: _.toLower(row.forwardReverse),
        orderedOn: row.orderedOn ? new Date(row.orderedOn) : null,
        notes: _.trim(row.notes || ''),
        targetNames: _.map(_.split(row.targetNameS || '', ','), (name) => _.trim(name)).filter(Boolean),
        plateStorageBoxName: _.trim(row.plateStorageBoxName || ''),
        wellTubeCoordinates: _.trim(row.wellTubeCoordinates || ''),
      }
      if (_.has(row, 'adapterSequence')) {
        primerRecord.adapterSequence = _.trim(row.adapterSequence || '')
      }
      return primerRecord
    })

    const duplicateNames = _.keys(_.pickBy(_.countBy(primerRecords, 'name'), (count) => count > 1))
    if (duplicateNames.length > 0) throw createError({ statusCode: 400, statusMessage: `Duplicate primer names found: ${duplicateNames.join(', ')}` })
    if (_.filter(primerRecords, (p) => !p.name).length > 0) throw createError({ statusCode: 400, statusMessage: 'Some records are missing primer names' })
    if (_.filter(primerRecords, (p) => !p.sequence).length > 0) throw createError({ statusCode: 400, statusMessage: 'Some records are missing sequences' })
    const invalidSequenceTypes = _.filter(primerRecords, (p) => p.sequenceType && !['forward', 'reverse'].includes(p.sequenceType))
    if (invalidSequenceTypes.length > 0) throw createError({ statusCode: 400, statusMessage: `Invalid sequence types (must be 'forward' or 'reverse'): ${_.map(invalidSequenceTypes, 'name').join(', ')}` })

    let recordsForValidation: RecordValues[]
    if (recordType === 'preseq2-primers') {
      recordsForValidation = _.map(primerRecords, (record) => ({
        ..._.omit(record, 'targetNames', 'plateStorageBoxName', 'wellTubeCoordinates'),
        targetId: targetIdsByName[record.targetNames[0]],
      })) as RecordValues[]
    } else {
      recordsForValidation = _.map(primerRecords, (record) => _.omit(record, 'targetNames', 'plateStorageBoxName', 'wellTubeCoordinates')) as RecordValues[]
    }

    try {
      _.forEach(recordsForValidation, (record) => recordTypeConfig.zodSchema.parse(record))
    } catch (zodError: any) {
      throw createError({ statusCode: 400, statusMessage: zodError.message || 'Validation error', data: zodError.errors || [{ message: zodError.message }] })
    }

    const db = useSgeDrizzle()
    const result = await db.transaction(async (tx) => {
      const primerTable: PgTable<any> = recordTypeConfig.table
      const insertedPrimers = await tx.insert(primerTable).values(recordsForValidation).returning()

      for (let i = 0; i < insertedPrimers.length; i++) {
        const primer = insertedPrimers[i]
        const rowTargetNames = primerRecords[i].targetNames || []

        if (rowTargetNames.length > 0 && _.has(recordTypeConfig, 'updateRelatedTargetParams')) {
          const targetIds = _.map(rowTargetNames, (name) => targetIdsByName[name]).filter(Boolean)
          if (targetIds.length > 0) {
            await updateRelatedTargets(
              recordTypeConfig.updateRelatedTargetParams.table,
              recordTypeConfig.updateRelatedTargetParams.parentIdKey,
              recordTypeConfig.updateRelatedTargetParams.targetIdKey,
              primer.id,
              targetIds,
              tx,
            )
          }
        }
      }

      for (let i = 0; i < insertedPrimers.length; i++) {
        const orig = _.find(primerRecords, { name: insertedPrimers[i].name })
        const plateName = orig?.plateStorageBoxName
        const wellLocation = orig?.wellTubeCoordinates
        if (plateName && wellLocation) {
          const wellId = await getWellIdFromPlateNameAndWellLocation(plateName, wellLocation, tx)
          const count = await wellContentsCount(wellId, tx)
          if (count > 0) throw createError({ statusCode: 400, statusMessage: `Well '${wellLocation}' in '${plateName}' is already occupied.` })
          await tx.insert(wellContents).values({ wellId, wellableId: insertedPrimers[i].id })
        }
      }

      return insertedPrimers
    })

    return { success: true, insertedCount: result.length, primers: result }
  } catch (e: any) {
    const { error, data } = parsePutPostError(e)
    throw createError({ statusCode: 400, statusMessage: error.message, data })
  }
})
