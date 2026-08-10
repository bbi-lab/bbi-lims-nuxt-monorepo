<script setup lang="ts">
import _ from 'lodash'
import type { SgRnaOligo } from '#shared/db/schema/oligos'
import { getWellTextColor, wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'
import { schemas } from '#shared/db/zod/zodSchemas'

const { breakpoints } = useLayout()
const route = useRoute()
const plateLayout = usePlateLayout<{ sgRnaOligo: SgRnaOligo | null }>()
const config = useRuntimeConfig()
const toast = useToast()

const smallerThanLg = breakpoints.smaller('lg')
const plateWithWellSpecs = ref()
const plateDiagramKey = ref(0)
const importDialogVisible = ref(false)

onMounted(async() => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: ['sgRnaOligo.id'],
        selectionTableRecordIdPaths: ['sgRnaOligo.id'],
        tooltip: (well: any) => {
            const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
            const oligos = _.map(well.wellContents, 'wellable.sgRnaOligo')
            return oligos ? `${wellCoordinate}:<br>` + _.map(oligos, (x) => `${x.name}<br>${x.sequence}`).join('<br>') : wellCoordinate
        },
        symbol: (well: any) => {
            const oligos = _.compact(_.map(well.wellContents, 'sgRnaOligo'))
            return oligos ? _.size(oligos) : ''
        },
    }
    loadPlate()
})

const loadPlate = async () => {
    await plateLayout.loadPlate(
        {
            sgRnaOligo: true,
        },
    )

    plateWithWellSpecs.value = {
        ...plateLayout.plateWithWellContents.value,
        wells: _.values(plateLayout.wellSpecs.value),
    }
}

const importSgRnaOligos = (e: any) => {
    try {
        const files = e.files
        const f = files[0]

        fileToSheet(f, submitSgRnaOligos)
    } catch (error) {
        console.error('Error importing sgRNA oligos:', error)
    }
}

const submitSgRnaOligos = async (data: any[]) => {
    try {
        // remove items with "Sample row" in the notes field as these are template row
        const filteredData = _.filter(data, (item) => {
            return _.toLower(item.notes) !== 'sample row'
        })
        if (_.isEmpty(filteredData)) {
            toast.add({ severity: 'warn', summary: 'No records found', life: 5000 })
            return
        }

        const result = await $fetch(`${config.public.apiBase}/custom/plates/${route.params.id}/import-sg-rna-oligos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: filteredData,
        })
        if (!_.isEmpty(result)) {
            toast.add({
                severity: 'success',
                summary: 'sgRNA oligos imported',
                life: 3000,
            })
            plateLayout.selectionTableRef.value.addOrRefreshRecordIds(_.map(result as any[], 'id'))
            await loadPlate()
            // force a re-render of the plate diagram
            plateDiagramKey.value += 1
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error importing sgRNA oligos',
                life: 3000,
            })
        }
    } catch (error: any) {
        // 401s open the login modal via the global auth-fetch interceptor; only surface other errors.
        if (error.data?.statusCode !== 401) {
            const userMessage =  _.isArray(error?.data?.data) ? convertErrorDataToUserMessage(error.data.data) : error.statusMessage ?? 'An unexpected error occurred during import. Please try again.'
            toast.add({ severity: 'error', summary: 'Error', detail: userMessage, life: 5000 })
        }
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
    },
    sgRnaOligoTargets: {
        with: {
            target: {
                columns: {
                    name: true,
                },
            },
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
            </span>` : ''
        },
        searchable: false,
        exportable: false,
    },
    direction: { display: false },
    kit: {display: false},
    name: {
        index: 1,
    },
    sgRnaOligoTargets: {
        header: 'Target(s)',
        format: (x: any) => {
            return _.map(x.sgRnaOligoTargets, (sgRnaOligoTarget: any) => {
                return sgRnaOligoTarget.target.name
            })
        },
        path: 'sgRnaOligoTargets.displayValue',
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
const frozenRecordIds = computed(() => {
    return _.compact(_.flatten(_.map(plateLayout.selectedWells.value, 'selectionTableRecordIds')))
})
</script>
<template>
    <Splitter class="h-full mb-8" :layout="smallerThanLg ? 'vertical' : 'horizontal'">
        <SplitterPanel class="overflow-scroll" :size="60">
            <SmartTable
                :ref="plateLayout.setSelectionTableRef"
                tableName="sg-rna-oligos"
                :zodSchema="schemas.sgRnaOligos.select"
                :canAdd="false"
                :canEdit="false"
                :canExport="true"
                :withClause="displayWithClause"
                :columnDefs="columnDefs"
                :sortBy="['wellContents.displayValue']"
                :showColumnFilters="true"
                :rowActions="rowActions"
                :rowsPerPageOptions="[10, 25, 50, 100]"
                emptyMessage=""
                v-model:frozenRecordIds="frozenRecordIds"
            />
        </SplitterPanel>
        <SplitterPanel class="flex justify-center overflow-scroll mt-10" :size="40" :minSize="25">
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
                        class="p-button-info"
                        icon="pi pi-upload"
                        v-tooltip="{value: 'Import sgRNA oligos', showDelay: 500}"
                        @click="importDialogVisible = true" />
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
    <Dialog v-model:visible="importDialogVisible" modal :closable="false" :style="{ width: '35' }">
        <slot name="closebutton">
            <div class="flex justify-end">
                 <Button icon="pi pi-times" class="p-button-rounded p-button-text p-button-plain ml-auto mr-0" @click="importDialogVisible = false" />
            </div>
        </slot>
        <slot name="header">
            <span class="flex justify-center mt-3 font-bold">Import sgRNA Oligos</span>
        </slot>
        <a href="/templates/sg_rna_oligo_plate_import_template.xlsx" download class="flex justify-center mt-3 mb-5 text-primary">Download template</a>
        <FileUpload
            mode="basic"
            accept="application/msexcel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
            class="p-button-info"
            :maxFileSize="1000000"
            :customUpload="true"
            :auto="true"
            @uploader="importSgRnaOligos"
            chooseLabel="Upload"
            v-tooltip="{value: 'Upload sgRNA oligos', showDelay: 500}"
        >
            <template #chooseicon>
                <i class="pi pi-upload"></i>
            </template>
            <template #uploadicon>
                <i class="pi pi-upload"></i>
            </template>
        </FileUpload>
    </Dialog>
</template>
