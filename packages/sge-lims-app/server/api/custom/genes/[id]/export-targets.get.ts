import _ from 'lodash'
import { genes } from '#shared/db/schema/sge/gene'

interface ExportTargetsRow {
  target: string
  chom: string
  editstart: string
  editstop: string
  ampstart: string
  ampstop: string
  required_edits: string
  cigar: string
  skip_pos: string
}

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string }
  const db = useSgeDrizzle()

  const selectedGene = await db.query.genes.findFirst({
    where: { id },
    with: { regions: { with: { targets: true } } },
  })

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
            chom: `chr${selectedGene?.chromosome}`,
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
