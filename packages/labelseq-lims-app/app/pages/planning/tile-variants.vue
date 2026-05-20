<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '~~/shared/db/zod/zodSchemas'

const route = useRoute()
const crudTable = useCrudTable()

const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, unknown>>({})

watch(() => route.query, async (newValue, _oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const columnDefs: ColumnDefinitions = {
    id: { display: false },
    tileId: { display: false },
    tile: { header: 'Tile', index: 0, path: 'tile.tileName' },
    aaPosition: { header: 'AA Position', index: 1 },
    aaRef: { header: 'AA Ref', index: 2 },
    aaAlt: { header: 'AA Alt', index: 3 },
    ntPosition: { header: 'NT Position', index: 4 },
    ntRef: { header: 'NT Ref', index: 5 },
    ntAlt: { header: 'NT Alt', index: 6 },
}

const fieldConfigs: FormFieldConfigs = {
    tileId: {
        label: 'Tile',
        autoCompleter: {
            searchBaseUrl: '/api/tiles',
            valueField: 'id',
            displayFields: ['tileName'],
            searchFields: ['tileName'],
            dropdown: true,
        },
    },
    aaPosition: { label: 'AA Position', helpText: 'Relative to tile sequence' },
    aaRef: { label: 'AA Ref' },
    aaAlt: { label: 'AA Alt', helpText: 'Leave blank for deletion' },
    ntPosition: { label: 'NT Position', helpText: 'Relative to tile sequence' },
    ntRef: { label: 'NT Ref' },
    ntAlt: { label: 'NT Alt', helpText: 'Leave blank for deletion' },
}

const withClause = {
    tile: true,
}
</script>

<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="tile-variants"
                :zodSchema="schemas.tileVariants.select"
                title="Tile Variants"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :column-defs="columnDefs"
                :where="whereClauses"
                :withClause="withClause"
                :can-edit-multiple="true"
                :show-column-filters="true"
                :sort-by="['aaPosition']"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/tile-variants"
                submitMethod="POST"
                :zodSchema="schemas.tileVariants.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/tile-variants"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/tile-variants"
                submitMethod="PUT"
                :zodSchema="schemas.tileVariants.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm && crudTable.state.editingMultipleRecordsIds.length > 0"
                selectUrl="/api/tile-variants"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/tile-variants"
                submitMethod="PUT"
                :zodSchema="schemas.tileVariants.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
