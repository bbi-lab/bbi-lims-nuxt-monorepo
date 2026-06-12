import { inArray } from 'drizzle-orm'
import _ from 'lodash'
import { wellContents } from '#shared/db/schema/sge/well'

type PrimerType = 'dna-preseq-1' | 'dna-preseq-2' | 'rna-preseq-1' | 'rna-preseq-2'

export default defineEventHandler(async (event) => {
  const { id: plateId } = event.context.params as { id: string }
  const body = await readBody(event) as { primerType: PrimerType }
  const { primerType } = body

  if (!primerType) {
    throw createError({ statusCode: 400, statusMessage: 'primerType is required' })
  }

  try {
    const db = useSgeDrizzle()

    const isRna = primerType.startsWith('rna-')
    const sampleKey = isRna ? 'rna' : 'dna'
    const primerKey = {
      'dna-preseq-1': 'preseq1Primer',
      'dna-preseq-2': 'preseq2Primer',
      'rna-preseq-1': 'rnaPreseq1Primer',
      'rna-preseq-2': 'rnaPreseq2Primer',
    }[primerType] as string

    const wellsData = await db.query.wells.findMany({
      where: { plateId },
      columns: { id: true },
      with: {
        wellContents: {
          columns: { id: true },
          with: {
            wellable: {
              columns: {},
              with: {
                ...(isRna ? {
                  rna: { columns: {}, with: { pellet: { columns: {}, with: { transfectTarget: { columns: { targetId: true } } } } } },
                } : {
                  dna: { columns: {}, with: { pellet: { columns: {}, with: { transfectTarget: { columns: { targetId: true } } } } } },
                }),
                ...(primerType === 'dna-preseq-1' ? { preseq1Primer: { columns: { id: true, sequenceType: true } } } : {}),
                ...(primerType === 'dna-preseq-2' ? { preseq2Primer: { columns: { id: true, sequenceType: true } } } : {}),
                ...(primerType === 'rna-preseq-1' ? { rnaPreseq1Primer: { columns: { id: true, sequenceType: true } } } : {}),
                ...(primerType === 'rna-preseq-2' ? { rnaPreseq2Primer: { columns: { id: true, sequenceType: true } } } : {}),
              },
            },
          },
        },
      },
    })

    const wellInfo = _.map(wellsData, (well) => {
      const sampleContent = _.find(well.wellContents, (wc) => !!_.get(wc, `wellable.${sampleKey}`))
      const targetId = _.get(sampleContent, `wellable.${sampleKey}.pellet.transfectTarget.targetId`) as string | undefined

      const existingPrimerContents = _.compact(_.map(well.wellContents, (wc) => {
        const primer = _.get(wc, `wellable.${primerKey}`) as { id: string; sequenceType: string } | undefined
        if (!primer) return null
        return { wellContentId: (wc as any).id as string, primerId: primer.id, sequenceType: primer.sequenceType }
      }))

      return { wellId: well.id, targetId, existingPrimerContents }
    })

    const targetIds = _.compact(_.uniq(_.map(wellInfo, 'targetId')))
    const primersByTargetId: Record<string, { forward?: string; reverse?: string }> = {}

    if (!_.isEmpty(targetIds)) {
      if (primerType === 'dna-preseq-1') {
        const rows = await db.query.preseq1PrimerTargets.findMany({
          where: (t, { inArray }) => inArray(t.targetId, targetIds),
          columns: { targetId: true },
          with: { preseq1Primer: { columns: { id: true, sequenceType: true, archived: true } } },
        })
        rows.forEach((row) => {
          if (!primersByTargetId[row.targetId]) primersByTargetId[row.targetId] = {}
          const primer = row.preseq1Primer as { id: string; sequenceType: string; archived: boolean | null } | null
          if (!primer || primer.archived === true) return
          if (primer.sequenceType === 'forward') primersByTargetId[row.targetId].forward = primer.id
          else if (primer.sequenceType === 'reverse') primersByTargetId[row.targetId].reverse = primer.id
        })
      } else if (primerType === 'dna-preseq-2') {
        const rows = await db.query.preseq2Primers.findMany({
          where: (t, { inArray }) => inArray(t.targetId, targetIds),
          columns: { id: true, targetId: true, sequenceType: true, archived: true },
        })
        rows.forEach((row) => {
          if (!row.targetId || row.archived === true) return
          if (!primersByTargetId[row.targetId]) primersByTargetId[row.targetId] = {}
          if (row.sequenceType === 'forward') primersByTargetId[row.targetId].forward = row.id
          else if (row.sequenceType === 'reverse') primersByTargetId[row.targetId].reverse = row.id
        })
      } else if (primerType === 'rna-preseq-1') {
        const rows = await db.query.rnaPreseq1PrimerTargets.findMany({
          where: (t, { inArray }) => inArray(t.targetId, targetIds),
          columns: { targetId: true },
          with: { rnaPreseq1Primer: { columns: { id: true, sequenceType: true, archived: true } } },
        })
        rows.forEach((row) => {
          if (!primersByTargetId[row.targetId]) primersByTargetId[row.targetId] = {}
          const primer = row.rnaPreseq1Primer as { id: string; sequenceType: string; archived: boolean | null } | null
          if (!primer || primer.archived === true) return
          if (primer.sequenceType === 'forward') primersByTargetId[row.targetId].forward = primer.id
          else if (primer.sequenceType === 'reverse') primersByTargetId[row.targetId].reverse = primer.id
        })
      } else if (primerType === 'rna-preseq-2') {
        const rows = await db.query.rnaPreseq2PrimerTargets.findMany({
          where: (t, { inArray }) => inArray(t.targetId, targetIds),
          columns: { targetId: true },
          with: { rnaPreseq2Primer: { columns: { id: true, sequenceType: true, archived: true } } },
        })
        rows.forEach((row) => {
          if (!primersByTargetId[row.targetId]) primersByTargetId[row.targetId] = {}
          const primer = row.rnaPreseq2Primer as { id: string; sequenceType: string; archived: boolean | null } | null
          if (!primer || primer.archived === true) return
          if (primer.sequenceType === 'forward') primersByTargetId[row.targetId].forward = primer.id
          else if (primer.sequenceType === 'reverse') primersByTargetId[row.targetId].reverse = primer.id
        })
      }
    }

    const wellContentIdsToRemove: string[] = []
    const wellContentsToInsert: { wellId: string; wellableId: string }[] = []
    const affectedWellIds = new Set<string>()

    for (const { wellId, targetId, existingPrimerContents } of wellInfo) {
      if (!targetId) continue
      const expectedPrimers = primersByTargetId[targetId]
      const expectedPrimerIds = new Set(_.compact([expectedPrimers?.forward, expectedPrimers?.reverse]))

      for (const existing of existingPrimerContents) {
        if (!expectedPrimerIds.has(existing.primerId)) {
          wellContentIdsToRemove.push(existing.wellContentId)
          affectedWellIds.add(wellId)
        }
      }

      const hasForward = existingPrimerContents.some(p => p.primerId === expectedPrimers?.forward)
      const hasReverse = existingPrimerContents.some(p => p.primerId === expectedPrimers?.reverse)

      if (!hasForward && expectedPrimers?.forward) {
        wellContentsToInsert.push({ wellId, wellableId: expectedPrimers.forward })
        affectedWellIds.add(wellId)
      }
      if (!hasReverse && expectedPrimers?.reverse) {
        wellContentsToInsert.push({ wellId, wellableId: expectedPrimers.reverse })
        affectedWellIds.add(wellId)
      }
    }

    if (_.isEmpty(wellContentIdsToRemove) && _.isEmpty(wellContentsToInsert)) {
      return { affectedWellIds: [] }
    }

    await db.transaction(async (tx) => {
      if (!_.isEmpty(wellContentIdsToRemove)) {
        await tx.delete(wellContents).where(inArray(wellContents.id, wellContentIdsToRemove))
      }
      if (!_.isEmpty(wellContentsToInsert)) {
        await tx.insert(wellContents).values(wellContentsToInsert)
      }
    })

    return { affectedWellIds: Array.from(affectedWellIds) }
  } catch (e: any) {
    const { error, data } = parsePutPostError(e)
    throw createError({ statusCode: 400, statusMessage: error.message, data })
  }
})
