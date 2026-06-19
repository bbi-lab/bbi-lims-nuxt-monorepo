<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'
import { wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'

const router = useRouter()
const crudTable = useCrudTable()

const columnDefs: ColumnDefinitions = {
    sequencingRun: {
        format: (data: any) => {
            return data.sequencingRun?.name || ''
        },
        path: 'sequencingRun.displayValue',
        index: 1,
    },
    createdAt: { display: false },
    sequencingRunId: { display: false },
    dnaId: { display: false},
    indexPrimer1Id:  { display: false},
    indexPrimer2Id:  { display: false},
    sourceWellId: { display: false },
    sampleName: {
        header: 'Sample Name',
        format: (data: any) => {
            return data.dna?.pellet?.name || ''
        },
        path: 'sampleName.displayValue',
        index: 2,
    },
    sourcePlate: {
        header: 'Source Plate',
        path: 'sourceWell.plate.name',
        index: 3,
    },
    sourceWell: {
        header: 'Source Well',
        format: (data: any) => {
            return wellCoordinateToChar(data.sourceWell?.y) + data.sourceWell?.x
        },
        path: 'sourceWell.displayValue',
        index: 4,
    },
}
const fieldConfigs: FormFieldConfigs = {
    sequencingRunId: {
        label: 'Sequencing Run',
        autoCompleter: {
            searchBaseUrl: '/api/sequencing-runs',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    dnaId: {
        label: 'Sample name',
        autoCompleter: {
            searchBaseUrl: '/api/dna',
            searchFields: ['pellet.name'],
            valueField: 'id',
            displayFields: ['pellet.name'],
            searchWithClause: {
                pellet: true,
            },
            dropdown: true,
        },
        readonly: true,
    },
    millionReadsRequired: {
        inputType: 'number',
    },
}

const withClause = {
    sequencingRun: true,
    indexPrimer1: true,
    indexPrimer2: true,
    dna: {
        with: {
            pellet: true,
        }
    },
    sourceWell: {
        with: {
            plate: true,
            wellContents: {
                with: {
                    well: {
                        with: {
                            plate: true,
                        }
                    },
                }
            },
        }
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="sequencing-run-samples"
                :zodSchema="schemas.sequencingRunSamples.select"
                title="Internal samples"
                :with-clause="withClause"
                :column-defs="columnDefs"
                :can-edit-multiple="true"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/sequencing-run-samples"
                submitMethod="POST"
                :zodSchema="schemas.sequencingRunSamples.insert"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/sequencing-run-samples"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/sequencing-run-samples"
                submitMethod="PUT"
                :zodSchema="schemas.sequencingRunSamples.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/sequencing-run-samples"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/sequencing-run-samples"
                submitMethod="PUT"
                :zodSchema="schemas.sequencingRunSamples.update"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
