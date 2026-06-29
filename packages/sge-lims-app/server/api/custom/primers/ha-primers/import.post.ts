import _ from 'lodash'
import { v4 as uuid } from 'uuid'
import { homologyArmPrimers, homologyArmPrimerTargets } from '#shared/db/schema/primer'
import { schemas } from '#shared/db/zod/zodSchemas'
import type { RecordValues } from 'lims-layer/server/utils/record'
import { wellContents } from 'lims-layer/shared/db/schema/well'

export default defineEventHandler(async (event) => {
  try {
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
      throw createError({ statusCode: 400, statusMessage: 'No target names found in the uploaded data (expected column: Target Name(s))' })
    }

    const targetIdsByName = await targetNamesToIdsMap(targetNames)

    const missingTargets = _.difference(targetNames, _.keys(targetIdsByName))
    if (missingTargets.length > 0) {
      throw createError({ statusCode: 400, statusMessage: `Target names not found in database: ${missingTargets.join(', ')}` })
    }

    const plateNames = _.uniq(_.map(body, (row) => _.trim(row.plateStorageBoxName || '')).filter(Boolean))
    const plateIdsByName = plateNames.length > 0 ? await plateStorageBoxNamesToIdsMap(plateNames, 'ha-primer-storage') : {}

    const missingPlates = _.difference(plateNames, _.keys(plateIdsByName))
    if (missingPlates.length > 0) {
      throw createError({ statusCode: 400, statusMessage: `HA primer storage plates not found in database: ${missingPlates.join(', ')}` })
    }

    const primerRecords = _.map(body, (row) => ({
      id: uuid(),
      name: _.trim(row.primerName || row.name || ''),
      sequence: _.trim(row.sequence || ''),
      sequenceType: _.toLower(_.trim(row.forwardReverse || '')),
      cloningStrategy: _.trim(row.cloningStrategy || '') || null,
      orderedOn: row.orderedOn ? new Date(row.orderedOn) : null,
      notes: _.trim(row.notes || ''),
      targetNames: _.map(_.split(row.targetNameS || '', ','), (name) => _.trim(name)).filter(Boolean),
      plateStorageBoxName: _.trim(row.plateStorageBoxName || ''),
      wellTubeCoordinates: _.trim(row.wellTubeCoordinates || ''),
    }))

    const duplicateNames = _.keys(_.pickBy(_.countBy(primerRecords, 'name'), (count) => count > 1))
    if (duplicateNames.length > 0) throw createError({ statusCode: 400, statusMessage: `Duplicate primer names found: ${duplicateNames.join(', ')}` })
    if (_.filter(primerRecords, (p) => !p.name).length > 0) throw createError({ statusCode: 400, statusMessage: 'Some records are missing primer names' })
    if (_.filter(primerRecords, (p) => !p.sequence).length > 0) throw createError({ statusCode: 400, statusMessage: 'Some records are missing sequences' })
    const invalidSequenceTypes = _.filter(primerRecords, (p) => p.sequenceType && !['forward', 'reverse'].includes(p.sequenceType))
    if (invalidSequenceTypes.length > 0) throw createError({ statusCode: 400, statusMessage: `Invalid sequence types (must be 'forward' or 'reverse'): ${_.map(invalidSequenceTypes, 'name').join(', ')}` })

    const recordsForValidation = _.map(primerRecords, (r) => _.omit(r, 'targetNames', 'plateStorageBoxName', 'wellTubeCoordinates')) as RecordValues[]

    try {
      _.forEach(recordsForValidation, (r) => (schemas as any).homologyArmPrimers.insert.parse(r))
    } catch (zodError: any) {
      throw createError({ statusCode: 400, statusMessage: zodError.message || 'Validation error', data: zodError.errors || [{ message: zodError.message }] })
    }

    const db = useSgeDrizzle()
    const result = await db.transaction(async (tx) => {
      const insertedPrimers = await tx.insert(homologyArmPrimers).values(recordsForValidation as (typeof homologyArmPrimers.$inferInsert)[]).returning()

      for (let i = 0; i < insertedPrimers.length; i++) {
        const insertedPrimer = insertedPrimers[i]!
        const primerRecord = primerRecords[i]
        if (!primerRecord) continue
        const rowTargetNames = primerRecord.targetNames
        if (rowTargetNames.length > 0) {
          const targetIds = _.compact(_.map(rowTargetNames, (name) => targetIdsByName[name]))
          if (targetIds.length > 0) {
            await updateRelatedTargets(homologyArmPrimerTargets, 'homologyArmPrimerId', 'targetId', insertedPrimer.id, targetIds, tx)
          }
        }
      }

      for (let i = 0; i < insertedPrimers.length; i++) {
        const insertedPrimer = insertedPrimers[i]!
        const orig = _.find(primerRecords, { name: insertedPrimer.name })
        const plateName = orig?.plateStorageBoxName
        const wellLocation = orig?.wellTubeCoordinates
        if (plateName && wellLocation) {
          const wellId = await getWellIdFromPlateNameAndWellLocation(plateName, wellLocation, tx)
          const count = await wellContentsCount(wellId, tx)
          if (count > 0) throw createError({ statusCode: 400, statusMessage: `Well '${wellLocation}' in '${plateName}' is already occupied.` })
          await tx.insert(wellContents).values({ wellId, wellableId: insertedPrimer.id })
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
