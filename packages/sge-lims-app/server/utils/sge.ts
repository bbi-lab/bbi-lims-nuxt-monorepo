import _ from 'lodash'
import { and, eq, inArray } from 'drizzle-orm'
import type { PgTable, PgTransaction } from 'drizzle-orm/pg-core'
import { v4 as uuidv4 } from 'uuid'
import { sgeDb } from './db'
import { pcrExperiments } from '#shared/db/schema/pcr-experiment'
import { sgRnaCloningExperiments } from '#shared/db/schema/plasmid-experiment'
import { plates } from 'lims-layer/shared/db/schema/plate'
import { targets } from '#shared/db/schema/target'
import { wells, wellContents, wellContentSources } from 'lims-layer/shared/db/schema/well'

// plateType is a FK to plate_types.value (open lookup set), so it is just a string at the type level.
type PlateType = string
type NewPlate = typeof plates.$inferInsert

export interface WellContentWithSource {
  id?: string
  wellId: string
  wellableId: string
  sourceWellIds?: string[]
  createdBy?: string
  [key: string]: unknown
}

export async function insertPlate(values: NewPlate, tx?: PgTransaction<any, any, any>) {
  const newPlate = _.first(await (tx ?? sgeDb)
    .insert(plates)
    .values(values)
    .returning()
  )

  if (newPlate) {
    const allWells = []
    for (let x = 1; x <= newPlate.sizeX; x++) {
      for (let y = 1; y <= newPlate.sizeY; y++) {
        allWells.push({ plateId: newPlate.id, x, y })
      }
    }
    await (tx ?? sgeDb).insert(wells).values(allWells)
  }
  return newPlate
}

export async function insertWellContentsAndSources(records: WellContentWithSource[]) {
  const newWellContentSources = _.flatMap(records, (x) =>
    _.map(x.sourceWellIds || [], (sourceWellId) => ({
      wellContentId: x.id!,
      sourceWellId,
      createdBy: x.createdBy || null,
    }))
  )
  const newWellContents = _.map(records, (x) => _.omit(x, ['sourceWellIds', 'createdBy']))

  return sgeDb.transaction(async (tx) => {
    await tx.insert(wellContents).values(newWellContents as any[])
    if (!_.isEmpty(newWellContentSources)) {
      await tx.insert(wellContentSources).values(newWellContentSources)
    }
    return tx.select().from(wellContents).where(inArray(wellContents.id, _.map(newWellContents, 'id') as string[]))
  })
}

export const updateRelatedTargets = async (
  table: PgTable<any>,
  parentIdKey: string,
  targetIdKey: string,
  id: string,
  targetIds: string[],
  tx?: PgTransaction<any, any, any>,
) => {
  const parentIdCol = (table as any)[parentIdKey]
  const targetIdCol = (table as any)[targetIdKey]

  const updateFunction = async (tx: PgTransaction<any, any, any>) => {
    const existing = await tx.select().from(table).where(eq(parentIdCol, id))

    const missingIds = _.difference(_.map(existing, targetIdKey), targetIds)
    await tx.delete(table).where(and(eq(parentIdCol, id), inArray(targetIdCol, missingIds)))

    const idsToInsert = _.difference(targetIds, _.map(existing, targetIdKey))
    if (!_.isEmpty(idsToInsert)) {
      existing.push(...await tx.insert(table).values(
        idsToInsert.map(tId => ({ [targetIdKey]: tId, [parentIdKey]: id }))
      ).returning())
    }
    return existing
  }

  return tx ? await updateFunction(tx) : await sgeDb.transaction(async (tx) => await updateFunction(tx))
}

export const updateRelatedLots = async (
  table: PgTable<any>,
  parentIdKey: string,
  lotIdKey: string,
  id: string,
  lotIds: string[],
  tx?: PgTransaction<any, any, any>,
) => {
  const parentIdCol = (table as any)[parentIdKey]
  const lotIdCol = (table as any)[lotIdKey]

  const updateFunction = async (tx: PgTransaction<any, any, any>) => {
    const existing = await tx.select().from(table).where(eq(parentIdCol, id))

    const removedIds = _.difference(_.map(existing, lotIdKey), lotIds)
    if (!_.isEmpty(removedIds)) {
      await tx.delete(table).where(and(eq(parentIdCol, id), inArray(lotIdCol, removedIds)))
    }

    const idsToInsert = _.difference(lotIds, _.map(existing, lotIdKey))
    if (!_.isEmpty(idsToInsert)) {
      existing.push(...await tx.insert(table).values(
        idsToInsert.map(lotId => ({ [lotIdKey]: lotId, [parentIdKey]: id }))
      ).returning())
    }
    return existing.filter(r => !removedIds.includes(r[lotIdKey]))
  }

  return tx ? await updateFunction(tx) : await sgeDb.transaction(async (tx) => await updateFunction(tx))
}

export async function deleteEmptyPlate(plateId: string, tx?: PgTransaction<any, any, any>) {
  const nonEmptyWells = await (tx ?? sgeDb).select()
    .from(wells)
    .innerJoin(wellContents, eq(wells.id, wellContents.wellId))
    .where(eq(wells.plateId, plateId))

  if (nonEmptyWells.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Plate wells must be empty before deleting',
    })
  }

  const associatedPcrExperiments = await (tx ?? sgeDb).select().from(pcrExperiments).where(eq(pcrExperiments.plateId, plateId))
  if (associatedPcrExperiments.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This plate is associated with a PCR experiment and will be deleted when the experiment is deleted.',
    })
  }

  const associatedSgRnaCloningExperiments = await (tx ?? sgeDb).select().from(sgRnaCloningExperiments).where(eq(sgRnaCloningExperiments.plateId, plateId))
  if (associatedSgRnaCloningExperiments.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This plate is associated with an sgRNA cloning experiment and will be deleted when the experiment is deleted.',
    })
  }

  const emptyWells = await (tx ?? sgeDb).select().from(wells).where(eq(wells.plateId, plateId))
  await (tx ?? sgeDb).delete(wellContentSources).where(inArray(wellContentSources.sourceWellId, _.map(emptyWells, 'id')))
  await (tx ?? sgeDb).delete(wells).where(eq(wells.plateId, plateId))
  const [deletedRecord] = await (tx ?? sgeDb).delete(plates).where(eq(plates.id, plateId)).returning()
  return deletedRecord
}

export async function plateStorageBoxNamesToIdsMap(plateStorageBoxNames: string[], plateType: PlateType, tx?: PgTransaction<any, any, any>) {
  const plateRecords = await (tx ?? sgeDb).select().from(plates).where(and(inArray(plates.name, plateStorageBoxNames), eq(plates.plateType, plateType)))
  const plateNameToIdMap = _.keyBy(plateRecords, 'name')
  return _.mapValues(plateNameToIdMap, 'id')
}

export async function targetNamesToIdsMap(targetNames: string[], tx?: PgTransaction<any, any, any>) {
  const targetRecords = await (tx ?? sgeDb).select().from(targets).where(inArray(targets.name, targetNames))
  const targetNameToIdMap = _.keyBy(targetRecords, 'name')
  return _.mapValues(targetNameToIdMap, 'id')
}

export const getWellIdFromPlateNameAndWellLocation = async (plateName: string, wellLocation: string, tx?: PgTransaction<any, any, any>) => {
  const plateRecord = await (tx ?? sgeDb).select().from(plates).where(eq(plates.name, plateName)).limit(1)

  if (plateRecord.length !== 1) {
    throw new Error(`Could not find plate with name ${plateName}`)
  }

  const match = wellLocation.match(/^([A-Za-z]+)(\d+)$/)
  if (!match) {
    throw new Error(`Invalid well location format: ${wellLocation}`)
  }
  const yCoord = match[1].toLowerCase().charCodeAt(0) - 96
  const xCoord = parseInt(match[2])

  const wellRecord = await (tx ?? sgeDb).select().from(wells).where(and(eq(wells.plateId, plateRecord[0].id), eq(wells.x, xCoord), eq(wells.y, yCoord))).limit(1)

  if (wellRecord.length !== 1) {
    throw new Error(`Could not find well with location ${wellLocation} in plate ${plateName}`)
  }

  return wellRecord[0].id
}

export const wellContentsCount = async (wellId: string, tx?: PgTransaction<any, any, any>) => {
  const wellContent = await (tx ?? sgeDb).select().from(wellContents).where(eq(wellContents.wellId, wellId))
  return wellContent.length
}
