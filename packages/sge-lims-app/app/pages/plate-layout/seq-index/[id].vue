<script setup lang="ts">
import _ from 'lodash'
import type { IndexPrimer } from '#shared/db/schema/primer'
import { getWellTextColor, wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'
import { schemas } from '#shared/db/zod/zodSchemas'

const { breakpoints } = useLayout()
const route = useRoute()
const plateLayout = usePlateLayout<{ indexPrimer: IndexPrimer | null }>()

const smallerThanLg = breakpoints.smaller('lg')
const plateWithWellSpecs = ref()

onMounted(async() => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: [() => true],
        selectionTableRecordIdPaths: ['indexPrimer.id'],
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
    loadPlate()
})

const loadPlate = async () => {
    await plateLayout.loadPlate(
        {
            indexPrimer: true,
        },
    )

    plateWithWellSpecs.value = {
        ...plateLayout.plateWithWellContents.value,
        wells: _.values(plateLayout.wellSpecs.value),
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
        }
    }
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
    sequence: { display: false },
    kit: {display: false},
    name: {
        index: 1,
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
                tableName="index-primers"
                :zodSchema="schemas.indexPrimers.select"
                :canAdd="false"
                :canDelete="false"
                :canEdit="false"
                :canExport="true"
                :withClause="displayWithClause"
                :columnDefs="columnDefs"
                :showColumnFilters="true"
                :rowsPerPageOptions="[10, 25, 50, 100]"
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
            </PlateDiagram>
        </SplitterPanel>
    </Splitter>
</template>
