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
    transcriptId: { header: 'RefSeq Transcript ID', index: 0 },
    geneId: { display: false },
    gene: { header: 'Gene', index: 1, path: 'gene.symbol' },
    geneType: { index: 2 },
    description: { header: 'Description', index: 3 },
    cds: { header: 'CDS', index: 4, bodyClass: 'max-w-64', truncatable: true },
    cdsLength: { header: 'Length', index: 5, format: (row) => row.cds?.length ?? 0, path: 'cdsLength.displayValue' },
    aa: { header: 'AA', index: 6, bodyClass: 'max-w-64', truncatable: true },
    aaLength: { header: 'AA Length', index: 7, format: (row) => row.aa?.length ?? 0, path: 'aaLength.displayValue'  },
    notes: { header: 'Notes', index: 8 },
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
    description: {
        inputType: 'textarea',
    },
    cds: {
        inputType: 'textarea',
        label: 'CDS',
    },
    aa: {
        inputType: 'textarea',
        label: 'AA',
    },
    notes: {
        inputType: 'textarea',
        label: 'Notes',
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
