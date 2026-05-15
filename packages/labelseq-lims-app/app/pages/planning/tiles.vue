<script setup lang="ts">
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { schemas } from '~~/shared/db/zod/zodSchemas'
import type { OligoItem } from '~~/app/utils/oligo-items'

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
    tileName: { header: 'Tile Name', index: 0 },
    tileStart: { display: false },
    tileEnd: { display: false },
    superblockId: { display: false },
    superblock: { header: 'Superblock', index: 1, path: 'superblock.name' },
    tileStartEnd: {
        header: 'Start/end',
        index: 2,
        format: (row) => `${row.tileStart}-${row.tileEnd}`,
        path: 'tileStartEnd.displayValue',
    },
    mutagenesisStart: { display: false },
    mutagenesisEnd: { display: false },
    mutagenesisStartEnd: {
        header: 'Mutagenesis',
        index: 3,
        format: (row) => `${row.mutagenesisStart}-${row.mutagenesisEnd}`,
        path: 'mutagenesisStartEnd.displayValue',
    },
    superblockFirst: { header: 'First tile', index: 4 },
    superblockLast: { header: 'Last tile', index: 5 },
    retrieverPrimerForwardId: { display: false },
    retrieverPrimerReverseId: { display: false },
    retrieverPrimerForward: { header: 'Forward Primer', index: 6, path: 'retrieverPrimerForward.name' },
    retrieverPrimerReverse: { header: 'Reverse Primer', index: 7, path: 'retrieverPrimerReverse.name' },
    fullSequence: { header: 'Full sequence', index: 8, bodyClass: 'max-w-64 truncate' },
    fullSequenceLength: {
        header: 'Full sequence length',
        index: 9,
        format: (row) => row.fullSequence?.length || 0,
        path: 'fullSequenceLength.displayValue',
    },
}

const fieldConfigs: FormFieldConfigs = {
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
    superblockFirst: { label: 'First tile' },
    superblockLast: { label: 'Last tile' },
}

const withClause = {
    superblock: true,
    retrieverPrimerForward: true,
    retrieverPrimerReverse: true,
}

// Extend the update schema with the view-computed fullSequence field so the form renders it.
// Use z.object spread instead of .extend() because schemas are frozen.
// z.readonly() ensures getReadonlyFields() excludes it from submission automatically.
const editFormZodSchema = z.object({
    ...schemas.tiles.update.shape,
    fullSequence: z.string().readonly(),
})

const editFormFieldConfigs: FormFieldConfigs = {
    ...fieldConfigs,
    "fullSequence": { label: 'Full sequence', inputType: 'textarea' },
}

const showOligoViewerDialog = ref(false)
const selectedTile = ref<Record<string, any> | null>(null)

const selectedTileOligoItems = computed<OligoItem[]>(() =>
    selectedTile.value ? buildOligoItems(selectedTile.value) : []
)

const rowActions = {
    viewSequences: {
        action: (data: Record<string, any>) => {
            selectedTile.value = data
            showOligoViewerDialog.value = true
        },
        icon: 'pi pi-eye',
        tooltip: 'View sequences',
        label: '',
    },
}

</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="view-tiles-with-sequences"
                :zodSchema="schemas.tiles.select"
                title="Tiles"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :column-defs="columnDefs"
                :where="whereClauses"
                :withClause="withClause"
                :can-edit-multiple="true"
                :show-column-filters="true"
                :sort-by="['tileName']"
                :row-actions="rowActions"
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
                selectUrl="/api/view-tiles-with-sequences"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/tiles"
                submitMethod="PUT"
                :zodSchema="editFormZodSchema"
                :fieldConfigs="editFormFieldConfigs"
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
    <Dialog
        v-model:visible="showOligoViewerDialog"
        :header="selectedTile?.tileName ?? 'Tile Sequences'"
        modal
        :style="{ width: '60rem', maxWidth: '95vw' }"
        :dismissable-mask="true"
    >
        <OligoViewer
            v-if="selectedTile"
            :data="selectedTileOligoItems"
            :name="selectedTile.tileName"
        />
    </Dialog>
</template>
