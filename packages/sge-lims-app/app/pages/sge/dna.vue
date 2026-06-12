
<script setup lang="ts">
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '#shared/db/zod/zodSchemas'

const route = useRoute()
const crudTable = useCrudTable()
const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, any>>({})

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const displayWithClause = Object.freeze({
    extractionExperiment: {
        columns: {name: true}
    },
    pellet: {
        columns: {id: true, name: true, isBackup: true},
    },
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
})
const columnDefs: ColumnDefinitions = {
    pellet: {
        index: 1,
        type: 'element',
        element: (x: any) => {
            const href = `/sge/pellets?id=${x.pellet.id}`
            return `<a href="${href}" class="text-blue-500 hover:underline">${x.pellet.name}</a>`
        },
        elementSearchText: (x: any) => {
            return x.pellet.name
        },
        exportValue: (x: any) => {
            return x.pellet.name
        },
    },
    pelletIsBackup: {
        path: 'pelletIsBackup.displayValue',
        header: 'Backup pellet',
        type: 'bool',
        format: (data: any) => {
            return data.pellet?.isBackup ? '✓' : ''
        },

        index: 2,
    },
    extractionExperiment: {
        path: 'extractionExperiment.name',
        index: 3,
    },
    wellContents: {
        header: 'Location',
        format: (x: any) => {
            return combinedWellLocations(x) as string
        },
        path: 'wellContents.displayValue',
        type: 'string',
        index: 4,
    },
    protocol: {
        index: 5,
    },
    extractionExperimentId: {
        display: false
    },
    pelletId: {
        display: false
    },
    concentration: {
        header: 'Concentration (ng/μL)',
        index: 6,
    },
    volume: {
        header: 'Volume (μL)',
        index: 7,
    },
    yield: {
        header: 'Yield (μg)',
        format: (x: any) => {
            return calculateYield(x.concentration, x.volume) || ''
        },
        path: 'yield.displayValue',
        index: 8,
    },
}
const fieldConfigs: FormFieldConfigs = {
    extractionExperimentId: {
        label: 'Experiment',
        autoCompleter: {
            searchBaseUrl: '/api/extraction-experiments',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
        }
    },
    pelletId: {
        label: 'Pellet',
        autoCompleter: {
            searchBaseUrl: '/api/pellets',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name', 'isBackup'],
            displayFormat: (x: any) => x.isBackup ? `${x.name} (backup)` : x.name,
            inputClass: 'w-80',
        }
    },
    concentration: {
        label: 'Concentration (ng/μL)',
    },
    volume: {
        label: 'Volume (μL)',
        subtext: (record) => {
            return `Yield: ${calculateYield(record.concentration, record.volume) || '-' } µg`
        }
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="dna"
                :zodSchema="schemas.dna.select"
                title="DNA"
                :column-defs="columnDefs"
                :where="whereClauses"
                :with-clause="displayWithClause"
                :can-edit-multiple="true"
                :rows-per-page-options="[10, 25, 50, 100]"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/dna"
                submitMethod="POST"
                :zodSchema="schemas.dna.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/dna"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/dna"
                submitMethod="PUT"
                :zodSchema="schemas.dna.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/dna"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/dna"
                submitMethod="PUT"
                :zodSchema="schemas.dna.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
