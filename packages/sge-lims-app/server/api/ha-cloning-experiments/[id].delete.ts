import { eq } from 'drizzle-orm'
import { haCloningExperiments, haCloningExperimentTargets } from '#shared/db/schema/sge/plasmid-experiment'
import { haPcrProducts } from '#shared/db/schema/sge/oligos'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const db = useSgeDrizzle()

  try {
    return await db.transaction(async (tx) => {
      await tx.delete(haCloningExperimentTargets).where(eq(haCloningExperimentTargets.haCloningExperimentId, id))
      await tx.delete(haPcrProducts).where(eq(haPcrProducts.haCloningExperimentId, id))
      const deleted = await tx.delete(haCloningExperiments).where(eq(haCloningExperiments.id, id)).returning()

      if (deleted.length !== 1) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to delete HA cloning experiment.' })
      }
      return deleted[0]
    })
  } catch (e: any) {
    await parseDeleteError(e)
    throw createError({ statusCode: 400, statusMessage: e.message })
  }
})
