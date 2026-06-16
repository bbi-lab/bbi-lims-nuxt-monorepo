import { eq, inArray } from 'drizzle-orm'
import { wellContents, wellContentSources, wells } from 'lims-layer/shared/db/schema/well'
import _ from 'lodash'
import { wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'
import { sgRnaPlasmids, sgRnaPlasmidTargets } from '#shared/db/schema/plasmid'
import { plates } from 'lims-layer/shared/db/schema/plate'

interface PlasmidToCreate {
  name: string
  targetIds: string[]
  wellId: string
  wellContentIds: string[]
}

export default defineEventHandler(async (event) => {
  const { id: plateId } = event.context.params as { id: string }
  const db = useSgeDrizzle()

  try {
    await readBody(event)

    const wellsWithOligoContents = await db.query.wells.findMany({
      with: {
        wellContents: {
          with: {
            wellable: {
              with: {
                sgRnaOligo: {
                  with: { sgRnaOligoTargets: { columns: { targetId: true } } },
                },
              },
            },
          },
        },
      },
      where: { plateId },
    })

    const plasmidsToCreate: PlasmidToCreate[] = _.compact(_.map(
      _.filter(wellsWithOligoContents, (x) => !_.isEmpty(x.wellContents)),
      (well) => {
        const oligos = _.compact(_.map(well.wellContents, (wc: any) => wc.wellable?.sgRnaOligo))
        const wellCoordinates = `${wellCoordinateToChar(well.y)}${well.x}`

        if (oligos.length === 0) return null
        if (oligos.length > 2) {
          throw createError({ statusCode: 400, statusMessage: `Expected 1 or 2 oligos in well ${wellCoordinates}, found ${oligos.length}` })
        }

        const oligosCombined = _.uniqBy(_.map(oligos, (x) => ({
          name: x.name.replace(/_[W|C]$/, ''),
          targetIds: _.map(x.sgRnaOligoTargets, 'targetId').sort(),
        })), ['name', 'targetIds'])

        if (oligosCombined.length !== 1) {
          throw createError({ statusCode: 400, statusMessage: `Mismatched names or targets for oligos in well ${wellCoordinates}` })
        }

        return {
          name: oligosCombined[0].name,
          targetIds: oligosCombined[0].targetIds,
          wellId: well.id,
          wellContentIds: _.map(well.wellContents, (wc: any) => wc.id),
        }
      }
    ))

    await db.transaction(async (tx) => {
      for (const plasmid of plasmidsToCreate) {
        if (!plasmid) continue
        try {
          const newPlasmid = await tx.insert(sgRnaPlasmids).values({ name: plasmid.name }).returning({ id: sgRnaPlasmids.id })
          for (const targetId of plasmid.targetIds) {
            await tx.insert(sgRnaPlasmidTargets).values({ sgRnaPlasmidId: newPlasmid[0].id, targetId })
          }
          await tx.delete(wellContentSources).where(inArray(wellContentSources.wellContentId, plasmid.wellContentIds))
          await tx.delete(wellContents).where(eq(wellContents.wellId, plasmid.wellId))
          await tx.insert(wellContents).values({ wellId: plasmid.wellId, wellableId: newPlasmid[0].id })
        } catch (error: any) {
          throw new Error(`Failed to create plasmid ${plasmid.name}: ${error.message}`)
        }
      }
      await tx.update(plates).set({ plateType: 'sg-rna-plasmid' }).where(eq(plates.id, plateId))
    })
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }
})
