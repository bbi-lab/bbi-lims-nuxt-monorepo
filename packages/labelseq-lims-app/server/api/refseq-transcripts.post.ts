import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'
import type { ZodObject } from 'zod'
import { XMLParser } from 'fast-xml-parser'
import { refseqTranscripts } from '~~/shared/db/schema/transcripts'

export default defineEventHandler(async (event) => {
    const db = useAppDrizzle()
    try {
        const body = await readBody(event)
        const insertSchema = (schemas as any).refseqTranscripts.insert as ZodObject
        const records = _.map(body, (x) => {
            const record = _.mapValues(x, (value) => _.isString(value) && _.isEmpty(value) ? null : value)
            return insertSchema.parse(record)
        }) as RecordValues[]

        // fetch gene ID, sequence, AA sequence, and description from NCBI REST API
        for (const record of records) {
            const ncbiResponse = await $fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=sequences&id=${record.transcriptId}&rettype=xml&retmode=xml`) as string
            const parser = new XMLParser()
            const jsonDoc = parser.parse(ncbiResponse)

            record.description = _.get(jsonDoc, 'GBSet.GBSeq.GBSeq_definition')

            // find the CDS entry in the feature table, get the location (which is in the format "123..456"), and use that to extract the CDS sequence from the full sequence. Also extract the AA sequence from the qualifiers of the CDS entry
            const cdsEntry = _.find(_.get(jsonDoc, 'GBSet.GBSeq.GBSeq_feature-table.GBFeature', []), (entry) => _.get(entry, 'GBFeature_key') === 'CDS')
            const [cdsFrom, cdsTo] = _.get(cdsEntry, 'GBFeature_location', '').split('..')

            const fullSequence = _.get(jsonDoc, 'GBSet.GBSeq.GBSeq_sequence')
            if (cdsFrom && cdsTo && fullSequence) {
                record.cds = fullSequence.substring(parseInt(cdsFrom) - 1, parseInt(cdsTo)).toUpperCase()
            }
            const cdsEntryQuals = _.get(cdsEntry, 'GBFeature_quals.GBQualifier', [])
            record.aa = _.get(_.find(cdsEntryQuals, (qual) => _.get(qual, 'GBQualifier_name') === 'translation'), 'GBQualifier_value').toUpperCase()

            const ncbiGeneId = _.get(_.find(cdsEntryQuals, (qual) => _.get(qual, 'GBQualifier_name') === 'db_xref' && _.get(qual, 'GBQualifier_value')?.startsWith('GeneID:')), 'GBQualifier_value').split(':')[1]
            const geneRecord = await db.query.genes.findFirst({
                where: {ncbiGeneId} as any
            })
            record.geneId = geneRecord?.id

            if (!record.cds || !record.aa) {
                throw new Error(`Failed to fetch CDS or AA sequence for transcript ${record.transcriptId}`)
            } else if (!record.geneId) {
                throw new Error(`Failed to find gene record for transcript ${record.transcriptId} with NCBI Gene ID ${ncbiGeneId}`)
            }
        }

        const newRecords = await insertRecords(refseqTranscripts, records)
        return newRecords
    } catch (e: unknown) {
        const { error, data } = parsePutPostError(e)

        throw createError({
            statusCode: 400,
            statusMessage: error.message,
            data
        })
    }
})
