import { deleteRecord } from '../../utils/record'
import { eq } from 'drizzle-orm'
import { plates } from '../../db/schema/plate'
import { wellContents, wells } from '../../db/schema/well'

export default defineEventHandler(async (event) => {
    const { id } = event.context.params as {id: string}

    try {

        const nonEmptyWells = await db.select()
            .from(wells)
            .innerJoin(wellContents, eq(wells.id, wellContents.wellId))
            .where(eq(wells.plateId, id))

        // throw error if wells are not empty
        if (nonEmptyWells.length > 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Plate wells must be empty before deleting'
            })
        }
        // delete wells then plate
        await db.delete(wells).where(eq(wells.plateId, id))
        const deletedRecord = await deleteRecord(plates, id)
        return deletedRecord
    } catch (e: any) {
        await parseDeleteError(e)

        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
