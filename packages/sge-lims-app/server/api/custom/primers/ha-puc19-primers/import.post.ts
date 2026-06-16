import _ from 'lodash'
import { v4 as uuid } from 'uuid'
import { inArray } from 'drizzle-orm'
import { homologyArmPrimers, homologyArmPuc19Primers } from '#shared/db/schema/primer'
import { schemas } from '#shared/db/zod/zodSchemas'
import type { RecordValues } from 'lims-layer/server/utils/record'
import { wellContents } from 'lims-layer/shared/db/schema/well'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!Array.isArray(body) || body.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Request body must be a non-empty array of records' })
    }

    const db = useSgeDrizzle()

    const haPrimerNames = _.uniq(
      _.map(body, (row) => _.trim(row.haPrimerName || row.homologyArmPrimerName || '')).filter(Boolean)
    )

    if (haPrimerNames.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No HA primer names found in the uploaded data (expected column: HA Primer Name)' })
    }

    const haPrimerRecords = await db.select().from(homologyArmPrimers).where(inArray(homologyArmPrimers.name, haPrimerNames))
    const haPrimersByName = _.keyBy(haPrimerRecords, 'name')

    const missingHaPrimers = _.difference(haPrimerNames, _.keys(haPrimersByName))
    if (missingHaPrimers.length > 0) {
      throw createError({ statusCode: 400, statusMessage: `HA primer names not found in database: ${missingHaPrimers.join(', ')}` })
    }

    const plateNames = _.uniq(_.map(body, (row) => _.trim(row.plateStorageBoxName || '')).filter(Boolean))
    const plateIdsByName = plateNames.length > 0 ? await plateStorageBoxNamesToIdsMap(plateNames, 'ha-puc19-primer-storage') : {}

    const missingPlates = _.difference(plateNames, _.keys(plateIdsByName))
    if (missingPlates.length > 0) {
      throw createError({ statusCode: 400, statusMessage: `HA pUC19 primer storage plates not found in database: ${missingPlates.join(', ')}` })
    }

    const primerRecords = _.map(body, (row) => {
      const haPrimerName = _.trim(row.haPrimerName || row.homologyArmPrimerName || '')
      const haPrimer = haPrimersByName[haPrimerName]

      const autoName = _.replace(_.replace(haPrimer.name, /_F$/gi, '_pUC19_F'), /_R$/gi, '_pUC19_R')
      let autoSequence = ''
      if (haPrimer.sequenceType === 'forward') {
        autoSequence = `GTTTTCCCAGTCACGACGTTGTAAAACGACGGCCAGT${haPrimer.sequence || ''}`
      } else if (haPrimer.sequenceType === 'reverse') {
        autoSequence = `GATTACGCCAAGCTTGCATGCCTGCAGGT${haPrimer.sequence || ''}`
      }

      return {
        id: uuid(),
        homologyArmPrimerId: haPrimer.id,
        name: _.trim(row.name || '') || autoName,
        sequence: _.trim(row.sequence || '') || autoSequence,
        orderedOn: row.orderedOn ? new Date(row.orderedOn) : null,
        notes: _.trim(row.notes || ''),
        plateStorageBoxName: _.trim(row.plateStorageBoxName || ''),
        wellTubeCoordinates: _.trim(row.wellTubeCoordinates || ''),
      }
    })

    const duplicateNames = _.keys(_.pickBy(_.countBy(primerRecords, 'name'), (count) => count > 1))
    if (duplicateNames.length > 0) throw createError({ statusCode: 400, statusMessage: `Duplicate primer names found: ${duplicateNames.join(', ')}` })
    if (_.filter(primerRecords, (p) => !p.name).length > 0) throw createError({ statusCode: 400, statusMessage: 'Some records are missing primer names' })

    const recordsForValidation = _.map(primerRecords, (r) => _.omit(r, 'plateStorageBoxName', 'wellTubeCoordinates')) as RecordValues[]

    try {
      _.forEach(recordsForValidation, (r) => (schemas as any).homologyArmPuc19Primers.insert.parse(r))
    } catch (zodError: any) {
      throw createError({ statusCode: 400, statusMessage: zodError.message || 'Validation error', data: zodError.errors || [{ message: zodError.message }] })
    }

    const result = await db.transaction(async (tx) => {
      const insertedPrimers = await tx.insert(homologyArmPuc19Primers).values(recordsForValidation).returning()

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
