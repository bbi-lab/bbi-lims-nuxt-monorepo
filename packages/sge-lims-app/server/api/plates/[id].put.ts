import _ from 'lodash'
import { schemas, plates, type UpdatePlate } from '#shared/db/schema/sge/plate'

export default defineEventHandler<{ body: UpdatePlate }>(async (event) => {
  const { id } = event.context.params as { id: string }
  const db = useSgeDrizzle()

  try {
    const body = await readBody(event)
    const values = schemas.updatePlateSchema.parse(body)

    if (_.has(values, 'plateType')) {
      const existingPlate = await db.query.plates.findFirst({ where: { id } })
      if (existingPlate && existingPlate.plateType !== values.plateType) {
        const wellsWithContents = await db.query.wells.findMany({
          with: { wellContents: true },
          where: { plateId: id },
        })
        const nonEmptyWell = wellsWithContents.find((well) => !_.isEmpty(well.wellContents))
        if (nonEmptyWell) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Plate wells must be empty before changing plate type',
          })
        }
      }
    }

    const updatedRecord = await updateRecord(plates, id, values as RecordValues)
    return updatedRecord
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e.message })
  }
})
