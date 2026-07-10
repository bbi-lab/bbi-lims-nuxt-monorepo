
<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()
const route = useRoute()

const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, any>>({})

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const columnDefs: ColumnDefinitions = {
    name: {
        index: 0,
    },
    snvLibCloningExperiment: {
        header: 'SNV Library Cloning Experiment',
        type: 'element',
        element: (data: any) => {
            const href = data.snvLibCloningExperiment?.id ? `/snv-lib-cloning-experiments?id=${data.snvLibCloningExperiment?.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${data.snvLibCloningExperiment?.name}</a>` : ''
        },
        exportValue: (data: any) => {
            return _.get(data.snvLibCloningExperiment, 'name', '')
        },
        index: 1,
    },
    snvLibCloningExperimentId: { display: false },
    snvLibAmpProduct: {
        header: 'Associated SNVlib AMP Product',
        type: 'element',
        element: (data: any) => {
            const href = data.snvLibAmpProduct?.id ? `/snv-lib-amp-products?id=${data.snvLibAmpProduct?.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${data.snvLibAmpProduct?.name}</a>` : ''
        },
        exportValue: (data: any) => {
            return _.get(data.snvLibAmpProduct, 'name', '')
        },
        index: 2,
    },
    snvLibAmpProductId: { display: false },
    clonalHa: {
        header: 'Associated SNVlib Clonal HA',
        type: 'element',
        element: (data: any) => {
            const href = data.clonalHa?.id ? `/clonal-has?id=${data.clonalHa?.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${data.clonalHa?.name}</a>` : ''
        },
        exportValue: (data: any) => {
            return _.get(data.clonalHa, 'name', '')
        },
        index: 3,
    },
    clonalHaId: { display: false },
    goldenGateProductVectorAmount: {
        header: 'Golden Gate Product Vector Amount (ng)',
    },
}
// fieldConfigs is computed so we can access crudTable.state.editingRecord and crudTable.state.editingMultipleRecordsIds
// to apply additional logic to certain properties (e.g. readonly, searchWhereClause)
const fieldConfigs: ComputedRef<FormFieldConfigs> = computed(() => {
    return {
        name: {
        },
        snvLibCloningExperimentId: {
            label: 'SNV Library Cloning Experiment',
            autoCompleter: {
                searchBaseUrl: '/api/snv-lib-cloning-experiments',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
                dropdown: true,
            },
        },
        snvLibAmpProductId: {
            label: 'SNVlib AMP Product',
            autoCompleter: {
                searchBaseUrl: '/api/snv-lib-amp-products',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
                dropdown: true,
            },
        },
        clonalHaId: {
            label: 'SNVlib Clonal HA',
            autoCompleter: {
                searchBaseUrl: '/api/clonal-has',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
                dropdown: true,
            },
        }
    }
})
const displayWithClause = {
    snvLibCloningExperiment: {
        columns: {id: true, name: true},
    },
    snvLibAmpProduct: {
        columns: {id: true, name: true},
    },
    clonalHa: {
        columns: {id: true, name: true},
    },
}

</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="snv-lib-golden-gate-products"
                :zodSchema="schemas.snvLibGoldenGateProducts.select"
                title="Clonal DNA products"
                :column-defs="columnDefs"
                :with-clause="displayWithClause"
                :where="whereClauses"
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
                submitUrl="/api/snv-lib-golden-gate-products"
                submitMethod="POST"
                :zodSchema="schemas.snvLibGoldenGateProducts.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/snv-lib-golden-gate-products"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/snv-lib-golden-gate-products"
                submitMethod="PUT"
                :zodSchema="schemas.snvLibGoldenGateProducts.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/snv-lib-golden-gate-products"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/snv-lib-golden-gate-products"
                submitMethod="PUT"
                :zodSchema="schemas.snvLibGoldenGateProducts.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
