import _ from 'lodash'
import { genes } from 'lims-layer/shared/db/schema/gene'

interface ExportTargetsRow {
  target: string
  transcript_id: string | null
  chrom: string
  editstart: number | null
  editstop: number | null
  ampstart: number | null
  ampstop: number | null
  required_edits: string
  cigar: string | null
  skip_pos: string | null
}

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const db = useSgeDrizzle()

  const selectedGene = await db.query.genes.findFirst({
    where: { id },
    with: { regions: { with: { targets: true } }, ensemblRefseqId: true },
  })

  // MANE Select Ensembl transcript for the gene, without the version suffix
  const transcriptId = selectedGene?.ensemblRefseqId?.maneSelectEnsemblId?.replace(/\.\d+$/, '') || null

  const rows: ExportTargetsRow[] = []
  if (selectedGene && _.isArray(selectedGene.regions)) {
    for (const region of selectedGene.regions) {
      if (_.isArray(region.targets)) {
        for (const target of region.targets) {
          const reformattedFixedEdits = _.map(target.fixedEdits || [], (x) => {
            const coordinate = `${x.replace(/[^0-9]/g, '')}`
            const editedTo = x.slice(-1)
            return `${coordinate}${editedTo}`
          })
          rows.push({
            target: target.name,
            transcript_id: transcriptId,
            chrom: `chr${selectedGene?.chromosome}`,
            editstart: target.editStart,
            editstop: target.editStop,
            ampstart: target.ampStart,
            ampstop: target.ampStop,
            required_edits: reformattedFixedEdits?.join(','),
            cigar: target.cigar,
            skip_pos: target.skipPositions?.join(',') || null,
          })
        }
      }
    }
  }

  return rows
})
