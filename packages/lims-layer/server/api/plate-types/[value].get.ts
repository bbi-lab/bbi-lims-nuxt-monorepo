
export default defineEventHandler(async (event) => {
    const { value } = event.context.params as { value: string }
    const db = useDrizzle()

    const record = await db.query.plateTypes.findFirst({
        where: { value },
    })

    if (!record) {
        throw createError({ statusCode: 404, statusMessage: 'Plate type not found' })
    }

    return record
})
