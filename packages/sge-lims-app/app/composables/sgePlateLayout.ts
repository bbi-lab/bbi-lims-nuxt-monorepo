import _ from 'lodash'
import type { Dna } from '#shared/db/schema/nucleic-acid'
import type { Pellet } from '#shared/db/schema/pellet'
import type { User } from 'lims-layer/server/db/schema/user'

// SGE-specific extension of the shared lims-layer usePlateLayout composable.
// These methods (PreSeq primer assignment + DNA PreSeq 1 pooling) are specific to
// the SGE workflow, so they live in the sge-lims-app layer rather than lims-layer.
export const useSgePlateLayout = <TWellable = Record<string, any>>() => {
    const base = usePlateLayout<TWellable>()
    const config = useRuntimeConfig()
    const toast = useComposableToast()
    const { user } = useUserSession()

    const assignPreseqPrimers = async (primerType: string) => {
        let result: { affectedWellIds: string[] }
        try {
            result = await $fetch(`${config.public.apiBase}/custom/plates/${base.plateId.value}/assign-preseq-primers`, {
                method: 'POST',
                body: { primerType },
            }) as { affectedWellIds: string[] }
        } catch (error: any) {
            toast.add({ severity: 'error', summary: 'Error', detail: error.data?.statusMessage, life: 3000 })
            return
        }

        if (!_.isEmpty(result.affectedWellIds)) {
            const oldValues = _.values(_.pick(base.wellSpecs.value, result.affectedWellIds))
            await base.reloadPlate()
            const updatedWells = _.values(_.pick(base.wellSpecs.value, result.affectedWellIds))
            base.plateDiagramRef.value.updateWells(updatedWells, oldValues)
        }

        return result
    }

    const poolDnaPreSeq1PlateToSelectedWells = async (dnaPreSeq1PlateId: string) => {
        let recordsToAdd: {
            wellId: string;
            wellableId: string;
            sourceWellIds: String[];
            createdBy: string | null;
        }[]
        // sort wells by x and inverse y coordinate to achieve the correct order
        const sortedWellIds = _.map(_.sortBy(base.selectedWells.value, (well) => `${_.padStart(_.toString(well.x), 2, '0')}_${(_.toString(100-well.y))}`), 'id')

        const dnaPreSeq1Plate = await RecordService.getRecord(`${config.public.apiBase}/plates`, dnaPreSeq1PlateId, {
            wells: {
                columns: {id: true},
                with: {
                    wellContents: {
                        columns: {id: true},
                        with: {
                            wellable: {
                                with: {
                                    dna: {
                                        columns: {id: true},
                                        with: {
                                            pellet: {
                                                columns: {id: true, name: true, isBackup: true},
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }
        }) as { wells: any[] }

        type DnaWithPellet = Dna & {pellet: Pellet}
        type DnaWithPelletAndWellIds = DnaWithPellet & {wellIds: String[]}

        const pooledDna = _.sortBy(_.values(dnaPreSeq1Plate.wells.reduce((acc: Record<string, any>, well: any) => {
            const dna = _.get(_.find(well.wellContents, (wellContent: any) => wellContent.wellable?.dna), 'wellable.dna') as DnaWithPellet
            if (dna?.id) {
                const existingWellIds = _.get(acc, [dna.id, 'wellIds'], [])
                _.set(acc, dna.id, {...dna, wellIds: [...existingWellIds, well.id]})
            }
            return acc
        }, {})), (x) => {
            return x.pellet.name
        }) as DnaWithPelletAndWellIds[]

        if (pooledDna.length > sortedWellIds.length) {
            throw new Error('Number of selected wells is less than number of DNA in the plate')
        } else {
            const wellContentsAndSources = _.map(pooledDna, (value, index) => {
                const userId = (user.value as User | null)?.id || null
                return {
                    wellId: sortedWellIds[index]!,
                    wellableId: value.id,
                    sourceWellIds: value.wellIds,
                    createdBy: userId,
                }
            })
            recordsToAdd = wellContentsAndSources
        }

        const newRecords = await base.addWellContents(recordsToAdd)
        return newRecords
    }

    return {
        ...base,
        assignPreseqPrimers,
        poolDnaPreSeq1PlateToSelectedWells,
    }
}
