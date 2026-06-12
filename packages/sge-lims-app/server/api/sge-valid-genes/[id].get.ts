import { genes } from '#shared/db/schema/sge/gene'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const db = useSgeDrizzle()

  try {
    return await db.query.genes.findFirst({ where: { id } })
  } catch (e: any) {
    throw createError({ statusCode: 404, statusMessage: e.message })
  }
})
