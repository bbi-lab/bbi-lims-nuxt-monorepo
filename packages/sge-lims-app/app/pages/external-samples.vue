<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()
const toast = useToast()
const importDialogVisible = ref(false)

const submitExternalSamples = async (data: any[]) => {
    try {
        const filteredData = _.filter(data, (item) => {
            return !_.includes(_.toLower(item.description || ''), 'sample row')
        })
        if (_.isEmpty(filteredData)) {
            toast.add({ severity: 'warn', summary: 'No records found', life: 5000 })
            return
        }
        const response: { samples: { id: string }[]; insertedCount: number } = await $fetch('/api/custom/external-samples/import', {
            method: 'POST',
            body: filteredData,
        })
        crudTable.didAddRecords(response.samples)
        toast.add({ severity: 'success', summary: 'Success', detail: `Successfully imported ${response.insertedCount} External Samples.`, life: 5000 })
        importDialogVisible.value = false
    } catch (error: any) {
        const userMessage = _.isArray(error?.data?.data) ? convertErrorDataToUserMessage(error.data.data) : error.statusMessage ?? 'An unexpected error occurred during import. Please try again.'
        toast.add({ severity: 'error', summary: 'Error', detail: userMessage, life: 5000 })
    }
}

const importExternalSamples = (event: any) => {
    try {
        fileToSheet(event.files[0], submitExternalSamples)
    } catch (error) {
        console.error('Error importing External Samples:', error)
    }
}

const columnDefs: ColumnDefinitions = {
    wellContents: { display: false },
    sequencingRuns: { display: false },
    createdAt: { display: false },
    createdBy: { display: false },
    indexPrimer1Id: { display: false },
    indexPrimer2Id: { display: false },
    customIndexSeq1: {
        header: 'Custom Index Sequence 1'
    },
    customIndexSeq2: {
        header: 'Custom Index Sequence 2'
    },
    indexPrimer1: {
        header: 'Index Primer 1',
        format: (x: any) => x.indexPrimer1 ? `${x.indexPrimer1.indexSequence} (${x.indexPrimer1.primerType})` : '',
        path: 'indexPrimer1.displayValue',
    },
    indexPrimer2: {
        header: 'Index Primer 2',
        format: (x: any) => x.indexPrimer2 ? `${x.indexPrimer2.indexSequence} (${x.indexPrimer2.primerType})` : '',
        path: 'indexPrimer2.displayValue',
    },
}

const fieldConfigs: FormFieldConfigs = {
    customIndexSeq1: {
        label: 'Custom Index Sequence 1'
    },
    customIndexSeq2: {
        label: 'Custom Index Sequence 2'
    },
    indexPrimer1Id: {
        label: 'Index Primer 1',
        autoCompleter: {
            searchBaseUrl: '/api/index-primers',
            searchFields: ['name', 'indexSequence'],
            valueField: 'id',
            inputClass: 'w-80',
            displayFormat: (x: any) => `${x.name}: ${x.indexSequence} (${x.primerType})`,
        }
    },
    indexPrimer2Id: {
        label: 'Index Primer 2',
        autoCompleter: {
            searchBaseUrl: '/api/index-primers',
            searchFields: ['name', 'indexSequence'],
            valueField: 'id',
            inputClass: 'w-80',
            displayFormat: (x: any) => `${x.name}: ${x.indexSequence} (${x.primerType})`,
        }
    },
}

const withClause = {
    sequencingRuns: true,
    indexPrimer1: true,
    indexPrimer2: true,
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="external-samples"
                :zodSchema="schemas.externalSamples.select"
                title="External samples"
                :with-clause="withClause"
                :column-defs="columnDefs"
                :can-edit-multiple="true"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :rows-per-page-options="[10, 25, 50, 100]"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            >
                <template #header-buttons>
                    <Button
                        v-if="!crudTable.state.showAddForm && !crudTable.state.showEditForm && !crudTable.state.showMultipleEditForm"
                        label="Import"
                        icon="pi pi-file-import"
                        @click="importDialogVisible = true"
                    />
                </template>
            </SmartTable>
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/external-samples"
                submitMethod="POST"
                :zodSchema="schemas.externalSamples.insert"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/external-samples"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/external-samples"
                submitMethod="PUT"
                :zodSchema="schemas.externalSamples.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/external-samples"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/external-samples"
                submitMethod="PUT"
                :zodSchema="schemas.externalSamples.update"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
    <Dialog v-model:visible="importDialogVisible" modal :closable="false" :style="{ width: '35rem' }">
        <slot name="closebutton">
            <div class="flex justify-end">
                <Button icon="pi pi-times" class="p-button-rounded p-button-text p-button-plain ml-auto mr-0" @click="importDialogVisible = false" />
            </div>
        </slot>
        <slot name="header">
            <span class="flex justify-center mt-3 font-bold">Import External Samples</span>
        </slot>
        <a href="/templates/external_samples_import_template.xlsx" download class="flex justify-center mt-3 mb-2 text-primary">Download template</a>
        <div class="flex justify-center">
            <FileUpload
                mode="basic"
                accept="application/msexcel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                class="p-button-info"
                :maxFileSize="1000000"
                :customUpload="true"
                :auto="true"
                @uploader="importExternalSamples"
                chooseLabel="Upload"
            >
                <template #chooseicon>
                    <i class="pi pi-upload"></i>
                </template>
            </FileUpload>
        </div>
    </Dialog>
</template>
