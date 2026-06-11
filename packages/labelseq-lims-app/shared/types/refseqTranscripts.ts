
import z from 'zod'
import { schemas } from '../db/zod/zodSchemas'

export type NewRefseqTranscript = z.infer<typeof schemas.refseqTranscripts.insert>
export type UpdateRefseqTranscript = z.infer<typeof schemas.refseqTranscripts.update>
export type UpdateRefseqTranscriptValues = z.infer<typeof schemas.refseqTranscripts.updateValues>
