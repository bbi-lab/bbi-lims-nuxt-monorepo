export default defineEventHandler(async (event) => {
    const { value } = event.context.params as { value: string }
    const db = useSgeDrizzle()

    const record = await db.query.pcrTypes.findFirst({
        where: { value },
    })

    if (!record) {
        throw createError({ statusCode: 404, statusMessage: 'PCR type not found' })
    }

    return record
})
