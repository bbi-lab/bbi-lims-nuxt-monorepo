<script setup lang="ts">
import _ from 'lodash'
import type { HaPuc19Plasmid } from '#shared/db/schema/plasmid'
import { getWellTextColor, wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'
import { schemas } from '#shared/db/zod/zodSchemas'

const { breakpoints } = useLayout()
const route = useRoute()
const plateLayout = usePlateLayout<{ haPuc19Plasmid: HaPuc19Plasmid | null }>()
const toast = useToast()

const smallerThanLg = breakpoints.smaller('lg')
const plateWithWellSpecs = ref()

onMounted(async() => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: [(wellContent: any) => _.get(wellContent, 'haPuc19Plasmid.id')],
        selectionTableRecordIdPaths: ['haPuc19Plasmid.id'],
        tooltip: (well: any) => {
            const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
            const productName = _.get(well, ['wellContents', 0, 'wellable', 'haPuc19Plasmid', 'name'])
            return productName ? `${wellCoordinate}:<br>${productName} (HA pUC19 Gibson product)` : wellCoordinate
        },
    }
    loadPlate()
})

const loadPlate = async () => {
    await plateLayout.loadPlate(
        {
            haPuc19Plasmid: true,
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
        }
    },
    haPuc19GibsonProduct: {
        columns: {
            id: true,
            name: true,
        },
        with: {
            haPuc19PcrProduct: {
                columns: {
                    id: true,
                    name: true,
                },
                with: {
                    haPcrProduct: {
                        columns: {
                            id: true,
                            name: true,
                        },
                        with: {
                            haCloningExperiment: {
                                columns: {
                                    name: true,
                                    id: true,
                                },
                                with: {
                                    haCloningExperimentTargets: {
                                        columns: {},
                                        with: {
                                            target: {
                                                columns: {
                                                    id: true,
                                                    name: true,
                                                }
                                            }
                                        }
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    // preppedBy: {
    //     columns: {
    //         id: true,
    //         name: true,
    //         email: true,
    //     }
    // },
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
    haPuc19GibsonProductId: { display: false },
    eColiStellarVolume: { display: false },
    // puc19VectorAmount: { display: false },
    // temperatureUsed: { display: false },
    transformedBy: { path: 'transformedBy.name' },
    colonyPickedBy: { path: 'colonyPickedBy.name' },
    preppedBy: { path: 'preppedBy.name' },
    targets: {
        format: (data: any) => {
            return _.map(data.haPuc19GibsonProduct?.haPuc19PcrProduct?.haPcrProduct?.haCloningExperiment?.haCloningExperimentTargets || [], 'target.name').join(', ')
        },
        path: 'targets.displayValue',
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
                tableName="ha-puc-19-plasmids"
                :zodSchema="schemas.haPuc19Plasmids.select"
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
                :sortBy="['wellContents.displayValue']"
                emptyMessage=""
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
</template>
