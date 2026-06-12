import _ from 'lodash'
import { v4 as uuid } from 'uuid'
import { inArray } from 'drizzle-orm'
import { externalSamples } from '#shared/db/schema/sge/external-samples'
import { indexPrimers } from '#shared/db/schema/sge/primer'
import { schemas } from '#shared/db/zod/zodSchemas'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!Array.isArray(body) || body.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Request body must be a non-empty array of records',
      })
    }

    const db = useSgeDrizzle()

    const indexPrimerNames = _.uniq([
      ..._.map(body, (row) => _.trim(row.indexPrimer1Name || '')).filter(Boolean),
      ..._.map(body, (row) => _.trim(row.indexPrimer2Name || '')).filter(Boolean),
    ])

    let indexPrimersByName: Record<string, { id: string }> = {}
    if (indexPrimerNames.length > 0) {
      const primerRecords = await db
        .select({ id: indexPrimers.id, name: indexPrimers.name })
        .from(indexPrimers)
        .where(inArray(indexPrimers.name, indexPrimerNames))
      indexPrimersByName = _.keyBy(primerRecords, 'name') as Record<string, { id: string }>

      const missingPrimers = _.difference(indexPrimerNames, _.keys(indexPrimersByName))
      if (missingPrimers.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: `Index primer names not found in database: ${missingPrimers.join(', ')}`,
        })
      }
    }

    const sampleRecords = _.map(body, (row) => {
      const indexPrimer1Name = _.trim(row.indexPrimer1Name || '')
      const indexPrimer2Name = _.trim(row.indexPrimer2Name || '')
      return {
        id: uuid(),
        name: _.trim(row.name || ''),
        description: _.trim(row.description || '') || null,
        customIndexSeq1: _.trim(row.customIndexSeq1 || '') || null,
        customIndexSeq2: _.trim(row.customIndexSeq2 || '') || null,
        indexPrimer1Id: indexPrimer1Name ? indexPrimersByName[indexPrimer1Name]?.id ?? null : null,
        indexPrimer2Id: indexPrimer2Name ? indexPrimersByName[indexPrimer2Name]?.id ?? null : null,
      }
    })

    const duplicateNames = _.keys(_.pickBy(_.countBy(sampleRecords, 'name'), (count) => count > 1))
    if (duplicateNames.length > 0) {
      throw createError({ statusCode: 400, statusMessage: `Duplicate sample names found: ${duplicateNames.join(', ')}` })
    }

    const missingNames = _.filter(sampleRecords, (s) => !s.name).length
    if (missingNames > 0) {
      throw createError({ statusCode: 400, statusMessage: `${missingNames} record(s) are missing sample names` })
    }

    try {
      _.forEach(sampleRecords, (record) => (schemas as any).externalSamples.insert.parse(record))
    } catch (zodError: any) {
      throw createError({
        statusCode: 400,
        statusMessage: zodError.message || 'Validation error',
        data: zodError.errors || [{ message: zodError.message }],
      })
    }

    const result = await db.insert(externalSamples).values(sampleRecords).returning()

    return { success: true, insertedCount: result.length, samples: result }
  } catch (e: any) {
    const { error, data } = parsePutPostError(e)
    throw createError({ statusCode: 400, statusMessage: error.message, data })
  }
})
