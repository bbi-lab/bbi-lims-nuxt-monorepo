import _ from 'lodash'
import { refseqTranscripts } from '~~/shared/db/schema/transcripts'
import { schemas } from '../../../shared/db/zod/zodSchemas'

export default defineEventHandler<{ body: UpdateRefseqTranscriptValues }>(async (event) => {
    const { id } = event.context.params as {id: string}
    try {
        const body = await readBody(event)

        // update should only allow fields that are included in the updateValues schema (geneType, notes), other fields are auto-populated on insert
        const values = schemas.refseqTranscripts.updateValues.parse(body)
        const updatedRefseqTranscript = await updateRecord(refseqTranscripts, id, values)
        return updatedRefseqTranscript
    } catch (e: any) {
        throw createError({
            statusCode: 400,
            statusMessage: e.message
        })
    }
})
