import { eq } from 'drizzle-orm'
import { pcrExperiments } from '#shared/db/schema/pcrExperiments'
import { plates } from 'lims-layer/shared/db/schema/plate'
import { wellContents, wells } from 'lims-layer/shared/db/schema/well'

export default defineEventHandler(async (event) => {
    const { id } = event.context.params as { id: string }
    const db = useAppDrizzle()

    try {
        const experiment = await db.query.pcrExperiments.findFirst({
            where: { id },
            with: { plate: { columns: { id: true, name: true } } },
        })

        if (!experiment) {
            throw createError({
                statusCode: 404,
                statusMessage: 'PCR experiment not found'
            })
        }

        // The experiment's plate is created with it and is deleted with it, but only
        // while the plate is still empty. The emptiness check runs inside the transaction
        // so well contents added concurrently can't be dropped along with the plate.
        const deletedRecord = await db.transaction(async (tx) => {
            if (experiment.plate) {
                const nonEmptyWells = await tx.select()
                    .from(wells)
                    .innerJoin(wellContents, eq(wells.id, wellContents.wellId))
                    .where(eq(wells.plateId, experiment.plate.id))

                if (nonEmptyWells.length > 0) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: `Plate ${experiment.plate.name} is not empty. Its wells must be emptied before deleting this experiment.`
                    })
                }
            }

            const [deleted] = await tx.delete(pcrExperiments)
                .where(eq(pcrExperiments.id, id))
                .returning()

            if (experiment.plate) {
                await tx.delete(wells).where(eq(wells.plateId, experiment.plate.id))
                await tx.delete(plates).where(eq(plates.id, experiment.plate.id))
            }

            return deleted
        })

        return deletedRecord
    } catch (e: any) {
        await parseDeleteError(e)

        throw createError({
            statusCode: e.statusCode || 400,
            statusMessage: e.statusMessage || e.message
        })
    }
})
