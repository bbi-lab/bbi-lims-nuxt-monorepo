import { eq } from 'drizzle-orm/sql'
import _ from 'lodash'
import { refseqTranscripts } from '~~/shared/db/schema/transcripts'

export default defineEventHandler(async (event) => {
    const { id } = event.context.params as { id: string }
    const db = useAppDrizzle()

    try {
        const deletedRecord = await db.delete(refseqTranscripts)
            .where(eq((refseqTranscripts as any).id, id))
            .returning() as any[]

        return deletedRecord[0]
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message,
        })
    }
})
