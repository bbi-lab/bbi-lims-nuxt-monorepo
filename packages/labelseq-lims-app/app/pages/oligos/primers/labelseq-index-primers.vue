<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '#shared/db/zod/zodSchemas'

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
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="labelseq-index-primers"
                :zodSchema="schemas.labelseqIndexPrimers.select"
                title="LABEL-seq Index Primers"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :column-defs="columnDefs"
                :where="whereClauses"
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
                submitUrl="/api/labelseq-index-primers"
                submitMethod="POST"
                :zodSchema="schemas.labelseqIndexPrimers.insert"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/labelseq-index-primers"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/labelseq-index-primers"
                submitMethod="PUT"
                :zodSchema="schemas.labelseqIndexPrimers.update"
                :readonlyValues="readonlyValues"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm && crudTable.state.editingMultipleRecordsIds.length > 0"
                selectUrl="/api/labelseq-index-primers"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/labelseq-index-primers"
                submitMethod="PUT"
                :zodSchema="schemas.labelseqIndexPrimers.update"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
