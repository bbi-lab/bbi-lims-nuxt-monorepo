import { updateRecord } from '../../utils/record'
import { plates } from '../../../shared/db/schema/plate'
import { schemas } from '../../../shared/db/zod/zodSchemas'
import { wells } from '../../../shared/db/schema/well'
import { eq } from 'drizzle-orm'
import _ from 'lodash'

export default defineEventHandler<{ body: UpdatePlate }>(async (event) => {
    const { id } = event.context.params as {id: string}
    try {

        const body = await readBody(event)
        const values = schemas.plates.update!.parse(body)

        // only allow plateType to change if wells are empty
        const existingPlate = await db.query.plates.findFirst({where: { id } as any})
        if (_.has(values, 'plateType') && existingPlate && existingPlate.plateType !== values.plateType) {
            const wellsWithContents = await db.query.wells.findMany({
                with: {
                    wellContents: true
                },
                where: { plateId: id } as any,
            })
            const nonEmptyWell = wellsWithContents.find((well) => !_.isEmpty((well as any).wellContents))
            if (nonEmptyWell) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Plate wells must be empty before changing plate type'
                })
            }
        }

        const updatedRecord = await updateRecord(plates, id, values)
        return updatedRecord
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
