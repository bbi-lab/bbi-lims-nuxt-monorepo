import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'
import type { ZodObject } from 'zod'
import { XMLParser } from 'fast-xml-parser'
import { refseqTranscripts } from '~~/shared/db/schema/transcripts'
import assert from 'node:assert'

const _fetch = $fetch as any

export default defineEventHandler(async (event) => {
    const db = useAppDrizzle()
    try {
        const body = await readBody(event)
        const insertSchema = (schemas as any).refseqTranscripts.insert as ZodObject
        const records = _.map(body, (x) => {
            const record = _.mapValues(x, (value) => _.isString(value) && _.isEmpty(value) ? null : value)
            return insertSchema.parse(record)
        }) as RecordValues[]

        // fetch NCBI data for all transcript IDs in one request to avoid rate limit.
        const transcriptIds = _.map(records, 'transcriptId').join(',')
        const ncbiResponse = await _fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=sequences&id=${transcriptIds}&rettype=xml&retmode=xml`) as string
        const parser = new XMLParser()
        const jsonDoc = parser.parse(ncbiResponse)
        assert(jsonDoc, 'Failed to parse NCBI response as XML')

        // fetch gene ID, sequence, AA sequence, and description from NCBI REST API
        for (const record of records) {
            const recordJsonDoc = _.find(_.get(jsonDoc, 'GBSet', []), (doc) => _.get(doc, 'GBSeq_accession-version') == record.transcriptId)
            assert(recordJsonDoc, `No NCBI record found for transcript ${record.transcriptId}`)

            try {
                record.description = _.get(recordJsonDoc, 'GBSeq_definition')

                // find the CDS entry in the feature table, get the location (which is in the format "123..456"), and use that to extract the CDS sequence from the full sequence. Also extract the AA sequence from the qualifiers of the CDS entry
                const cdsEntry = _.find(_.get(recordJsonDoc, 'GBSeq_feature-table.GBFeature', []), (entry) => _.get(entry, 'GBFeature_key') === 'CDS')
                const [cdsFrom, cdsTo] = _.get(cdsEntry, 'GBFeature_location', '').split('..')

                const fullSequence = _.get(recordJsonDoc, 'GBSeq_sequence')
                if (cdsFrom && cdsTo && fullSequence) {
                    record.cds = fullSequence.substring(parseInt(cdsFrom) - 1, parseInt(cdsTo)).toUpperCase()
                }
                const cdsEntryQuals = _.get(cdsEntry, 'GBFeature_quals.GBQualifier', [])
                record.aa = _.get(_.find(cdsEntryQuals, (qual) => _.get(qual, 'GBQualifier_name') === 'translation'), 'GBQualifier_value').toUpperCase()
                const ncbiGeneId = _.get(_.find(cdsEntryQuals, (qual) => _.get(qual, 'GBQualifier_name') === 'db_xref' && _.get(qual, 'GBQualifier_value')?.startsWith('GeneID:')), 'GBQualifier_value').split(':')[1]
                record.ncbiGeneId = ncbiGeneId
            } catch (e) {
                throw new Error(`Failed to parse NCBI response for transcript ${record.transcriptId}`)
            }

            try {
                const geneRecord = await db.query.genes.findFirst({
                    where: {ncbiGeneId: record.ncbiGeneId} as any
                })
                assert(geneRecord, `No gene record found for NCBI Gene ID ${record.ncbiGeneId} (transcript ${record.transcriptId})`)
                _.set(record, 'geneId', geneRecord.id)
                _.unset(record, 'ncbiGeneId')
            } catch (e) {
                throw new Error(`Database error while fetching gene record for transcript ${record.transcriptId} (NCBI Gene ID: ${record.ncbiGeneId})`)
            }

            assert(record.cds, `CDS sequence not found for transcript ${record.transcriptId}`)
            assert(record.aa, `AA sequence not found for transcript ${record.transcriptId}`)
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
