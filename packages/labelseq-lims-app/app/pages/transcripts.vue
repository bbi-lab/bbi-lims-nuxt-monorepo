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
    transcriptId: { header: 'RefSeq Transcript ID', index: 0 },
    geneId: { display: false },
    gene: { header: 'Gene', index: 1, path: 'gene.symbol' },
    seq: { header: 'Sequence', index: 2, bodyClass: 'max-w-64 truncate' },
}

const fieldConfigs: FormFieldConfigs = {
    transcriptId: {
        label: 'RefSeq transcript ID',
    },
    geneId: {
        label: 'Gene',
        autoCompleter: {
            searchBaseUrl: '/api/genes',
            valueField: 'id',
            displayFields: ['symbol'],
            searchFields: ['symbol'],
        },
    },
    seq: {
        inputType: 'textarea',
        label: 'Sequence',
    },
}
const withClause = {
    gene: true,
}
</script>
<template>
<Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="refseq-transcripts"
                :zodSchema="schemas.refseqTranscripts.select"
                title="RefSeq Transcripts"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :column-defs="columnDefs"
                :where="whereClauses"
                :with-clause="withClause"
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
                submitUrl="/api/refseq-transcripts"
                submitMethod="POST"
                :zodSchema="schemas.refseqTranscripts.insert"
                :readonlyValues="readonlyValues"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/refseq-transcripts"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/refseq-transcripts"
                submitMethod="PUT"
                :zodSchema="schemas.refseqTranscripts.update"
                :readonlyValues="readonlyValues"
                :canDelete="true"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
