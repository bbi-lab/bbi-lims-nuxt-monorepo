export default defineEventHandler(async (event) => {
    const { id } = event.context.params as {id: string}

    try {
        const deletedRecord = await deleteEmptySgePlate(id)
        return deletedRecord
    } catch (e: any) {
        await parseDeleteError(e)

        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
