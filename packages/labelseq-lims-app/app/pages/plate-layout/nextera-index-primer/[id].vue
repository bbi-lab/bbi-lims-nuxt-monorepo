<script setup lang="ts">
import { schemas } from '#shared/db/zod/zodSchemas'
import { v4 as uuidv4 } from 'uuid'
import { wellCoordinateToChar, getWellTextColor } from 'lims-layer/shared/lib/plate-diagram'
import _ from 'lodash'

const route = useRoute()
const tableKey = ref<string>(uuidv4())
const plateLayout = usePlateLayout()
const { breakpoints } = useLayout()
const smallerThanLg = breakpoints.smaller('lg')

const plateWithWellSpecs = ref()

onMounted(async() => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: ['nexteraIndexPrimer.id'],
        selectionTableRecordIdPaths: ['nexteraIndexPrimer.id'],
        tooltip: (well: any) => {
            const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
            const nexteraIndexPrimerName = _.get(_.find(well.wellContents, (wc: any) => _.get(wc, 'wellable.nexteraIndexPrimer')), 'wellable.nexteraIndexPrimer.name')
            return nexteraIndexPrimerName ? `${wellCoordinate}: ${nexteraIndexPrimerName}` : wellCoordinate
        },
    }
    loadPlate()
})

const loadPlate = async () => {
    await plateLayout.loadPlate(
        {
            nexteraIndexPrimer: true
        },
    )

    plateWithWellSpecs.value = plateLayout.plateWithPlateDiagramWells.value
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
                class="inline-block w-6 h-6 rounded-sm text-center pt-0.75"
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
    name: { index: 3 },
    indexSeq: { index: 4 },
    indexSeqRevComp: { header: 'Rev Comp', index: 5 },
    primerType: { index: 6 },
}

const withClause = {
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
}

const whereClause = {
}

</script>
<template>
    <Splitter class="h-full mb-8" :layout="smallerThanLg ? 'vertical' : 'horizontal'">
        <SplitterPanel class="overflow-scroll" :size="60">
            <SmartTable
                :key="tableKey"
                table-name="nextera-index-primers"
                :zodSchema="schemas.nexteraIndexPrimers.select"
                title="Nextera Index Primers"
                :column-defs="columnDefs"
                :where="whereClause"
                :with-clause="withClause"
                :can-add="false"
                :can-edit="false"
                :can-delete="false"
                :show-column-filters="true"
                :sort-by="['name']"
            />
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
