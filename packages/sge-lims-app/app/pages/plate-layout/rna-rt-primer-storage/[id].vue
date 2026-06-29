<script setup lang="ts">
import _ from 'lodash'
import type { RnaRtPrimer } from '#shared/db/schema/primer'
import { getWellTextColor, wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'
import { schemas } from '#shared/db/zod/zodSchemas'

const { breakpoints } = useLayout()
const route = useRoute()
const plateLayout = usePlateLayout<{ rnaRtPrimer: RnaRtPrimer | null }>()
const toast = useToast()

const smallerThanLg = breakpoints.smaller('lg')
const plateWithWellSpecs = ref()

onMounted(async() => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: ['rnaRtPrimer.geneId'],
        selectionTableRecordIdPaths: ['rnaRtPrimer.id'],
        tooltip: (well: any) => {
            const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
            const primerName = _.get(well, ['wellContents', 0, 'wellable', 'rnaRtPrimer', 'name'])
            return primerName ? `${wellCoordinate}:<br>${primerName} (RNA RT)` : wellCoordinate
        },
        symbol: (well: any) => {
            const primerDirection = _.get(well, ['wellContents', 0, 'wellable', 'rnaRtPrimer', 'sequenceType'])
            return primerDirection ? _.upperCase(primerDirection[0]) : ''
        },
    }

    plateLayout.setExportPlateLayoutConfig({
        columns: [
            { header: 'Well Position', data: (well: any) => {
                return `${wellCoordinateToChar(well.y)}${well.x}`
            }},
            { header: 'Primer', data: (well: any) => {
                return _.get(well, ['wellContents', 0, 'wellable', 'rnaRtPrimer', 'name']) || ''
            }},
            { header: 'Gene', data: (well: any) => _.get(well, ['wellContents', 0, 'wellable', 'rnaRtPrimer', 'gene', 'name']) || '' },
        ],
        sortBy: (well: any) => {
            return _.get(well, ['wellContents', 0, 'wellable', 'rnaRtPrimer', 'gene', 'name'])
        }
    })
    loadPlate()
})

const loadPlate = async () => {
    await plateLayout.loadPlate(
        {
            rnaRtPrimer: {
                with: {
                    gene: {
                        columns: {
                            name: true,
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
}

const whereClause = {
    'or':[
        {'==':[{'var': 'wellContents'}, null]},
        {'==':[{'var': 'wellContents.well.plate.id'}, route.params.id]},
    ]
}
const displayWithClause = {
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
    gene: {
        columns: {
            name: true
        },
    },
}
const columnDefs: ColumnDefinitions = {
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
    name: {
        index: 1
    },
    geneId: {display: false},
    gene: {
        format: (x: any) => {
            return x.gene?.name || ''
        },
        path: 'gene.displayValue',
        index: 2,
    },
    wellContents: {
        header: 'Wells',
        format: (x: any) => {
            return _.values(combinedWellLocations(x, {asDict: true, includePlateIds: [route.params.id as string]})).join(', ')
        },
        path: 'wellContents.displayValue',
        type: 'string',
        index: 3,
    },
    otherLocations: {
        header: 'Other locations',
        format: (x: any) => {
            return combinedWellLocations(x, {excludePlateIds: [route.params.id as string]}) as string
        },
        path: 'otherLocations.displayValue',
        type: 'string',
        index: 4,
    },
}
const rowActions = {
    assign: {
        label: '',
        action: async (data: any) => {
            if (plateLayout.selectedWells.value.length === 0) {
                toast.add({ severity: 'warn', summary: 'No wells selected', detail: 'Please select wells to assign primers to.', life: 3000 })
                return
            } else if (plateLayout.selectedWells.value.length > 1) {
                toast.add({ severity: 'warn', summary: 'Multiple wells selected', detail: 'Please select only one well to assign a primer.', life: 3000 })
                return
            } else if (!_.isEmpty(plateLayout.selectedWells.value[0]?.data.wellContents)) {
                toast.add({ severity: 'warn', summary: 'Well already has contents', detail: 'Please select an empty well to assign a primer.', life: 3000 })
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

const frozenRecordIds = computed(() => {
    return _.compact(_.flatten(_.map(plateLayout.selectedWells.value, 'selectionTableRecordIds')))
})
</script>
<template>
    <Splitter class="h-full mb-8" :layout="smallerThanLg ? 'vertical' : 'horizontal'">
        <SplitterPanel class="overflow-scroll" :size="60">
            <SmartTable
                :ref="plateLayout.setSelectionTableRef"
                tableName="rna-rt-primers"
                :zodSchema="schemas.rnaRtPrimers.select"
                :canAdd="false"
                :canDelete="false"
                :canEdit="false"
                :canExport="false"
                :withClause="displayWithClause"
                :where="whereClause"
                :columnDefs="columnDefs"
                :rowActions="rowActions"
                :showColumnFilters="true"
                :rowsPerPageOptions="[10, 25, 50, 100]"
                emptyMessage=""
                :rowStyle="(data: any) => {
                    return data?.archived ? {textDecoration: 'line-through'} : {}
                }"
                v-model:frozenRecordIds="frozenRecordIds">
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
                :showExportButton="true"
                @well-range-selected="plateLayout.wellRangeSelected"
                @well-selection-cleared="plateLayout.wellSelectionCleared"
                @all-wells-selected="plateLayout.selectedAllWells"
                @well-contents-updated="plateLayout.updatedWellContents"
                @did-click-export-plate-layout="plateLayout.exportPlateLayout" >
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
</template>
