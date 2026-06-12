import { deleteEmptyPlate } from '../../utils/sge'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }

  try {
    return await deleteEmptyPlate(id)
  } catch (e: any) {
    await parseDeleteError(e)
    throw createError({ statusCode: 400, statusMessage: e.message })
  }
})
