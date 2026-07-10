<script setup lang="ts">
import _ from 'lodash'
import type { Dna } from '#shared/db/schema/nucleic-acid'
import type { Pellet } from '#shared/db/schema/pellet'
import type { preseq2Primer } from '#shared/db/schema/primer'
import { getWellTextColor, wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'

const { breakpoints } = useLayout()
const route = useRoute()
const plateLayout = useSgePlateLayout<{ dna: (Dna & { pellet: Pellet | null }) | null; preseq2Primer: preseq2Primer | null }>()
const toast = useToast()
const router = useRouter()

const smallerThanLg = breakpoints.smaller('lg')
const plateWithWellSpecs = ref()
const pcrExperiment = ref()
const config = useRuntimeConfig()
const selectionTableName = ref<string>('view-plates-with-well-counts')
const selectionTableKey = ref(0)

watch(selectionTableName, async (newValue) => {
    if (plateLayout.wellContentsDisplayConfig.value) {
        if (newValue === 'dna') {
            plateLayout.wellContentsDisplayConfig.value.selectionTableRecordIdPaths = ['dna.id']
        } else if (newValue === 'view-plates-with-well-counts') {
            plateLayout.wellContentsDisplayConfig.value.selectionTableRecordIdPaths = [(wellable: any) => {
                return _.uniq(_.values(_.map(_.get(wellable, 'wellContents.0.wellContentSources', []), (wellContentSource) => _.get(wellContentSource, 'sourceWell.plate.id'))))
            }]
        }
    }
    await loadPlate()
})

onMounted(() => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: ['dna.id'],
        symbol: (well: any) => {
            const count = well.wellContents?.length
            return count > 0 ? String(count) : ''
        },
        tooltip: (well: any) => {
            const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
            const dnaName = _.get(_.find(well.wellContents, (wc: any) => _.get(wc, 'wellable.dna')), 'wellable.dna.pellet.name')
            const primerNames = _.compact(_.map(well.wellContents, (wc: any) => _.get(wc, 'wellable.preseq2Primer.name')))
            const primerLines = primerNames.map((n: string) => `<br>${n}`).join('')
            return dnaName ? `${wellCoordinate}:<br>${dnaName} (DNA)${primerLines}` : wellCoordinate
        },
    }
    if (selectionTableName.value === 'dna') {
        plateLayout.wellContentsDisplayConfig.value.selectionTableRecordIdPaths = ['dna.id']
    } else if (selectionTableName.value === 'view-plates-with-well-counts') {
        plateLayout.wellContentsDisplayConfig.value.selectionTableRecordIdPaths = [(wellable: any) => {
            return _.uniq(_.values(_.map(_.get(wellable, 'wellContents.0.wellContentSources', []), (wellContentSource) => _.get(wellContentSource, 'sourceWell.plate.id'))))
        }]
    }
    loadPlate()
})

const loadPlate = async () => {
    await plateLayout.loadPlate(
        {
            dna: {
                with: {
                    pellet: true
                }
            },
            preseq2Primer: true,
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
        {
            pcrExperimentTargets: {
                with: {
                    transfectTarget: {
                        columns: {id: true},
                    }
                }
            }
        },
        {
            '==': [{'var': 'plateId'}, plateWithWellSpecs.value.id],
        }
    ))
}

const displayWithClause = computed(() => {
    if (selectionTableName.value === 'dna') {
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
    if (selectionTableName.value === 'view-plates-with-well-counts') {
        return {
            name: {
                type: 'element',
                element: (data: any) => {
                    return `<a href="/sge/plate-layout/dna-preseq-1/${data.id}" class="text-blue-500 hover:underline">${data.name}</a>`
                },
            },
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
                    return _.includes(['dna-preseq-1', 'dna-preseq-2'], data.plateType) ? data.wellsProcessedCount : ''
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
    } else if (selectionTableName.value === 'dna') {
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
                if (selectionTableName.value === 'dna') {
                    await plateLayout.assignIdToSelectedWells(data.id)
                } else if (selectionTableName.value === 'view-plates-with-well-counts') {
                    await plateLayout.poolDnaPreSeq1PlateToSelectedWells(data.id)
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
const selectionTableOptions = [
    { label: 'Plates', value: 'view-plates-with-well-counts' },
    { label: 'DNA', value: 'dna' },
]
watch(selectionTableName, (newValue, oldValue) => {
    if (newValue != oldValue) {
        selectionTableKey.value += 1
        plateLayout.selectionTableRef.value.selection = []
    }
})
const whereClause = computed(() => {
    return (selectionTableName.value === 'view-plates-with-well-counts') ? {"==": [{"var": "plateType"}, "dna-preseq-1"]} : {}
})
const frozenRecordIds = computed(() => {
    return _.compact(_.flatten(_.map(plateLayout.selectedWells.value, 'selectionTableRecordIds')))
})

const assignPrimers = async () => {
    const result = await plateLayout.assignPreseqPrimers('dna-preseq-2')
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
                :tableName="selectionTableName"
                :canAdd="false"
                :canDelete="false"
                :canEdit="false"
                :canExport="false"
                :where="whereClause"
                :columnDefs="columnDefs"
                :withClause="displayWithClause"
                :rowActions="rowActions"
                :showColumnFilters="true"
                :rowsPerPageOptions="[10, 25, 50, 100]"
                selectionMode="single"
                :sortBy="selectionTableName === 'dna' ? ['wellContents.displayValue'] : undefined"
                emptyMessage=""
                v-model:frozenRecordIds="frozenRecordIds">
                <template #header-buttons>
                    <SelectButton v-model="selectionTableName" :options="selectionTableOptions" optionLabel="label" optionValue="value" dataKey="label" />
                    <Button
                        class="p-button-info"
                        icon="pi pi-calculator"
                        label="Volume Calcs"
                        v-tooltip="{value: 'Volume calcs', showDelay: 500}"
                        @click="router.push({path: `/sge/preseq-2/volume-calcs/${pcrExperiment.id}`})" />
                </template>
            </SmartTable>
        </SplitterPanel>
        <SplitterPanel class="flex justify-center overflow-scroll mt-10" :size="40" :minSize="25">
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
</template>
