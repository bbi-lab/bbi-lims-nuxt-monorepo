<script setup lang="ts">
import _, { eq } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '../../shared/db/zod/zodSchemas'
import { restrictionEnzymes } from '~~/shared/db/schema/reagents'

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
    name: { index: 0},
    restrictionEnzymeId: { display: false },
    restrictionEnzyme: { header: 'Restriction Enzyme', index: 1, path: 'restrictionEnzyme.name' },
}
const rowActions = {
}

const fieldConfigs: FormFieldConfigs = {
    restrictionEnzymeId: {
        label: 'Restriction Enzyme',
        autoCompleter: {
            searchBaseUrl: '/api/restriction-enzymes',
            valueField: 'id',
            displayFields: ['name'],
            searchFields: ['name'],
            searchWhereClause: {'in': [{'var': 'name'}, ['SapI', 'PaqCI']]},
            dropdown: true,
        },
    },
}

const withClause = {
    restrictionEnzyme: true,
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="projects"
                :zodSchema="schemas.projects.select"
                title="Projects"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :column-defs="columnDefs"
                :row-actions="rowActions"
                :where="whereClauses"
                :withClause="withClause"
                :can-delete="false"
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
                submitUrl="/api/projects"
                submitMethod="POST"
                :zodSchema="schemas.projects.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/projects"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/projects"
                submitMethod="PUT"
                :zodSchema="schemas.projects.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm && crudTable.state.editingMultipleRecordsIds.length > 0"
                selectUrl="/api/projects"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/projects"
                submitMethod="PUT"
                :zodSchema="schemas.projects.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
