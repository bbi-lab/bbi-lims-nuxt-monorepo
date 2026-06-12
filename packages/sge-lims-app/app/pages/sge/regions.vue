<script setup lang="ts">
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '#shared/db/zod/zodSchemas'

const router = useRouter()
const crudTable = useCrudTable()

const route = useRoute()
const whereClauses = ref()
const readonlyValues = ref<Record<string, any>>({})
const tableKey = ref<string>(uuidv4())

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const displayWithClause = Object.freeze({
    gene:{
        columns: {id: true, symbol: true, ncbiAccession: true}
    },
    targets: {
        columns: {id: true}
    },
})
const columnDefs: ColumnDefinitions = {
    geneId: {
        header: 'Gene',
        format: (x) => { return `${_.get(x, 'gene.symbol')} (${_.get(x, 'gene.ncbiAccession')})`},
        path: 'geneId.displayValue',
        index: 0,
    },
    snvLibraryStart: {
        header: 'SNV library start'
    },
    snvLibraryEnd: {
        header: 'SNV library end'
    },
    targets: {
        display: false,
    },
}
const rowActions = {
    targets: {
        label: (data: any) => { return `${data.targets?.length || 0}`},
        action: (data: any) => {
            router.push({path:`/sge/targets`, query: {'regionId': data.id}})
        },
        icon: 'pi pi-fw pi-bullseye',
        iconPos: 'right',
        tooltip: 'Targets',
    },
}
const fieldConfigs: FormFieldConfigs = {
    geneId: {
        label: 'Gene',
        autoCompleter: {
            searchBaseUrl: '/api/sge-valid-genes',
            searchFields: ['symbol', 'ncbiAccession'],
            valueField: 'id',
            displayFields: ['symbol', 'ncbiAccession'],
            displayFormat: (x: any) => `${x.symbol} (${x.ncbiAccession})`,
            searchMode: 'simple',
        }
    },
    snvLibraryStart: {
        label: 'SNV library start'
    },
    snvLibraryEnd: {
        label: 'SNV library end'
    },
    targets: {
        display: false,
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="regions"
                :zodSchema="schemas.regions.select"
                title="Regions"
                :where="whereClauses"
                :with-clause="displayWithClause"
                :column-defs="columnDefs"
                :row-actions="rowActions"
                :rows-per-page-options="[10, 25, 50, 100]"
                :can-edit-multiple="true"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/regions"
                submitMethod="POST"
                :zodSchema="schemas.regions.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/regions"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/regions"
                submitMethod="PUT"
                :zodSchema="schemas.regions.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/regions"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/regions"
                submitMethod="PUT"
                :zodSchema="schemas.regions.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
