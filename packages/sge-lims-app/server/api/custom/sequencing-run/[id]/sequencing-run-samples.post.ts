import { eq, type InferInsertModel } from 'drizzle-orm'
import { sequencingRunSamples } from '#shared/db/schema/sge/sequencing-run'
import _ from 'lodash'
import { wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'

type SequencingRunSample = InferInsertModel<typeof sequencingRunSamples>

export default defineEventHandler(async (event) => {
  const { id: sequencingRunId } = event.context.params as { id: string }
  const db = useSgeDrizzle()

  try {
    const body = await readBody(event) as SequencingRunSample[]

    const existingSamples = await db.query.sequencingRunSamples.findMany({
      where: { sequencingRunId },
      with: {
        indexPrimer1: { columns: { indexSequence: true, primerType: true } },
        indexPrimer2: { columns: { indexSequence: true, primerType: true } },
        sourceWell: { columns: { x: true, y: true }, with: { plate: { columns: { name: true } } } },
      },
    }) as Array<SequencingRunSample & {
      indexPrimer1: { indexSequence: string; primerType: string } | null
      indexPrimer2: { indexSequence: string; primerType: string } | null
      sourceWell: { x: number; y: number; plate: { name: string } } | null
    }>

    const sourceWellConflicts = _.filter(existingSamples, (x) =>
      _.some(body, (sample) => sample.sourceWellId == x.sourceWellId)
    )
    if (!_.isEmpty(sourceWellConflicts)) {
      throw new Error(`Samples from these wells already exist in this sequencing run: ${_.map(sourceWellConflicts, (x) =>
        `${x.sourceWell?.plate?.name}: ${x.sourceWell ? wellCoordinateToChar(x.sourceWell.y) : ''}${x.sourceWell?.x || ''}`
      ).join(', ')}`)
    }

    const indexPrimerConflicts = _.filter(existingSamples, (x) =>
      _.some(body, (sample) =>
        (x.indexPrimer1Id == sample.indexPrimer1Id && x.indexPrimer2Id == sample.indexPrimer2Id) ||
        (x.indexPrimer1Id == sample.indexPrimer2Id && x.indexPrimer2Id == sample.indexPrimer1Id)
      )
    )
    if (!_.isEmpty(indexPrimerConflicts)) {
      throw new Error(`Samples with these index primers already exist in this sequencing run: ${_.map(indexPrimerConflicts, (x) =>
        `${x.indexPrimer1?.indexSequence}(${x.indexPrimer1?.primerType})+${x.indexPrimer2?.indexSequence}(${x.indexPrimer2?.primerType})`
      ).join(', ')}`)
    }

    return await db.insert(sequencingRunSamples).values(body).returning({ id: sequencingRunSamples.id })
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.statusMessage || err.message || 'Bad Request',
      data: err.data || null,
    })
  }
})
