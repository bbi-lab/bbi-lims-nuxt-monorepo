<script setup lang="ts">
import _ from 'lodash'
import { wellCoordinateToChar } from '~/lib/plate-diagram'
import type { SgRnaOligo } from '~/shared/db/schema/oligos'
import type { SgRnaPlasmid } from '~/shared/db/schema/plasmid'
import type { User } from '~/server/db/schema/user'
import { schemas } from '#shared/db/zod/zodSchemas'

const { breakpoints, showLoginModal } = useLayout()
const route = useRoute()
const plateLayout = usePlateLayout<{ sgRnaOligo: SgRnaOligo | null; sgRnaPlasmid: SgRnaPlasmid | null }>()
const sourcePlateLayout = usePlateLayout<{ sgRnaOligo: SgRnaOligo | null }>()
const sourcePlateWithWellSpecs = ref()
const toast = useToast()
const { user } = useUserSession()

const smallerThanLg = breakpoints.smaller('lg')
const plateWithWellSpecs = ref()
const splitter = ref()
const selectionTableKey = ref(0)
const experimentPlateDiagramKey = ref(0)
const sgRnaCloningExperiment = ref()
const crudTable = useCrudTable()

const transformed = computed(() => {
    return sgRnaCloningExperiment.value?.plate?.plateType == 'sg-rna-plasmid'
})
const showSgRnaPlasmidEditDialog = computed(() => {
    return crudTable.state.showEditForm || crudTable.state.showMultipleEditForm
})
const selectedSourcePlate = computed(() => {
    return plateLayout.selectionTableRef.value?.selectedRecords
})

const plamidPlateDisplayConfig = {
    colorBy: ['sgRnaPlasmid.id'],
    tooltip: (well: any) => {
        const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
        const sgRnaPlasmid = _.get(well.wellContents, [0, 'wellable', 'sgRnaPlasmid'])
        return sgRnaPlasmid ? `${wellCoordinate}:<br>` + _.get(sgRnaPlasmid, 'name') : wellCoordinate
    },
    symbol: (well: any) => {
        const sgRnaPlasmid = _.get(well.wellContents, [0, 'wellable', 'sgRnaPlasmid'])
        if (sgRnaPlasmid?.verificationStatus == 'passed') {
            return '✓'
        } else if (sgRnaPlasmid?.verificationStatus == 'failed') {
            return 'x'
        } else {
            return ''
        }
    },
}
const sgRnaOligoPlateDisplayConfig = {
    colorBy: ['sgRnaOligo.id'],
    syncedPlateWellSpecs: plateLayout.wellSpecs,
    tooltip: (well: any) => {
        const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
        const oligos = _.map(well.wellContents, 'wellable.sgRnaOligo')
        return oligos ? `${wellCoordinate}:<br>` + _.map(oligos, 'name').join('<br>') : wellCoordinate
    },
    symbol: (well: any) => {
        const oligos = _.compact(_.map(well.wellContents, 'wellable.sgRnaOligo'))
        return oligos ? _.size(oligos) : ''
    },
}

const sgRnaOligoExportColumns = [
    {
        header: 'Well Position',
        data: (well: any) => `${wellCoordinateToChar(well.y)}${well.x}`,
    },
    {
        header: 'sgRNA Oligo 1',
        data: (well: any) => _.get(well, 'wellContents.0.wellable.sgRnaOligo.name')
    },
    {
        header: 'sgRNA Oligo 2',
        data: (well: any) => _.get(well, 'wellContents.1.wellable.sgRnaOligo.name')
    },
]
const sgRnaPlasmidExportColumns = [
    {
        header: 'Well Position',
        data: (well: any) => `${wellCoordinateToChar(well.y)}${well.x}`,
    },
    {
        header: 'sgRNA Plasmid',
        data: (well: any) => _.get(well, 'wellContents.0.wellable.sgRnaPlasmid.name')
    },
]

watch(selectedSourcePlate, async (newValue) => {
    if (newValue?.id) {
        sourcePlateLayout.setPlateId(newValue.id)
        await sourcePlateLayout.loadPlate({
            sgRnaOligo: true,
        })
        sourcePlateWithWellSpecs.value = {
            ...sourcePlateLayout.plateWithWellContents.value,
            wells: _.values(sourcePlateLayout.wellSpecs.value),
        }
    } else {
        sourcePlateWithWellSpecs.value = null
    }
})

onMounted(async() => {
    sgRnaCloningExperiment.value = await $fetch(`/api/sg-rna-cloning-experiments/${route.params.id}`, {
        query: { with: JSON.stringify({ plate: true }) },
    })

    const plateId = _.get(sgRnaCloningExperiment.value, 'plateId')

    // set display config based on whether the plate has been transformed or not
    // experiment plate syncs with source plate's well specs for consistent coloring
    plateLayout.wellContentsDisplayConfig.value = transformed.value ? plamidPlateDisplayConfig : {
        ..._.omit(sgRnaOligoPlateDisplayConfig, 'syncedPlateWellSpecs'),
        syncedPlateWellSpecs: sourcePlateLayout.wellSpecs,
    }

    plateLayout.setExportPlateLayoutConfig({
        columns: transformed.value ? sgRnaPlasmidExportColumns : sgRnaOligoExportColumns,
    })

    sourcePlateLayout.wellContentsDisplayConfig.value = sgRnaOligoPlateDisplayConfig
    sourcePlateLayout.setExportPlateLayoutConfig({
        columns: sgRnaOligoExportColumns,
    })

    if (plateId) {
        plateLayout.setPlateId(plateId)
        loadPlate()
    }

    // resets splitter panel sizes after content has been rendered
    nextTick(() => {
        splitter.value.resetState()
    })

})

const loadPlate = async () => {
    await plateLayout.loadPlate(
        {
            sgRnaOligo: true,
            sgRnaPlasmid: true,
        },
    )

    plateWithWellSpecs.value = {
        ...plateLayout.plateWithWellContents.value,
        wells: _.values(plateLayout.wellSpecs.value),
    }
}

const transformOligos = async () => {
    const plate = plateLayout.plateWithWellContents.value
    if (!plate || !Array.isArray(plate.wells)) {
        toast.add({severity: 'warn', summary: 'Plate data is not loaded', life: 3000})
        return
    }
    const { data, error } = await useFetch(`/api/custom/plates/${plate.id}/transform-sg-rna-oligos`, {
        method: 'POST',
        body: {},
    })

    if (error.value) {
        if (error.value.data?.statusCode == 401 && error.value.data?.statusMessage == 'TOKEN EXPIRED') {
            showLoginModal()
        } else {
            toast.add({severity: 'error', summary: 'Transformation failed', detail: error.value.data?.message || error.value.message, life: 3000})
        }
    } else {
        // refresh the cloning experiment to reflect updated transformation status
        sgRnaCloningExperiment.value = await $fetch(`/api/sg-rna-cloning-experiments/${route.params.id}`, {
            query: { with: JSON.stringify({ plate: true }) },
        })
        // refresh the plate if transformation was successful
        plateLayout.wellContentsDisplayConfig.value = plamidPlateDisplayConfig

        plateLayout.setExportPlateLayoutConfig({
            columns: sgRnaPlasmidExportColumns,
        })
        await loadPlate()
        experimentPlateDiagramKey.value += 1 // force re-render of the plate diagram

        // resets splitter panel sizes after content has been rendered
        nextTick(() => {
            splitter.value.resetState()
        })
        toast.add({severity: 'success', summary: 'Transformation successful', life: 3000})
    }
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
            const destinationWell = destinationWellsSorted[index]
            return _.map(wellContents, (wellContent) => {
                return {
                    wellId: destinationWell.id,
                    wellableId: wellContent.wellableId,
                    sourceWellIds: [well.id],
                    createdBy: (user.value as User)?.id,
                }
            })
        }))
        await plateLayout.addWellContents(wellContentsToAdd.flat())
    }
}

const plateTableColumnDefs: ColumnDefinitions = {
    plateType: { display: false },
    // snvLibCloningExperimentId: { display: false },
    sgRnaCloningExperimentId: { display: false },
    plateTypeLabel: { header: 'Type' },
    cycleName: { display: false },
    cycleId: { display: false },
    targets: { display: false },
    pcrExperimentId: { display: false},
    plasmidExperimentId: { display: false},
    sizeX: { display: false },
    sizeY: { display: false },
    wellsCount: { display: false },
    wellsWithContentCount: { display: false },
    wellsProcessedCount: { display: false },
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

// for source plates table, only select guide RNA plates that are not associated with an experiment
const whereClause = {
    "and": [
        {"in": [{"var": "plateType"}, ["sg-rna-oligo"]]},
        {"==": [{"var": "sgRnaCloningExperimentId"}, null]},
    ]
}
const sgRnaPlasmidTableFrozenRecordIds = computed(() => {
    return _.compact(_.flatten(_.map(plateLayout.selectedWells.value, 'selectionTableRecordIds')))
})
const sgRnaPlasmidDisplayWithClause = {
    sgRnaPlasmidTargets: {
        with: {
            target: {
                columns: {
                    id: true,
                    name: true,
                }
            }
        },
    },
    wellable: {
        with: {
            wellContents: {
                columns: {
                    id: true,
                },
                with: {
                    well: {
                        columns: {
                            id: true,
                            x: true,
                            y: true,
                            plateId: true,
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
const sgRnaPlasmidTableColumnDefs: ColumnDefinitions = {
    sgRnaPlasmidTargets: {
        format: (data: any) => {
            const targets = _.get(data, 'sgRnaPlasmidTargets', [])
            if (_.isEmpty(targets)) {
                return '-'
            } else {
                return _.map(targets, 'target.name')
            }
        },
        path: 'sgRnaPlasmidTargets.displayValue',
    },
    wellContents: { display: false },
    wellCoordinates: {
        format: (data: any) => {
            return data.wellable?.wellContents?.map((wellContent: any) => {
                return `${wellContent.well?.plate?.name}: ${wellCoordinateToChar(wellContent.well?.y)}${wellContent.well?.x}`
            }).join(', ') || '-'
        },
        path: 'wellCoordinates.displayValue',
    },
}
const setCrudAndPlateLayoutTableRefs = (el: any) => {
    plateLayout.setSelectionTableRef(el)
    crudTable.setTableRef(el)
}
const sgRnaPlasmidFieldConfigs: FormFieldConfigs = {
    targetId: {
        label: 'Target',
        autoCompleter: {
            searchBaseUrl: '/api/targets',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
        readonly: true,
    },
}
const didUpdateRecord = async (record: any) => {
    crudTable.didUpdateRecord(record)
    await loadPlate()
    experimentPlateDiagramKey.value += 1 // force re-render of the plate diagram
}
const didUpdateMultipleRecords = async (record: any) => {
    crudTable.didUpdateMultipleRecords(record)
    await loadPlate()
    experimentPlateDiagramKey.value += 1 // force re-render of the plate diagram
}
</script>
<template>
    <Splitter ref="splitter" :class="smallerThanLg ? 'h-fit mb-8' : 'h-full mb-8'" :layout="smallerThanLg ? 'vertical' : 'horizontal'">
        <SplitterPanel v-if="!transformed" class="overflow-scroll" :size="60">
            <div class="text-2xl font-bold mt-4 ml-4">sgRNA Cloning: {{ sgRnaCloningExperiment?.name }}</div>
            <SmartTable
                :key="selectionTableKey"
                :ref="plateLayout.setSelectionTableRef"
                table-name="view-plates-with-well-counts"
                :zodSchema="schemas.plates.select"
                :can-add="false"
                :can-delete="false"
                :can-edit="false"
                :can-export="false"
                :where="whereClause"
                :column-defs="plateTableColumnDefs"
                :sort-by="['name']"
                :selection-mode="transformed ? undefined : 'single'"
                :show-column-filters="true"
                emptyMessage="">
            </SmartTable>
        </SplitterPanel>
        <SplitterPanel :size="40" :minSize="25">
            <Splitter layout="vertical">
                <SplitterPanel v-if="!transformed" class="flex justify-center overflow-scroll mt-10">
                    <PlateDiagram
                        :ref="sourcePlateLayout?.setPlateDiagramRef"
                        v-if="selectedSourcePlate?.id && sourcePlateWithWellSpecs"
                        v-model="sourcePlateWithWellSpecs"
                        :plateType="sourcePlateWithWellSpecs.plateType"
                        :sizeX="sourcePlateWithWellSpecs.sizeX"
                        :sizeY="sourcePlateWithWellSpecs.sizeY"
                        :showExportButton="true"
                        @well-range-selected="sourcePlateLayout?.wellRangeSelected"
                        @well-selection-cleared="sourcePlateLayout?.wellSelectionCleared"
                        @all-wells-selected="sourcePlateLayout?.selectedAllWells"
                        @well-contents-updated="sourcePlateLayout?.updatedWellContents"
                        @did-click-export-plate-layout="sourcePlateLayout?.exportPlateLayout" >
                        <template #header>
                            {{ sourcePlateWithWellSpecs.name }}
                        </template>
                        <template #button1>
                            <Button
                                severity="secondary"
                                v-tooltip="{value: 'Transfer well contents to PreSeq 3 plate', showDelay: 500}"
                                :disabled="_.isEmpty(sourcePlateLayout?.selectedWells.value)"
                                @click="transferSelectedWellsContents">
                                <template #icon>
                                    <Icon name="ix:move-layer-down" class="m-1" />
                                </template>
                            </Button>
                        </template>
                    </PlateDiagram>
                    <div v-else>
                        <span class="text-gray-500">No source plate selected</span>
                    </div>
                </SplitterPanel>
                <SplitterPanel class="flex justify-center overflow-scroll mt-10">
                    <div class="flex flex-col">
                        <PlateDiagram
                            :key="experimentPlateDiagramKey"
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
                        <Button
                            class="w-fit ml-auto mr-auto mt-4 p-4"
                            v-if="!transformed"
                            icon="pi pi-play"
                            iconPos="right"
                            severity="primary"
                            label="Transform"
                            @click="transformOligos">
                        </Button>
                        <br/>
                    </div>
                </SplitterPanel>
            </Splitter>
        </SplitterPanel>
        <SplitterPanel v-if="transformed && sgRnaCloningExperiment?.plate?.id" class="overflow-scroll" :size="60" :minSize="25">
            <div class="text-2xl font-bold mt-4 ml-4">sgRNA Cloning: {{ sgRnaCloningExperiment?.name }}</div>
            <SmartTable
                :key="selectionTableKey"
                :ref="setCrudAndPlateLayoutTableRefs"
                table-name="sg-rna-plasmids"
                :zodSchema="schemas.sgRnaPlasmids.select"
                :can-add="false"
                :can-delete="false"
                :can-export="false"
                :can-edit-multiple="true"
                :column-defs="sgRnaPlasmidTableColumnDefs"
                :sort-by="['name']"
                :with-clause="sgRnaPlasmidDisplayWithClause"
                :where="{'==': [{'var': 'wellContents.0.well.plateId'}, sgRnaCloningExperiment?.plates?.[0]?.id]}"
                :show-column-filters="true"
                emptyMessage=""
                v-model:frozenRecordIds="sgRnaPlasmidTableFrozenRecordIds"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit" />
        </SplitterPanel>
    </Splitter>
    <Dialog v-model:visible="showSgRnaPlasmidEditDialog" modal header="Edit" class="w-auto" :closable="false">
        <RecordsSmartForm
            v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
            selectUrl="/api/sg-rna-plasmids"
            :recordIds="[crudTable.state.editingRecordId]"
            submitUrl="/api/sg-rna-plasmids"
            submitMethod="PUT"
            :zodSchema="schemas.sgRnaPlasmids.update"
            :can-delete="false"
            :fieldConfigs="sgRnaPlasmidFieldConfigs"
            @cancel="crudTable.didClickCancelEditForm"
            @record-update="didUpdateRecord"
            @record-delete="crudTable.didDeleteRecord"
        />
        <RecordsSmartForm
            v-if="crudTable.state.showMultipleEditForm"
            selectUrl="/api/sg-rna-plasmids"
            :recordIds="crudTable.state.editingMultipleRecordsIds"
            submitUrl="/api/sg-rna-plasmids"
            submitMethod="PUT"
            :zodSchema="schemas.sgRnaPlasmids.update"
            :fieldConfigs="sgRnaPlasmidFieldConfigs"
            @cancel="crudTable.didClickCancelMultipleEditForm"
            @records-update="didUpdateMultipleRecords"
        />
    </Dialog>
</template>
