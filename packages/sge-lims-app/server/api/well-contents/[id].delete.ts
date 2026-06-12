import { eq } from 'drizzle-orm'
import { wellContents, wellContentSources } from '#shared/db/schema/sge/well'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const db = useSgeDrizzle()

  try {
    return await db.transaction(async (tx) => {
      await tx.delete(wellContentSources).where(eq(wellContentSources.wellContentId, id))
      const [deleted] = await tx.delete(wellContents).where(eq(wellContents.id, id)).returning()
      return deleted
    })
  } catch (e: any) {
    await parseDeleteError(e)
    throw createError({ statusCode: 400, statusMessage: e.message })
  }
})
