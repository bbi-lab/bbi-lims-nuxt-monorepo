<script setup lang="ts">
import _ from 'lodash'
import type { HomologyArmPuc19Primer, HomologyArmPrimer } from '#shared/db/schema/primer'
import { getWellTextColor, wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'
import { schemas } from '#shared/db/zod/zodSchemas'

const { breakpoints } = useLayout()
const route = useRoute()
const config = useRuntimeConfig()
const plateLayout = usePlateLayout<{ homologyArmPuc19Primer: (HomologyArmPuc19Primer & { homologyArmPrimer: HomologyArmPrimer | null }) | null }>()
const selectedSourcePlateId = ref<string>()
const showHaPrimerPlateSelector = ref(false)
const sourcePlateLayout = usePlateLayout<{ homologyArmPrimer: HomologyArmPrimer | null }>()
const sourcePlateWithWellSpecs = ref()
const toast = useToast()
const { user } = useUserSession()

const smallerThanLg = breakpoints.smaller('lg')
const plateWithWellSpecs = ref()

onMounted(async() => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: [(wellContent: any) => _.replace(_.get(wellContent, 'homologyArmPuc19Primer.name'), /(_F|_R)$/g, '')],
        selectionTableRecordIdPaths: ['homologyArmPuc19Primer.id'],
        syncedPlateWellSpecs: sourcePlateLayout.wellSpecs,
        tooltip: (well: any) => {
            const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
            const primerName = _.get(well, ['wellContents', 0, 'wellable', 'homologyArmPuc19Primer', 'name'])
            return primerName ? `${wellCoordinate}:<br>${primerName} (HA PUC19)` : wellCoordinate
        },
        symbol: (well: any) => {
            const primerDirection = _.get(well, ['wellContents', 0, 'wellable', 'homologyArmPuc19Primer', 'homologyArmPrimer', 'sequenceType'])
            return primerDirection ? _.upperCase(primerDirection[0]) : ''
        },
    }
    loadPlate()
})

const loadPlate = async () => {
    await plateLayout.loadPlate(
        {
            homologyArmPuc19Primer: {
                with: {
                    homologyArmPrimer: true
                }
            },
        },
    )

    plateWithWellSpecs.value = {
        ...plateLayout.plateWithWellContents.value,
        wells: _.values(plateLayout.wellSpecs.value),
    }
}


watch (selectedSourcePlateId, async (newValue) => {
    if (newValue) {
        sourcePlateLayout.setPlateId(newValue)

        sourcePlateLayout.wellContentsDisplayConfig.value = {
            colorBy: [(wellContent: any) => _.replace(_.get(wellContent, 'homologyArmPrimer.name'), /(_F|_R)$/g, '')],
            selectionTableRecordIdPaths: ['homologyArmPrimer.id'],
            syncedPlateWellSpecs: plateLayout.wellSpecs,
            tooltip: (well: any) => {
                const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
                const primerName = _.get(well, ['wellContents', 0, 'wellable', 'homologyArmPrimer', 'name'])
                return primerName ? `${wellCoordinate}:<br>${primerName} (HA)` : wellCoordinate
            },
            symbol: (well: any) => {
                const primerDirection = _.get(well, ['wellContents', 0, 'wellable', 'homologyArmPrimer', 'sequenceType'])
                return primerDirection ? _.upperCase(primerDirection[0]) : ''
            },
        }
        await sourcePlateLayout.loadPlate({
                homologyArmPrimer: true,
        })

        sourcePlateWithWellSpecs.value = {
            ...sourcePlateLayout.plateWithWellContents.value,
            wells: _.values(sourcePlateLayout.wellSpecs.value),
        }
    } else {
        sourcePlateWithWellSpecs.value = null
    }
})

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
    homologyArmPrimer: true,
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
    homologyArmPrimerId: { display: false },
    homologyArmPrimer: {
        path: 'homologyArmPrimer.name',
        index: 2,
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

        const haPrimersToConvert = _.map(sourceWellsSorted, (well, index) => {
            const haPrimer = _.get(well, 'data.wellContents.0.wellable.homologyArmPrimer')
            const destinationWell = destinationWellsSorted[index]!
            return {
                haPrimer,
                wellId: destinationWell.id,
                sourceWellIds: [well.id],
                createdBy: (user.value as any)?.id,
            }
        })
        try {
            const result: any[] = await $fetch(`${config.public.apiBase}/custom/primers/transfer-convert-ha-primers`, {
                method: 'POST',
                body: haPrimersToConvert
            })
            if (!_.isEmpty(result)) {
                toast.add({severity: 'success', summary: 'Successfully transferred and converted primers', detail: `Transferred and converted ${_.size(result)} primers`, life: 5000})

                const updatedWellIds = _.uniq(_.map(result, 'wellId'))
                const oldValues = _.values(_.pick(plateLayout.wellSpecs.value, updatedWellIds))
                await plateLayout.reloadPlate()
                const updatedWells = _.values(_.pick(plateLayout.wellSpecs.value, updatedWellIds))

                // Update the plate diagram with the new well specs
                plateLayout.plateDiagramRef.value!.updateWells(updatedWells, oldValues)
            } else {
                toast.add({severity: 'info', summary: 'No primers were transferred and converted', detail: 'No primers were transferred and converted. Please check that the selected wells in the source plate contain HA primers.', life: 5000})
            }
        } catch (error) {
            console.error('Error transferring and converting primers:', error)
            toast.add({severity: 'error', summary: 'Error transferring and converting primers', detail: _.get(error, 'data.message', 'An error occurred'), life: 5000})
            return
        }
    }
}
</script>
<template>
    <Splitter class="h-full mb-8" :layout="smallerThanLg ? 'vertical' : 'horizontal'">
        <SplitterPanel class="overflow-scroll" :size="60">
            <SmartTable
                :ref="plateLayout.setSelectionTableRef"
                tableName="homology-arm-puc-19-primers"
                :zodSchema="schemas.homologyArmPuc19Primers.select"
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
                <template #header-buttons>
                    <Button
                        v-if="!showHaPrimerPlateSelector"
                        class="p-button-info"
                        label="Convert HA Primers"
                        @click="showHaPrimerPlateSelector = true" />
                    <div v-if="showHaPrimerPlateSelector">
                        <AutoCompleter
                            v-model="selectedSourcePlateId"
                            inputClass="w-80"
                            :searchBaseUrl="`${config.public.apiBase}/plates`"
                            :searchWhereClause="{'==': [{'var': 'plateType'}, 'ha-primer-storage']}"
                            dropdown
                            :placeholder-value="'Select HA Primer storage'"
                            @clearedValue="showHaPrimerPlateSelector = false" />
                    </div>
                </template>
            </SmartTable>
        </SplitterPanel>
        <SplitterPanel class="flex justify-center overflow-scroll mt-10" :size="40" :minSize="25">
            <Splitter layout="vertical">
                <SplitterPanel v-if="selectedSourcePlateId && sourcePlateWithWellSpecs" class="flex justify-center overflow-scroll mt-10">
                    <PlateDiagram
                        :ref="sourcePlateLayout?.setPlateDiagramRef"
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
                                v-tooltip="{value: 'Convert and transfer to HA pUC19 primer storage', showDelay: 500}"
                                :disabled="_.isEmpty(sourcePlateLayout?.selectedWells.value)"
                                @click="transferSelectedWellsContents">
                                <template #icon>
                                    <Icon name="ix:move-layer-down" />
                                </template>
                            </Button>
                        </template>
                    </PlateDiagram>
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
