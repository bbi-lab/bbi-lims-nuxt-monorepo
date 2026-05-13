<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '~~/shared/db/zod/zodSchemas'

const route = useRoute()
const crudTable = useCrudTable()

const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, unknown>>({})

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const columnDefs: ColumnDefinitions = {
    name: { index: 0 },
    description: { index: 1 },
    seq: { index: 2 },
    projectId: { display: false },
    project: { header: 'Project', index: 3, path: 'project.name' },
}

const fieldConfigs: FormFieldConfigs = {
    projectId: {
        label: 'Project',
        autoCompleter: {
            searchBaseUrl: '/api/projects',
            valueField: 'id',
            displayFields: ['name'],
            searchFields: ['name'],
            dropdown: true,
        },
    },
}

const withClause = {
    project: true,
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="superblocks"
                :zodSchema="schemas.superblocks.select"
                title="Superblocks"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :column-defs="columnDefs"
                :where="whereClauses"
                :withClause="withClause"
                :can-edit-multiple="true"
                :show-column-filters="true"
                :sort-by="['name']"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/superblocks"
                submitMethod="POST"
                :zodSchema="schemas.superblocks.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/superblocks"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/superblocks"
                submitMethod="PUT"
                :zodSchema="schemas.superblocks.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm && crudTable.state.editingMultipleRecordsIds.length > 0"
                selectUrl="/api/superblocks"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/superblocks"
                submitMethod="PUT"
                :zodSchema="schemas.superblocks.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
