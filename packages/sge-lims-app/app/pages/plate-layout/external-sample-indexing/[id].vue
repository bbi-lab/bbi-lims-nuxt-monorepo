<script setup lang="ts">
import _ from 'lodash'
import type { ExternalSample } from '#shared/db/schema/external-samples'
import type { Dna } from '#shared/db/schema/nucleic-acid'
import type { Pellet } from '#shared/db/schema/pellet'
import type { IndexPrimer } from '#shared/db/schema/primer'
import { getWellTextColor, wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'
import { schemas } from '#shared/db/zod/zodSchemas'

const { breakpoints } = useLayout()
const route = useRoute()
const plateLayout = usePlateLayout<{ externalSample: ExternalSample | null; indexPrimer: IndexPrimer | null }>()
const sourcePlateLayout = usePlateLayout<{ dna: (Dna & { pellet: Pellet | null }) | null; indexPrimer: IndexPrimer | null }>()
const sourcePlateWithWellSpecs = ref()
const toast = useToast()
const { user } = useUserSession()

const smallerThanLg = breakpoints.smaller('lg')
const plateWithWellSpecs = ref()
const selectionTableName = ref<string>('view-plates-with-well-counts')
const selectionTableKey = ref(0)

watch(selectionTableName, async (newValue) => {
    if (plateLayout.wellContentsDisplayConfig.value) {
        if (newValue === 'external-samples') {
            plateLayout.wellContentsDisplayConfig.value.selectionTableRecordIdPaths = ['externalSample.id']
        } else if (newValue === 'view-plates-with-well-counts') {
            plateLayout.wellContentsDisplayConfig.value.selectionTableRecordIdPaths = [(x: any) => {
                return _.uniq(_.map(x.wellContentSources, (wellContentSource) => {
                    return _.get(wellContentSource, 'sourceWell.plate.id')
                }))
            }]
        }
    }
    await loadPlate()
})

const selectedSourcePlate = computed(() => {
    return selectionTableName.value === 'view-plates-with-well-counts' ? plateLayout.selectionTableRef.value?.selectedRecords : null
})

watch (selectedSourcePlate, async (newValue) => {
    if (newValue) {
        sourcePlateLayout.setPlateId(newValue.id)

        if (newValue.plateType === 'dna-preseq-2') {
            sourcePlateLayout.wellContentsDisplayConfig.value = {
                colorBy: ['dna.id'],
                selectionTableRecordIdPaths: [(wellable: any) => {
                    return _.uniq(_.values(_.map(_.get(wellable, 'wellContents.0.wellContentSources', []), (wellContentSource) => _.get(wellContentSource, 'sourceWell.plate.id'))))
                }],
                syncedPlateWellSpecs: plateLayout.wellSpecs,
                tooltip: (well: any) => {
                    const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
                    const dnaName = _.get(well, ['wellContents', 0, 'wellable', 'dna', 'pellet', 'name'])
                    return dnaName ? `${wellCoordinate}:<br>${dnaName} (DNA)` : wellCoordinate
                },
            }
            await sourcePlateLayout.loadPlate({
                dna: {
                    with: {
                        pellet: true
                    }
                },
                wellContents: {
                    with: {
                        wellContentSources: {
                            with: {
                                sourceWell: {
                                    columns: {},
                                    with: {
                                        plate: {
                                            columns: {
                                                id: true,
                                            }
                                        }
                                    }
                                },
                            },
                        },
                    }
                },
            })
        } else if (newValue.plateType === 'seq-index') {
            sourcePlateLayout.wellContentsDisplayConfig.value = {
                colorBy: [() => true],
                selectionTableRecordIdPaths: ['indexPrimer.id'],
                syncedPlateWellSpecs: plateLayout.wellSpecs,
                tooltip: (well: any) => {
                    const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
                    const indexPrimers = _.map(well.wellContents, 'wellable.indexPrimer')
                    return indexPrimers ? `${wellCoordinate}:<br>` + _.map(indexPrimers, (indexPrimer) => `${indexPrimer.indexSequence} (${indexPrimer.primerType} INDEX)`).join('<br>') : wellCoordinate
                },
                symbol: (well: any) => {
                    const primerDirection = _.get(well, ['wellContents', 0, 'wellable', 'indexPrimer', 'sequenceType'])
                    return primerDirection ? _.upperCase(primerDirection[0]) : ''
                },
            }
            await sourcePlateLayout.loadPlate({
                indexPrimer: true,
                wellContents: {
                    with: {
                        wellContentSources: {
                            with: {
                                sourceWell: {
                                    columns: {},
                                    with: {
                                        plate: {
                                            columns: {
                                                id: true,
                                            }
                                        }
                                    }
                                },
                            },
                        },
                    }
                },
            })
        }
        sourcePlateWithWellSpecs.value = {
            ...sourcePlateLayout.plateWithWellContents.value,
            wells: _.values(sourcePlateLayout.wellSpecs.value),
        }
        // sourcePlateDiagramKey.value = newValue.id
    } else {
        sourcePlateWithWellSpecs.value = null
    }
})

onMounted(() => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: [() => true],
        syncedPlateWellSpecs: sourcePlateLayout.wellSpecs,
        selectionTableRecordIdPaths: [(x: any) => {
            return _.uniq(_.map(x.wellContentSources, (wellContentSource) => {
                return _.get(wellContentSource, 'sourceWell.plate.id')
            }))
        }],
        tooltip: (well: any) => {
            const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
            const wellContentsText = _.map(well.wellContents, (wellContent) => {
                const externalSample = wellContent?.wellable?.externalSample
                if (externalSample) {
                    return externalSample.name ? `${externalSample.name} (External)` : '?? (External)'
                } else if (wellContent?.wellable?.indexPrimer) {
                    return `${wellContent.wellable.indexPrimer.indexSequence} (${wellContent.wellable.indexPrimer.primerType} INDEX)`
                } else {
                    return ''
                }
            }).join('<br>')
            return wellContentsText ? `${wellCoordinate}:<br>${wellContentsText}` : wellCoordinate
        },
        symbol: (well: any) => {
            return _.size(well.wellContents) || ''
        },
    }
    loadPlate()
})

const loadPlate = async () => {
    await plateLayout.loadPlate(
        {
            externalSample: true,
            indexPrimer: true,
            wellContents: {
                with: {
                    wellContentSources: {
                        with: {
                            sourceWell: {
                                columns: {},
                                with: {
                                    plate: {
                                        columns: {
                                            id: true,
                                        }
                                    }
                                }
                            },
                        },
                    },
                }
            },
        },
    )

    plateWithWellSpecs.value = {
        ...plateLayout.plateWithWellContents.value,
        wells: _.values(plateLayout.wellSpecs.value),
    }
}

const displayWithClause = computed(() => {
    if (selectionTableName.value === 'external-samples') {
        return {
            wellable: {
                with: {
                    wellContents: {
                        with: {
                            well: {
                                columns: {
                                    id: true,
                                    x: true,
                                    y: true,
                                },
                                with: {
                                    plate: {
                                        columns: {
                                            id: true,
                                            name: true,
                                            plateType: true,
                                        }
                                    }
                                }
                            },
                        },
                    },
                }
            }
        }
    } else {
        return {}
    }
})
const columnDefs = computed((): ColumnDefinitions => {
    if (selectionTableName.value === 'view-plates-with-well-counts') {
        return {
            plateType: { display: false },
            plateTypeLabel: { header: 'Type' },
            cycleName: { header: 'Cycle' },
            cycleId: { display: false },
            pcrExperimentId: { display: false },
            sgRnaCloningExperimentId: { display: false },
            // snvLibCloningExperimentId: { display: false },
            sizeX: { display: false },
            sizeY: { display: false },
            wellsCount: { display: false },
            wellsWithContentCount: { display: false },
            wellsProcessedCount: {
                header: 'Wells processed',
                format: (data: any) => {
                    return _.includes(['dna-preseq-1', 'dna-preseq-2', 'rna-preseq-1', 'rna-preseq-2'], data.plateType) ? data.wellsProcessedCount : ''
                },
                path: 'wellsProcessedCount.displayValue',
            },
            filled: {
                format: (data: any) => {
                    if (data.wellsCount - data.wellsWithContentCount) {
                        return `${data.wellsWithContentCount} / ${data.wellsCount}`
                    } else {
                        return '-'
                    }
                },
                path: 'filled.displayValue',
            },
        }
    } else if (selectionTableName.value === 'external-samples') {
        return {
            colorTile:{
                index: 0,
                header: '',
                sortable: false,
                type: 'element',
                element: (x: any) => {
                    const wellSpec = plateLayout.getWellSpecBySelectionTableRecordId(x.id)
                    return wellSpec ? `<span
                        class="inline-block w-6 h-6 rounded-sm text-center"
                        style="color: ${getWellTextColor(wellSpec.color)}; background-color:${wellSpec.color}">
                        ${wellSpec.symbol}
                    </span>` : ''
                },
                searchable: false,
                exportable: false,
            },
            wellContents: {
                header: 'Well',
                format: (x: any) => {
                    const wellCoordinates = _.map(_.filter(x.wellContents, (val) => _.get(val, 'well.plate.id') == route.params.id), (wellContent) => {
                        return {x: wellContent.well.x, y: wellContent.well.y,}
                    })
                    const contentsGroupedByX = _.groupBy(wellCoordinates, 'x')
                    const yRanges = _.mapValues(contentsGroupedByX, (coordinates) => {
                        const sortedByY = _.sortBy(coordinates, 'y')
                        const consecutiveYRanges = _.reduce(sortedByY, (acc, coordinate) => {
                            if (acc.length === 0 || acc[acc.length - 1]!.maxY + 1 < coordinate.y) {
                                acc.push({ x: coordinate.x, minY: coordinate.y, maxY: coordinate.y })
                            } else {
                                acc[acc.length - 1]!.maxY = Math.max(acc[acc.length - 1]!.maxY, coordinate.y)
                            }
                            return acc
                        }, [] as Array<{ x: number; minY: number; maxY: number }>)
                        return consecutiveYRanges
                    })
                    return _.map(_.flatten(_.values(yRanges)), (val) => {
                        return val.minY == val.maxY ? `${wellCoordinateToChar(val.minY)}${val.x}` : `${wellCoordinateToChar(val.minY)}${val.x}-${wellCoordinateToChar(val.maxY)}${val.x}`
                    }).join(', ')
                },
                path: 'wellContents.displayValue',
                type: 'string',
                index: 2,
            },
            sequencingRuns: {display: false},
            createdBy: {display: false},
        }
    } else {
        return {}
    }
})

const rowActions = {
    assign: {
        label: '',
        action: async (data: any) => {
            if (plateLayout.selectedWells.value.length === 0) {
                toast.add({ severity: 'warn', summary: 'No wells selected', detail: 'Please select well(s) to fill.', life: 3000 })
                return
            } else if (_.some(plateLayout.selectedWells.value, (x) => !_.isEmpty(x.data.wellContents))) {
                toast.add({ severity: 'warn', summary: 'Well already has contents', detail: 'Please select empty wells only.', life: 3000 })
                return
            } else {
                if (selectionTableName.value === 'external-samples') {
                    await plateLayout.assignIdToSelectedWells(data.id)
                }
            }
        },
        icon: 'pi pi-fw pi-arrow-right',
        iconPos: 'right',
        tooltip: 'Assign to selected wells',
        disabled: (data: any) => {
            return _.has(data, 'wellContents.well.id')
        },
    },
}


const transferSelectedWellsContents = async () => {
    const sourceWells = sourcePlateLayout!.selectedWells.value
    const destinationWells = plateLayout.selectedWells.value

    if (_.isEmpty(sourceWells)) {
        toast.add({severity: 'warn', summary: 'No wells selected for transfer', life: 3000})
    } else if (sourceWells.length !== destinationWells.length) {
        toast.add({severity: 'warn', summary: 'Number of selected wells in source plate does not match number of selected wells in destination plate', life: 3000})
    } else {
        const sourceWellsSorted = _.sortBy(sourceWells, ['x', 'y'])
        const destinationWellsSorted = _.sortBy(destinationWells, ['x', 'y'])

        const wellContentsToAdd = _.flatten(_.map(sourceWellsSorted, (well, index) => {
            const wellContents = well.data.wellContents
            const destinationWell = destinationWellsSorted[index]!
            return _.map(wellContents, (wellContent) => {
                return {
                    wellableId: wellContent.wellableId,
                    wellId: destinationWell.id,
                    sourceWellIds: [well.id],
                    createdBy: (user.value as any)?.id,
                }
            })
        }))
        await plateLayout.addWellContents(wellContentsToAdd.flat())
    }
}

const selectionTableOptions = [
    { label: 'Seq Index Plates', value: 'view-plates-with-well-counts' },
    { label: 'External Samples', value: 'external-samples' },
]
watch(selectionTableName, (newValue, oldValue) => {
    if (newValue != oldValue) {
        selectionTableKey.value += 1
        plateLayout.selectionTableRef.value.selection = []
    }
})
const whereClause = computed(() => {
    return (selectionTableName.value === 'view-plates-with-well-counts') ? {"==": [{"var": "plateType"}, "seq-index"]} : {}
})
const frozenRecordIds = computed(() => {
    return _.compact(_.flatten(_.map(plateLayout.selectedWells.value, 'selectionTableRecordIds')))
})
</script>
<template>
    <Splitter class="h-full mb-8" :layout="smallerThanLg ? 'vertical' : 'horizontal'">
        <SplitterPanel class="overflow-scroll" :size="60">
            <SmartTable
                :key="selectionTableKey"
                :ref="plateLayout.setSelectionTableRef"
                :tableName="selectionTableName"
                :zodSchema="selectionTableName === 'external-samples' ? schemas.externalSamples.select : undefined"
                :canAdd="false"
                :canDelete="false"
                :canEdit="false"
                :canExport="false"
                :where="whereClause"
                :columnDefs="columnDefs"
                :withClause="displayWithClause"
                :rowActions="selectionTableName === 'external-samples' ? rowActions : {}"
                :showColumnFilters="true"
                :selectionMode="selectionTableName === 'view-plates-with-well-counts' ? 'single' : 'multiple'"
                emptyMessage=""
                :rowsPerPageOptions="[10, 25, 50, 100]"
                :sortBy="selectionTableName === 'external-samples' ? ['wellContents.displayValue'] : undefined"
                v-model:frozenRecordIds="frozenRecordIds"
            >
                <template #header-buttons>
                    <SelectButton v-model="selectionTableName" :options="selectionTableOptions" optionLabel="label" optionValue="value" dataKey="label" />
                </template>
            </SmartTable>
        </SplitterPanel>
        <SplitterPanel class="flex justify-center overflow-scroll mt-10" :size="40" :minSize="25">
            <Splitter layout="vertical">
                <SplitterPanel v-if="selectionTableName === 'view-plates-with-well-counts'" class="flex justify-center overflow-scroll mt-10">
                    <PlateDiagram
                        :ref="sourcePlateLayout?.setPlateDiagramRef"
                        v-if="selectedSourcePlate?.id && sourcePlateWithWellSpecs"
                        v-model="sourcePlateWithWellSpecs"
                        :plateType="sourcePlateWithWellSpecs.plateType"
                        :sizeX="sourcePlateWithWellSpecs.sizeX"
                        :sizeY="sourcePlateWithWellSpecs.sizeY"
                        @well-range-selected="sourcePlateLayout?.wellRangeSelected"
                        @well-selection-cleared="sourcePlateLayout?.wellSelectionCleared"
                        @all-wells-selected="sourcePlateLayout?.selectedAllWells"
                        @well-contents-updated="sourcePlateLayout?.updatedWellContents" >
                        <template #header>
                            {{ sourcePlateWithWellSpecs.name }}
                        </template>
                        <template #button1>
                            <Button
                                severity="secondary"
                                v-tooltip="{value: 'Transfer well contents to External sample indexing plate', showDelay: 500}"
                                :disabled="_.isEmpty(sourcePlateLayout?.selectedWells.value)"
                                @click="transferSelectedWellsContents">
                                <template #icon>
                                    <Icon name="ix:move-layer-down" />
                                </template>
                            </Button>
                        </template>
                    </PlateDiagram>
                    <div v-else>
                        <span class="text-gray-500">No source plate selected</span>
                    </div>
                </SplitterPanel>
                <SplitterPanel class="flex justify-center overflow-scroll mt-10">
                    <PlateDiagram
                        :ref="plateLayout.setPlateDiagramRef"
                        v-if="plateWithWellSpecs"
                        v-model="plateWithWellSpecs"
                        :plateType="plateWithWellSpecs.plateType"
                        :sizeX="plateWithWellSpecs.sizeX"
                        :sizeY="plateWithWellSpecs.sizeY"
                        @well-range-selected="plateLayout.wellRangeSelected"
                        @well-selection-cleared="plateLayout.wellSelectionCleared"
                        @all-wells-selected="plateLayout.selectedAllWells"
                        @well-contents-updated="plateLayout.updatedWellContents" >
                        <template #header>
                            {{ plateWithWellSpecs.name }}
                        </template>
                        <template #button1>
                            <Button
                                class="p-button-secondary"
                                icon="pi pi-trash"
                                v-tooltip="{value: 'Empty selected wells', showDelay: 500}"
                                :disabled="_.isEmpty(plateLayout.selectedWells.value)"
                                @click="plateLayout.emptySelectedWells" />
                        </template>
                    </PlateDiagram>
                </SplitterPanel>
            </Splitter>

        </SplitterPanel>
    </Splitter>
</template>
