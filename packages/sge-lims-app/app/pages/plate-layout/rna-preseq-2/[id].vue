<script setup lang="ts">
import _ from 'lodash'
import type { Rna } from '#shared/db/schema/nucleic-acid'
import type { Pellet } from '#shared/db/schema/pellet'
import type { RnaPreseq2Primer } from '#shared/db/schema/primer'
import { getWellTextColor, wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'
import type { User } from 'lims-layer/server/db/schema/user'
import {v4 as uuidv4} from 'uuid'

const { breakpoints } = useLayout()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const plateLayout = useSgePlateLayout<{ rna: (Rna & { pellet: Pellet | null }) | null; rnaPreseq2Primer: RnaPreseq2Primer | null }>()
const toast = useToast()
const { user } = useUserSession()

const smallerThanLg = breakpoints.smaller('lg')
const plateWithWellSpecs = ref()
const pcrExperiment = ref()
const selectionTableName = ref<'rna' | 'rna-rt-storage' | 'rna-preseq-1-plate'>('rna-rt-storage')
const selectionTableKey = ref(0)

const sourcePlateLayout = usePlateLayout<{ rna: (Rna & { pellet: Pellet | null }) | null }>()
const sourcePlateWithWellSpecs = ref()
const sourcePlateDiagramKey = ref<string>()
const plateDiagramKey = ref<string>()

const selectedSourcePlate = computed(() => {
    return (selectionTableName.value.endsWith('-plate') || selectionTableName.value.endsWith('-storage')) ? plateLayout.selectionTableRef.value?.selectedRecords : null
})


watch (selectedSourcePlate, async (newValue) => {
    if (newValue) {
        sourcePlateLayout.setPlateId(newValue.id)


        sourcePlateLayout.wellContentsDisplayConfig.value = {
            colorBy: ['rna.id'],
            selectionTableRecordIdPaths: [(wellable: any) => {
                return _.uniq(_.values(_.map(_.get(wellable, 'wellContents.0.wellContentSources', []), (wellContentSource) => _.get(wellContentSource, 'sourceWell.plate.id'))))
            }],
            syncedPlateWellSpecs: plateLayout.wellSpecs,
            tooltip: (well: any) => {
                const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
                const rnaName = _.get(well, ['wellContents', 0, 'wellable', 'rna', 'pellet', 'name'])
                return rnaName ? `${wellCoordinate}:<br>${rnaName} (RNA)` : wellCoordinate
            },
        }
        await sourcePlateLayout.loadPlate({
            rna: {
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
            }
        })
        sourcePlateWithWellSpecs.value = {
            ...sourcePlateLayout.plateWithWellContents.value,
            wells: _.values(sourcePlateLayout.wellSpecs.value),
        }
        sourcePlateDiagramKey.value = newValue.id
    } else {
        sourcePlateWithWellSpecs.value = null
    }
})


watch(selectionTableName, async (newValue) => {
    if (plateLayout.wellContentsDisplayConfig.value) {
        if (newValue === 'rna') {
            plateLayout.wellContentsDisplayConfig.value.selectionTableRecordIdPaths = ['rna.id']
        } else if (newValue.endsWith('-plate')) {
            plateLayout.wellContentsDisplayConfig.value.selectionTableRecordIdPaths = [(wellable: any) => {
                return _.uniq(_.values(_.map(_.get(wellable, 'wellContents.0.wellContentSources', []), (wellContentSource) => _.get(wellContentSource, 'sourceWell.plate.id'))))
            }]
        }
    }
    await loadPlate()
    plateDiagramKey.value = uuidv4() // force plate diagram to re-render
})

onMounted(() => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: ['rna.id'],
        syncedPlateWellSpecs: sourcePlateLayout.wellSpecs,
        symbol: (well: any) => {
            const count = well.wellContents?.length
            return count > 0 ? String(count) : ''
        },
        tooltip: (well: any) => {
            const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
            const rnaName = _.get(_.find(well.wellContents, (wc: any) => _.get(wc, 'wellable.rna')), 'wellable.rna.pellet.name')
            const primerNames = _.compact(_.map(well.wellContents, (wc: any) => _.get(wc, 'wellable.rnaPreseq2Primer.name')))
            const primerLines = primerNames.map((n: string) => `<br>${n}`).join('')
            return rnaName ? `${wellCoordinate}:<br>${rnaName} (RNA)${primerLines}` : wellCoordinate
        },
    }
    if (selectionTableName.value === 'rna') {
        plateLayout.wellContentsDisplayConfig.value.selectionTableRecordIdPaths = ['rna.id']
    } else if (selectionTableName.value.endsWith('-plate')) {
        plateLayout.wellContentsDisplayConfig.value.selectionTableRecordIdPaths = [(wellable: any) => {
            return _.uniq(_.values(_.map(_.get(wellable, 'wellContents.0.wellContentSources', []), (wellContentSource) => _.get(wellContentSource, 'sourceWell.plate.id'))))
        }]
    }
    loadPlate()
})

const loadPlate = async () => {
    await plateLayout.loadPlate(
        {
            rna: {
                with: {
                    pellet: true
                }
            },
            rnaPreseq2Primer: true,
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
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    )

    plateWithWellSpecs.value = {
        ...plateLayout.plateWithWellContents.value,
        wells: _.values(plateLayout.wellSpecs.value),
    }


    pcrExperiment.value = _.first(await RecordService.getRecords(
        `${config.public.apiBase}/pcr-experiments`,
        {},
        {
            '==': [{'var': 'plateId'}, plateWithWellSpecs.value.id],
        }
    ))
}

const displayWithClause = computed(() => {
    if (selectionTableName.value === 'rna') {
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
                },
            },
            pellet: {
                columns: {
                    id: true,
                    name: true,
                    transfections: true,
                    harvestDay: true,
                },
                with: {
                    transfectTarget: {
                        columns: {id: true},
                        with: {
                            experiment: {
                                columns: {},
                                with: {
                                    cycle: {
                                        columns: {
                                            id: true,
                                            name: true,
                                        },
                                    }
                                }
                            }
                        }
                    }
                }
            },
        }
    } else {
        return {}
    }
})
const columnDefs = computed((): ColumnDefinitions => {
    if (selectionTableName.value.endsWith('-plate') || selectionTableName.value.endsWith('-storage')) {
        return {
            plateType: { display: false },
            plateTypeLabel: { header: 'Type' },
            cycleName: { header: 'Cycle' },
            cycleId: { display: false },
            pcrExperimentId: { display: false },
            sgRnaCloningExperimentId: { display: false },
            sizeX: { display: false },
            sizeY: { display: false },
            wellsCount: { display: false },
            wellsWithContentCount: { display: false },
            wellsProcessedCount: {
                header: 'Wells processed',
                format: (data: any) => {
                    return data.wellsProcessedCount || ''
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
    } else if (selectionTableName.value === 'rna') {
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
                header: 'Wells',
                format: (x: any) => {
                    return _.values(combinedWellLocations(x, {asDict: true, includePlateIds: [route.params.id as string]})).join(', ')
                },
                path: 'wellContents.displayValue',
                type: 'string',
                index: 2,
            },
            otherLocations: {
                header: 'Other locations',
                format: (x: any) => {
                    return combinedWellLocations(x, {excludePlateIds: [route.params.id as string]}) as string
                },
                path: 'otherLocations.displayValue',
                type: 'string',
                index: 3,
            },
            extractionExperimentId: { display: false},
            pelletId: { display: false},
            pellet: {
                header: 'Name',
                format: (x: any) => {
                    return x.pellet?.name || ''
                },
                path: 'pellet.displayValue',
                index: 1
            },
            cycle: {
                header: 'Cycle',
                format: (x: any) => {
                    return x.pellet?.transfectTarget?.experiment?.cycle?.name || ''
                },
                path: 'cycle.displayValue',
                index: 1
            },
            protocol: {
                index: 4,
            }
        }
    } else {
        return {}
    }
})

const rowActions = computed(() => {
    if (selectionTableName.value == 'rna') {
        return {
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
                        await plateLayout.assignIdToSelectedWells(data.id)
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
    } else {
        return {}
    }
})

const selectionTableOptions = [
    { label: 'RNA RT storage', value: 'rna-rt-storage' },
    { label: 'RNA PreSeq 1 plates', value: 'rna-preseq-1-plate' },
    { label: 'RNA samples', value: 'rna' },
]
watch(selectionTableName, (newValue, oldValue) => {
    if (newValue != oldValue) {
        selectionTableKey.value += 1
        plateLayout.selectionTableRef.value.selection = []
    }
})
const whereClause = computed(() => {
    return (selectionTableName.value === 'rna-rt-storage') ? {"==": [{"var": "plateType"}, "rna-rt-storage"]} : (selectionTableName.value === 'rna-preseq-1-plate') ? {"==": [{"var": "plateType"}, "rna-preseq-1"]} : {}
})
const frozenRecordIds = computed(() => {
    return _.compact(_.flatten(_.map(plateLayout.selectedWells.value, 'selectionTableRecordIds')))
})

const transferSelectedWellsContents = async () => {
    const sourceWells = sourcePlateLayout!.selectedWells.value
    const destinationWells = plateLayout.selectedWells.value

    if (_.isEmpty(sourceWells)) {
        toast.add({severity: 'warn', summary: 'No wells selected for transfer', life: 3000})
    } else if (selectedSourcePlate.value.plateType === 'rna-preseq-1' && sourceWells.length !== destinationWells.length) {
        toast.add({severity: 'warn', summary: 'Number of selected wells in source plate does not match number of selected wells in destination plate', life: 3000})
    } else if (selectedSourcePlate.value.plateType === 'rna-rt-storage' && (sourceWells.length * 4) !== destinationWells.length) {
        toast.add({severity: 'warn', summary: 'Number of selected wells in source plate does not match number of selected wells (x4) in destination plate', life: 3000})
    } else {
        // sort wells by x and y coordinate to achieve the correct order
        const sourceWellsSorted = _.sortBy(sourceWells, ['x', 'y'])
        const destinationWellsSorted = _.sortBy(destinationWells, ['x', 'y'])

        const wellContentsToAdd = _.flatten(_.map(sourceWellsSorted, (well, index) => {
            const wellContents = well.data.wellContents

            if (selectedSourcePlate.value.plateType === 'rna-rt-storage') {
                // get next 4 sorted destination wells by index
                const destinationWells = destinationWellsSorted.slice(index * 4, index * 4 + 4)

                return _.map(wellContents, (wellContent) => {
                    return _.map(destinationWells, (destinationWell) => {
                        return {
                            wellId: destinationWell.id,
                            sourceWellIds: [well.id],
                            wellableId: wellContent.wellableId,
                            createdBy: (user.value as User)?.id,
                        }
                    })
                })
            } else {
                // for rna-preseq-1 source plate, each source well corresponds to one destination well
                const destinationWell = destinationWellsSorted[index]!
                return _.map(wellContents, (wellContent) => {
                    return {
                        wellableId: wellContent.wellableId,
                        wellId: destinationWell.id,
                        sourceWellIds: [well.id],
                        createdBy: (user.value as User)?.id,
                    }
                })
            }
        }))
        await plateLayout.addWellContents(wellContentsToAdd.flat())
    }
}

const assignPrimers = async () => {
    const result = await plateLayout.assignPreseqPrimers('rna-preseq-2')
    if (result && _.isEmpty(result.affectedWellIds)) {
        toast.add({ severity: 'info', summary: 'No changes needed', detail: 'All wells already have correct primers', life: 3000 })
    }
}

</script>
<template>
    <Splitter class="h-full mb-8" :layout="smallerThanLg ? 'vertical' : 'horizontal'">
        <SplitterPanel class="overflow-scroll" :size="60">
            <SmartTable
                :key="selectionTableKey"
                :ref="plateLayout.setSelectionTableRef"
                :tableName="selectionTableName.endsWith('-plate') || selectionTableName.endsWith('-storage') ? 'view-plates-with-well-counts' : selectionTableName"
                :canAdd="false"
                :canDelete="false"
                :canEdit="false"
                :canExport="false"
                :where="whereClause"
                :columnDefs="columnDefs"
                :withClause="displayWithClause"
                :rowActions="rowActions"
                :showColumnFilters="true"
                :sortBy="selectionTableName == 'rna' ? ['wellContents.displayValue']: undefined"
                :selectionMode="selectionTableName.endsWith('-plate') || selectionTableName.endsWith('-storage') ? 'single' : 'multiple'"
                :rowsPerPageOptions="[10, 25, 50, 100]"
                emptyMessage=""
                v-model:frozenRecordIds="frozenRecordIds">
                <template #header-buttons>
                    <SelectButton class="record-type-select" v-model="selectionTableName" :options="selectionTableOptions" optionLabel="label" optionValue="value" dataKey="label" />
                    <Button
                        class="p-button-info"
                        icon="pi pi-calculator"
                        label="Volume Calcs"
                        v-tooltip="{value: 'Volume calcs', showDelay: 500}"
                        @click="router.push({path: `/sge/preseq-2/volume-calcs/${pcrExperiment.id}`})" />
                </template>
            </SmartTable>
        </SplitterPanel>
        <SplitterPanel :size="40" :minSize="25">
            <Splitter layout="vertical">
                <SplitterPanel v-if="selectionTableName.endsWith('-plate') || selectionTableName.endsWith('-storage')" class="flex justify-center overflow-scroll mt-10">
                    <PlateDiagram
                        :key="sourcePlateDiagramKey"
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
                                v-tooltip="{value: 'Transfer selected samples to PreSeq 2 plate', showDelay: 500}"
                                :disabled="_.isEmpty(sourcePlateLayout?.selectedWells.value)"
                                @click="transferSelectedWellsContents" >
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
                        :key="plateDiagramKey"
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
                        <template #button2>
                            <Button
                                class="p-button-secondary"
                                icon="pi pi-tag"
                                v-tooltip="{value: 'Assign primers to wells', showDelay: 500}"
                                @click="assignPrimers" />
                        </template>
                    </PlateDiagram>
                </SplitterPanel>
            </Splitter>
        </SplitterPanel>
    </Splitter>
</template>

<style scoped>
.record-type-select :deep(.p-togglebutton.p-togglebutton-checked::before) {
    background-color: theme('colors.orange.500');
}
.record-type-select :deep(.p-togglebutton.p-togglebutton-checked .p-togglebutton-label) {
    color: theme('colors.white');
}
</style>
