<script setup lang="ts">
import _ from 'lodash'
import type { Rna } from '#shared/db/schema/nucleic-acid'
import type { Pellet } from '#shared/db/schema/pellet'
import { getWellTextColor, wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'
import { schemas } from '#shared/db/zod/zodSchemas'

const { breakpoints } = useLayout()
const route = useRoute()
const plateLayout = usePlateLayout<{ rna: (Rna & { pellet: Pellet | null }) | null }>()
const toast = useToast()

const smallerThanLg = breakpoints.smaller('lg')
const plateWithWellSpecs = ref()
const pcrExperiment = ref()
const config = useRuntimeConfig()
const whereClause = ref()

onMounted(async() => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: ['rna.id'],
        selectionTableRecordIdPaths: ['rna.id'],
        tooltip: (well: any) => {
            const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
            const rnaName = _.get(well, ['wellContents', 0, 'wellable', 'rna', 'pellet', 'name'])
            return rnaName ? `${wellCoordinate}:<br>${rnaName} (RNA)` : wellCoordinate
        },
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
        },
    )

    plateWithWellSpecs.value = plateLayout.plateWithPlateDiagramWells.value

    pcrExperiment.value = _.first(await RecordService.getRecords(
        `${config.public.apiBase}/pcr-experiments`,
        {
            pcrExperimentTargets: {
                columns: {id: true, transfectTargetId: true},
            }
        },
        {
            '==': [{'var': 'plateId'},  plateWithWellSpecs.value.id],
        }
    ))

    whereClause.value = {
        'in':[{'var': 'pellet.transfectTarget.id'}, pcrExperiment.value.pcrExperimentTargets.map((x: any) => x.transfectTargetId)]
    }
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

const layoutPreseq1 = async () => {
    const wellContentsDetected = _.some(plateLayout.plateWithWellContents.value?.wells, (well) => !_.isEmpty(well.wellContents))
    if (wellContentsDetected) {
        toast.add({ severity: 'warn', summary: 'Wells already populated', detail: 'Auto-layout requires plate to be empty', life: 3000 })
        return
    }

    let lastColumnPopulated = 0
    const allWellContentsToAdd = []

    const selectedRna = plateLayout.selectionTableRef.value.selectedRecords
    // should be only one negative control
    const negativeControl = _.find(selectedRna, (rna) => {
        return rna.pellet.transfections?.length == 1 && rna.pellet.transfections[0] == 'NC'
    })

    if (negativeControl) {
        // assign to the first column (8 wells)
        const wellsToAssignTo = _.filter(plateWithWellSpecs.value.wells, (well) => well.x == 1)
        const wellContentsToAdd = _.map(wellsToAssignTo, (well) => {
            return {
                wellId: well.id,
                wellableId: negativeControl.wellable?.id,
            }
        })
        allWellContentsToAdd.push(...wellContentsToAdd)
        if (!_.isEmpty(wellContentsToAdd)) lastColumnPopulated++
    }

    const dayFiveRnaList = _.sortBy(_.filter(selectedRna, (rna) => {
        return rna.pellet.harvestDay == 5 && !_.includes(rna.pellet.transfections, 'NC')
    }), (x) => x.pellet.name)

    for (const dayFiveRna of dayFiveRnaList) {
        // assign each to one column (8 wells)
        const wellsToAssignTo = _.filter(plateWithWellSpecs.value.wells, (well) => well.x == lastColumnPopulated + 1)
        const wellContentsToAdd = _.map(wellsToAssignTo, (well) => {
            return {
                wellId: well.id,
                wellableId: dayFiveRna.wellable?.id,
            }
        })
        allWellContentsToAdd.push(...wellContentsToAdd)
        if (!_.isEmpty(wellContentsToAdd)) lastColumnPopulated++
    }

    const dayThirteenRnaList = _.sortBy(_.filter(selectedRna, (rna) => {
        return rna.pellet.harvestDay == 13 && !_.includes(rna.pellet.transfections, 'NC')
    }), (x) => x.pellet.name)

    for (const dayThirteenRna of dayThirteenRnaList) {
        // assign each to 2 columns (16 wells)
        const wellsToAssignTo = _.filter(plateWithWellSpecs.value.wells, (well) => well.x > lastColumnPopulated && well.x <= lastColumnPopulated + 2)
        const wellContentsToAdd = _.map(wellsToAssignTo, (well) => {
            return {
                wellId: well.id,
                wellableId: dayThirteenRna.wellable?.id,
            }
        })
        allWellContentsToAdd.push(...wellContentsToAdd)
        if (!_.isEmpty(wellContentsToAdd)) lastColumnPopulated = lastColumnPopulated + 2
    }
    if (!_.isEmpty(allWellContentsToAdd)) {
        await plateLayout.addWellContents(allWellContentsToAdd)
    }
}
const frozenRecordIds = computed(() => {
    return _.compact(_.flatten(_.map(plateLayout.selectedWells.value, 'selectionTableRecordIds')))
})
</script>
<template>
    <Splitter class="h-full mb-8" :layout="smallerThanLg ? 'vertical' : 'horizontal'">
        <SplitterPanel class="overflow-scroll" :size="60">
            <SmartTable
                v-if="whereClause"
                :ref="plateLayout.setSelectionTableRef"
                tableName="rna"
                :zodSchema="schemas.rna.select"
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
                emptyMessage="No RNA samples associated with selected targets"
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
                        icon="pi pi-star"
                        v-tooltip="{value: 'Auto-layout', showDelay: 500}"
                        :disabled="!_.isEmpty(plateLayout.selectedWells.value) || _.isEmpty(plateLayout.selectionTableRef.value?.selectedRecords)"

                        @click="layoutPreseq1" />
                </template>
                <template #button2>
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
