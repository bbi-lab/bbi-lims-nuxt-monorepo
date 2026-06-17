
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
    haCloningExperiment: {
        header: 'HA Cloning Experiment',
        type: 'element',
        element: (data: any) => {
            const href = data.haCloningExperiment?.id ? `/sge/ha-cloning-experiments?id=${data.haCloningExperiment?.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${data.haCloningExperiment?.name}</a>` : null
        },
        exportValue: (data: any) => {
            return _.get(data.haCloningExperiment, 'name', '')
        },
        index: 1,
    },
    haPrimers: {
        header: 'HA Primers',
        type: 'element',
        element: (data: any) => {
            return _.compact(_.map([data.haPrimerForward, data.haPrimerReverse], (primer: any) => {
                return primer?.id ? `<span class="${primer?.archived ? 'line-through' : ''}">${primer.name}</span>` : null
            })).join(', ')
        },
        exportValue: (data: any) => {
            return _.compact([data.haPrimerForward?.name, data.haPrimerReverse?.name]).join(', ')
        },
        path: 'haPrimers.displayValue',
        index: 2,
    },
    startPosition: {
        index: 3,
    },
    stopPosition: {
        index: 4,
    },
    length: {
        header: 'Length (bp)',
        format: (data: any) => {
            if (data.startPosition && data.stopPosition) {
                return Math.abs(data.stopPosition - data.startPosition) + 1
            }
            return null
        },
        path: 'length.displayValue',
        index: 5,
    },
    haCloningExperimentId: { display: false },
    haPrimerForwardId: { display: false },
    haPrimerReverseId: { display: false },
    wtHap1DnaConcentration: {
        header: 'WT HAP1 DNA Conc. (ng/µL)',
    },
    temperatureChosen: {
        header: 'Temp. Chosen (°C)',
    },
    performedBy: {
        path: 'performedBy.name'
    },
    performedById: { display: false },
    haPuc19PcrProducts: {
        header: 'HA pUC19 PCR Product',
        type: 'element',
        element: (data: any) => {
            const haPuc19PcrProduct = _.get(data, 'haPuc19PcrProducts.0')
            const href = haPuc19PcrProduct?.id ? `/sge/ha-puc-19-pcr-products?id=${haPuc19PcrProduct?.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">✓</a>` : null
        },
        exportValue: (x: any) => {
            return _.has(x.haPcrProducts, '0.id') ? 'true' : 'false'
        },
    },
}
const fieldConfigs: FormFieldConfigs = {
    name: {
        index: 0,
    },
    haCloningExperimentId: {
        label: 'HA Cloning Experiment',
        autoCompleter: {
            searchBaseUrl: '/api/ha-cloning-experiments',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
        index: 1,
    },
    haPrimerForwardId: {
        label: 'HA Primer Forward',
        autoCompleter: {
            searchBaseUrl: '/api/homology-arm-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            searchWhereClause: {"==": [{"var": "sequenceType"}, "forward"]},
        },
        index: 2,
    },
    haPrimerReverseId: {
        label: 'HA Primer Reverse',
        autoCompleter: {
            searchBaseUrl: '/api/homology-arm-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            searchWhereClause: {"==": [{"var": "sequenceType"}, "reverse"]},
        },
        index: 3,
    },
    wtHap1DnaConcentration: {
        label: 'WT HAP1 DNA Concentration (ng/µL)',
    },
    performedById: {
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        }
    },
}
const displayWithClause = {
    performedBy: {
        columns: {id: true, name: true},
    },
    haCloningExperiment: {
        columns: {id: true, name: true},
    },
    haPrimerForward: {
        columns: {id: true, name: true, archived: true},
    },
    haPrimerReverse: {
        columns: {id: true, name: true, archived: true},
    },
    haPuc19PcrProducts: {
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
                table-name="ha-pcr-products"
                :zodSchema="schemas.haPcrProducts.select"
                title="HA PCR products"
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
                submitUrl="/api/ha-pcr-products"
                submitMethod="POST"
                :zodSchema="schemas.haPcrProducts.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/ha-pcr-products"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/ha-pcr-products"
                submitMethod="PUT"
                :zodSchema="schemas.haPcrProducts.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/ha-pcr-products"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/ha-pcr-products"
                submitMethod="PUT"
                :zodSchema="schemas.haPcrProducts.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
