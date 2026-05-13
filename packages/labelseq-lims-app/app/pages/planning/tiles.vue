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

const columnDefs = {
    tileName: { header: 'Tile Name', index: 0 },
    tileStart: { header: 'Start', index: 1 },
    tileEnd: { header: 'End', index: 2 },
    mutagenesisStart: { header: 'Mutagenesis Start', index: 3 },
    mutagenesisEnd: { header: 'Mutagenesis End', index: 4 },
    superblockFirst: { header: 'First in Superblock', index: 5 },
    superblockLast: { header: 'Last in Superblock', index: 6 },
    superblockId: { display: false },
    superblock: { header: 'Superblock', index: 7, path: 'superblock.name' },
    retrieverPrimerForwardId: { display: false },
    retrieverPrimerReverseId: { display: false },
    retrieverPrimerForward: { header: 'Forward Primer', index: 8, path: 'retrieverPrimerForward.name' },
    retrieverPrimerReverse: { header: 'Reverse Primer', index: 9, path: 'retrieverPrimerReverse.name' },
}

const fieldConfigs: Record<string, FormFieldConfig> = {
    superblockId: {
        label: 'Superblock',
        autoCompleter: {
            searchBaseUrl: '/api/superblocks',
            valueField: 'id',
            displayFields: ['name'],
            searchFields: ['name'],
            dropdown: true,
        },
    },
    retrieverPrimerForwardId: {
        label: 'Forward Primer',
        autoCompleter: {
            searchBaseUrl: '/api/retriever-primers',
            valueField: 'id',
            displayFields: ['name'],
            searchFields: ['name'],
            searchWhereClause: { '==': [{ var: 'direction' }, 'forward'] },
            dropdown: true,
        },
    },
    retrieverPrimerReverseId: {
        label: 'Reverse Primer',
        autoCompleter: {
            searchBaseUrl: '/api/retriever-primers',
            valueField: 'id',
            displayFields: ['name'],
            searchFields: ['name'],
            searchWhereClause: { '==': [{ var: 'direction' }, 'reverse'] },
            dropdown: true,
        },
    },
}

const withClause = {
    superblock: true,
    retrieverPrimerForward: true,
    retrieverPrimerReverse: true,
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="tiles"
                :zodSchema="schemas.tiles.select"
                title="Tiles"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :column-defs="columnDefs"
                :where="whereClauses"
                :withClause="withClause"
                :can-edit-multiple="true"
                :show-column-filters="true"
                :sort-by="['tileName']"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/tiles"
                submitMethod="POST"
                :zodSchema="schemas.tiles.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/tiles"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/tiles"
                submitMethod="PUT"
                :zodSchema="schemas.tiles.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm && crudTable.state.editingMultipleRecordsIds.length > 0"
                selectUrl="/api/tiles"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/tiles"
                submitMethod="PUT"
                :zodSchema="schemas.tiles.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
