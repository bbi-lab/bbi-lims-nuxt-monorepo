import _ from "lodash"
import { VALID_WELL_COLORS, type PlateDiagramWell } from "../../shared/lib/plate-diagram"
import { RecordService } from "../utils/record"
import type { Well, WellContent } from "../../server/db/schema/well"
import type { User } from "../../server/db/schema/user"
import { utils as XlsxUtils, writeFileXLSX } from 'xlsx'
import type { Plate } from "../../server/db/schema/plate"
import type { WellWithContents } from "../../shared/types/wells"

type PlateWithWellContents = Plate & {
    wells: WellWithContents[]
}

type WellSpecs = {
    [key: string]: {
        id: string
        x: number
        y: number
        colorByValues: string[]
        selectionTableRecordIds: string[]
        color: string
        tooltip: string
        symbol: string
        data: Well & {
            wellContents: WellContent[]
        }
    }
}

interface wellContentDisplayConfig {
    colorBy?: (_.PropertyPath | Function)[] // array of paths of well content properties to color by
    selectionTableRecordIdPaths?: (_.PropertyPath | Function)[] // array of paths or functions to retrieve ids from well contents that correspond to selection table record IDs
    symbol?: Function | null
    tooltip?: Function | null
}

interface ExportPlateLayoutColumnConfig {
    header: string,
    data: Function | string,
}
interface ExportPlateLayoutConfig {
    filename?: string,
    columns: ExportPlateLayoutColumnConfig[],
    sortBy?: Function | string | string[],
}

export const usePlateLayout = () => {
    const plateWithWellContents = ref<PlateWithWellContents>()
    const wellContentsDisplayConfig = ref<wellContentDisplayConfig>()
    const wellSpecs = ref<WellSpecs>({})
    const selectedWells = ref<WellSpecs[string][]>([])
    const toast = useComposableToast()
    const config = useRuntimeConfig()
    const wellContentsWithClause = ref()
    const plateDiagramRef = ref()
    const selectionTableRef = ref()
    const { user } = useUserSession()
    const plateId = ref()

    let exportPlateLayoutConifg: ExportPlateLayoutConfig

    const setPlateId = (id: string) => {
        plateId.value = id
    }

    const setSelectionTableRef = (el: any) => {
        selectionTableRef.value = el
    }
    const setPlateDiagramRef = (el: any) => {
        plateDiagramRef.value = el
    }

    const setExportPlateLayoutConfig = (config: ExportPlateLayoutConfig) => {
        exportPlateLayoutConifg = config
    }

    const plateWithPlateDiagramWells = computed(() => {
        return {
            ...plateWithWellContents.value,
            wells: _.values(wellSpecs.value),
        }
    })

    const reloadPlate = async() => {
        try {
            await loadPlate(wellContentsWithClause.value)
        } catch (error: any) {
            toast.add({ severity: 'error', summary: 'Error', detail: error.data?.statusMessage, life: 3000 })
        }
    }

    const loadPlate = async (contentsWithClause?: any) => {
        wellContentsWithClause.value = contentsWithClause || {}
        plateWithWellContents.value = await RecordService.getRecord(
            `${config.public.apiBase}/plates`,
            plateId.value,
            {
                wells: {
                    columns: {
                        id: true,
                        x: true,
                        y: true
                    },
                    with: {
                        wellContents: {
                            with: {
                                wellable: {
                                    with: wellContentsWithClause.value,
                                },
                            },
                        },
                    },
                },
            }
        )
        updateWellSpecs()

        // refresh selected wells
        selectedWells.value = _.filter(plateWithPlateDiagramWells.value?.wells, (x) => {
            return _.includes(_.map(selectedWells.value, 'id'), x.id)
        })
    }

    const getWellSpecBySelectionTableRecordId = (selectionTableRecordId: string) => {
        return _.find(_.values(wellSpecs.value), (wellSpec) => {
            return _.includes(wellSpec.selectionTableRecordIds, selectionTableRecordId)
        })
    }

    const nextColorToUse = computed(() => {
        const colorCounts = _.countBy(_.values(_.filter(wellSpecs.value, 'color')), 'color')
        const unusedColors = _.difference(VALID_WELL_COLORS, _.keys(colorCounts))
        unusedColors.forEach((color) => {
            colorCounts[color] = 0
        })
        return _.minBy(_.keys(colorCounts), (color) => colorCounts[color])
    })

    const updateWellSpecs = () => {
        if (!plateWithWellContents.value) return

        // remove any well specs that are not in the current plate
        wellSpecs.value = _.pick(wellSpecs.value, _.map(plateWithWellContents.value.wells, 'id'))

        // add or update well specs for each well in the plate
        plateWithWellContents.value.wells.forEach((well) => {
            // remove empty wells from color map
            if (_.isEmpty(well.wellContents)) {
                _.unset(wellSpecs.value, well.id)
            }
            const contentsToColorBy = _.compact(_.flatten(_.map(well.wellContents, (wellContent) => {
                return _.map(wellContentsDisplayConfig.value?.colorBy, (x) => _.isFunction(x) ? x(wellContent?.wellable) : _.get(wellContent?.wellable, x as _.PropertyPath))
            }))).sort()

            const selectionTableRecordIds = _.compact(_.flatten(_.map(well.wellContents, (wellContent) => {
                return _.flatten(_.map(wellContentsDisplayConfig.value?.selectionTableRecordIdPaths, (x) => {
                    if (_.isFunction(x)) {
                        return x(wellContent?.wellable)
                    } else {
                        return _.get(wellContent?.wellable, x as _.PropertyPath)
                    }
                }))
            }))).sort()

            const existingWellSpec = _.get(wellSpecs.value, well.id)

            // if well contents foreign keys have not changed, leave color unchanged
            let wellColor
            const wellSpecWithSameContentsToColorBy = _.find(_.values(wellSpecs.value), (x) => _.isEqual(x.colorByValues, contentsToColorBy))
            if (existingWellSpec && _.isEqual(contentsToColorBy, existingWellSpec.colorByValues)) {
                wellColor = existingWellSpec.color
            } else if (wellSpecWithSameContentsToColorBy) {
                wellColor = _.get(wellSpecWithSameContentsToColorBy, 'color')
            } else if (!_.isEmpty(contentsToColorBy)) {
                wellColor = nextColorToUse.value
            } else {
                wellColor = null // no color if no contents to color by
            }

            // set data
            _.set(wellSpecs.value, well.id, {
                id: well.id,
                x: well.x,
                y: well.y,
                data: well,
                colorByValues: contentsToColorBy,
                selectionTableRecordIds: selectionTableRecordIds,
                color: wellColor,
                tooltip: wellContentsDisplayConfig.value?.tooltip ? wellContentsDisplayConfig.value.tooltip(well) : '',
                symbol: wellContentsDisplayConfig.value?.symbol ? wellContentsDisplayConfig.value.symbol(well) : '',
            })
        })
    }

    const emptySelectedWells = async () => {
        await reloadPlate()

        const oldValues = _.values(_.pick(wellSpecs.value, _.map(selectedWells.value, 'id')))
        const wellContentsToDelete = _.flatten(_.compact(_.map(selectedWells.value, (x) => {
            return _.get(x, 'data.wellContents')
        })))
        let deletedRecords: WellContent[] | undefined
        try {
            deletedRecords = await RecordService.deleteRecords(
                `${config.public.apiBase}/well-contents`,
                wellContentsToDelete
            )
        } catch (error: any) {
            toast.add({ severity: 'error', summary: 'Error', detail: error.data?.statusMessage, life: 3000 })
            return
        }
        if (!_.isEmpty(deletedRecords)) {
            await reloadPlate()
            const deletedWellIds = _.uniq(_.map(deletedRecords, (deletedRecord) => deletedRecord.wellId))
            const updatedWells = _.values(_.pick(wellSpecs.value, deletedWellIds))
            // Update the plate diagram with the new well specs
            plateDiagramRef.value.updateWells(updatedWells, oldValues)

            toast.add({
                severity: 'info',
                summary: 'Updated well',
                detail: `Emptied ${_.size(updatedWells)} wells`,
                life: 1000,
            })
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error emptying wells',
                life: 1000,
            })
        }
    }

    const updatedWellContents = async function(newValues: PlateDiagramWell[], oldValues: PlateDiagramWell[]) {
        await reloadPlate()

        const selectionTableIdsToRefresh = _.uniq(_.flatten(_.compact([
            ..._.flatten(_.map(newValues || [], 'selectionTableRecordIds')),
            ..._.flatten(_.map(oldValues || [], 'selectionTableRecordIds')),,
        ])))

        selectionTableRef.value.addOrRefreshRecordIds(selectionTableIdsToRefresh)
    }

    interface WellContentsAndSources extends Partial<WellContent> {
        sourceWellIds?: String[];
        createdBy?: string | null;
    }[]

    const addWellContents = async (recordsToAdd: WellContentsAndSources[]) => {
        let newRecords: WellContent[] = []
        let oldValues: WellSpecs[string][]
        try {
            newRecords = await RecordService.addRecords(
                `${config.public.apiBase}/well-contents`,
                recordsToAdd
            ) as WellContent[]
        } catch (error: any) {
            toast.add({ severity: 'error', summary: 'Error', detail: error.data?.statusMessage, life: 3000 })
            return
        }
        if (!_.isEmpty(newRecords)) {
            oldValues = _.values(_.pick(wellSpecs.value, _.map(newRecords, 'wellId')))
            await reloadPlate()
            const updatedWellIds = _.uniq(_.map(newRecords, 'wellId'))
            const updatedWells = _.values(_.pick(wellSpecs.value, updatedWellIds))

            // Update the plate diagram with the new well specs
            plateDiagramRef.value.updateWells(updatedWells, oldValues)
        }
        return newRecords
    }

    const assignIdToSelectedWells = async (id: string) => {
        const oldValues = _.values(_.pick(wellSpecs.value, _.map(selectedWells.value, 'id')))
        const recordsToAdd = _.map(selectedWells.value, (well) => {
            return {
                wellId: well.id,
                wellableId: id,
            }
        })
        const newRecords = await addWellContents(recordsToAdd)
        return newRecords
    }

    // SGE-specific function, TODO: move to SGE layer
    // const poolPreSeq1PlateToSelectedWells = async (preseq1PlateId: string) => {
    //     let recordsToAdd: {
    //         wellId: string;
    //         wellableId: string;
    //         sourceWellIds: String[];
    //         createdBy: string | null;
    //     }[]
    //     // sort wells by x and inverse y coordinate to achieve the correct order
    //     const sortedWellIds = _.map(_.sortBy(selectedWells.value, (well) => `${_.padStart(_.toString(well.x), 2, '0')}_${(_.toString(100-well.y))}`), 'id')

    //     const preseq1Plate = await RecordService.getRecord(`${config.public.apiBase}/plates`, preseq1PlateId, {
    //         wells: {
    //             columns: {id: true},
    //             with: {
    //                 wellContents: {
    //                     columns: {id: true},
    //                     with: {
    //                         wellable: {
    //                             with: {
    //                                 nucleicAcid: {
    //                                     columns: {id: true},
    //                                     with: {
    //                                         pellet: {
    //                                             columns: {id: true, name: true, isBackup: true},
    //                                         },
    //                                     },
    //                                 },
    //                             },
    //                         },
    //                     },
    //                 },
    //             },
    //         }
    //     }) as PlateWithWellContents

    //     type NucleicAcidWithPellet = NucleicAcid & {pellet: Pellet}
    //     type NucleicAcidWithPelletAndWellIds = NucleicAcidWithPellet & {wellIds: String[]}

    //     const pooledNucleicAcids = _.sortBy(_.values(preseq1Plate.wells.reduce((acc, well: WellWithContents) => {
    //         const nucleicAcid = _.get(well, ['wellContents', 0, 'wellable', 'nucleicAcid'])
    //         if (nucleicAcid?.id) {
    //             const existingWellIds = _.get(acc, [nucleicAcid.id, 'wellIds'], [])
    //             _.set(acc, nucleicAcid.id, {...nucleicAcid, wellIds: [...existingWellIds, well.id]})
    //         }
    //         return acc
    //     }, {})), (x) => {
    //         return x.pellet.name
    //     }) as NucleicAcidWithPelletAndWellIds[]

    //     if (pooledNucleicAcids.length > sortedWellIds.length) {
    //         throw new Error('Number of selected wells is less than number of nucleic acids in the plate')
    //     } else {
    //         const wellContentsAndSources = _.map(pooledNucleicAcids, (value, index) => {
    //             const userId = (user.value as User)?.id || null
    //             return {
    //                 wellId: sortedWellIds[index],
    //                 wellableId: value.id,
    //                 sourceWellIds: value.wellIds,
    //                 createdBy: userId,
    //             }
    //         })
    //         recordsToAdd = wellContentsAndSources
    //     }

    //     const newRecords = await addWellContents(recordsToAdd)
    //     return newRecords
    // }

    const wellRangeSelected = function(wells: PlateDiagramWell[]) {
        selectedWells.value = _.filter(plateWithPlateDiagramWells.value?.wells, (x) => {
            return _.includes(_.map(wells, 'id'), x.id)
        })
    }

    const selectedAllWells = function(wells: WellSpecs[string][]) {
        selectedWells.value = wells
    }
    const wellSelectionCleared = function() {
        selectedWells.value = []
    }

    const exportPlateLayout = async () => {
        if (plateWithWellContents.value && exportPlateLayoutConifg) {
            const rows = []

            // column headers row
            rows.push(_.map(exportPlateLayoutConifg.columns, 'header'))

            // data rows
            const wellsSorted = exportPlateLayoutConifg.sortBy ? _.sortBy(plateWithWellContents.value.wells, exportPlateLayoutConifg.sortBy) : _.sortBy(plateWithWellContents.value.wells, ['y', 'x'])
            for (const wellWithContents of wellsSorted) {
                const row = []
                for (const column of exportPlateLayoutConifg.columns) {
                    if (_.isFunction(column.data)) {
                        row.push(column.data(wellWithContents))
                    } else {
                        row.push(_.get(wellWithContents, column.data as _.PropertyPath, ''))
                    }
                }
                rows.push(row)
            }
            const wb = XlsxUtils.book_new()
            const ws = XlsxUtils.aoa_to_sheet(rows)

            XlsxUtils.book_append_sheet(wb, ws, 'Sheet1')
            writeFileXLSX(wb, `${exportPlateLayoutConifg.filename ?? plateWithWellContents.value.name}.xlsx`)
        }
    }

    return {
        // data
        plateWithWellContents,
        plateWithPlateDiagramWells,
        setPlateId,
        loadPlate,
        reloadPlate,

        // well specs
        wellSpecs,
        getWellSpecBySelectionTableRecordId,
        updateWellSpecs,
        wellContentsDisplayConfig,

        // well selection
        selectedWells,
        wellRangeSelected,
        selectedAllWells,
        wellSelectionCleared,
        emptySelectedWells,
        updatedWellContents,

        // plate diagram and selection table refs
        plateDiagramRef,
        selectionTableRef,
        setPlateDiagramRef,
        setSelectionTableRef,

        // assign content to wells
        assignIdToSelectedWells,
        addWellContents,
        // poolPreSeq1PlateToSelectedWells

        // export plate layout
        exportPlateLayout,
        setExportPlateLayoutConfig,
    }
}
