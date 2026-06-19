
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
    linPrimers: {
        header: 'LIN Primers',
        type: 'element',
        element: (data: any) => {
            return _.compact(_.map([data.linPrimerForward, data.linPrimerReverse], (primer: any) => {
                return primer?.id ? `<span class="${primer?.archived ? 'line-through' : ''}">${primer.name}</span>` : null
            })).join(', ')
        },
        exportValue: (data: any) => {
            return _.compact([data.linPrimerForward?.name, data.linPrimerReverse?.name]).join(', ')
        },
        path: 'linPrimers.displayValue',
        index: 2,
    },
    haPuc19PlasmidId: { display: false },
    haPuc19Plasmid: {
        header: 'HA pUC19 Plasmid',
        path: 'haPuc19Plasmid.name',
        index: 3,
    },
    snvLibCloningExperimentId: { display: false },
    linPrimerForwardId: { display: false },
    linPrimerReverseId: { display: false },
    quant: {
        header: 'Quant (ng/µL)',
    },
    dpn1DigestBy: {
        header: 'DpnI Digest By',
        path: 'dpn1DigestBy.name'
    },
    dpn1DigestOn: {
        header: 'DpnI Digest On',
    },
    gelExtractedBy: {
        path: 'gelExtractedBy.name'
    },
    dpn1DigestById: { display: false },
    gelExtractedById: { display: false },
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
        linPrimerForwardId: {
            label: 'LIN Primer Forward',
            autoCompleter: {
                searchBaseUrl: '/api/linlification-primers',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
                searchWhereClause: {"and": [
                    {"==": [{"var": "sequenceType"}, "forward"]},
                    {"==" : [ {"var":"targetId"}, crudTable.state.editingRecord?.snvLibCloningExperiment?.targetId ]},
                ]},
                dropdown: true,
            },
            readonly: !_.isEmpty(crudTable.state.editingMultipleRecordsIds),
        },
        linPrimerReverseId: {
            label: 'LIN Primer Reverse',
            autoCompleter: {
                searchBaseUrl: '/api/linlification-primers',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
                searchWhereClause: {"and": [
                    {"==": [{"var": "sequenceType"}, "reverse"]},
                    {"==" : [ {"var":"targetId"}, crudTable.state.editingRecord?.snvLibCloningExperiment?.targetId ]},
                ]},
                dropdown: true,
            },
            readonly: !_.isEmpty(crudTable.state.editingMultipleRecordsIds),
        },
        quant: {
            label: 'Quant (ng/µL)',
        },
        haPuc19PlasmidId: {
            label: 'HA pUC19 Plasmid',
            autoCompleter: {
                searchBaseUrl: '/api/ha-puc-19-plasmids',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
                dropdown: true,
            },
        },
        dpn1DigestById: {
            autoCompleter: {
                searchBaseUrl: '/api/users',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
                dropdown: true,
            }
        },
        gelExtractedById: {
            autoCompleter: {
                searchBaseUrl: '/api/users',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
                dropdown: true,
            }
        },
    }
})
const displayWithClause = {
    dpn1DigestBy: {
        columns: {id: true, name: true},
    },
    gelExtractedBy: {
        columns: {id: true, name: true},
    },
    snvLibCloningExperiment: {
        columns: {id: true, name: true},
    },
    linPrimerForward: {
        columns: {id: true, name: true, archived: true},
    },
    linPrimerReverse: {
        columns: {id: true, name: true, archived: true},
    },
    haPuc19Plasmid: {
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
                table-name="snv-lib-lin-products"
                :zodSchema="schemas.snvLibLinProducts.select"
                title="LIN products"
                :column-defs="columnDefs"
                :with-clause="displayWithClause"
                :where="whereClauses"
                :can-edit-multiple="true"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                sortField="name"
                :sortOrder="1"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/snv-lib-lin-products"
                submitMethod="POST"
                :zodSchema="schemas.snvLibLinProducts.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/snv-lib-lin-products"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/snv-lib-lin-products"
                submitMethod="PUT"
                :zodSchema="schemas.snvLibLinProducts.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/snv-lib-lin-products"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/snv-lib-lin-products"
                submitMethod="PUT"
                :zodSchema="schemas.snvLibLinProducts.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
