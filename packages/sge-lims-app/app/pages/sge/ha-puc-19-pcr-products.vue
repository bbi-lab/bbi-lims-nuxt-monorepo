
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
            const href = data.haPcrProduct?.haCloningExperiment?.id ? `/sge/ha-cloning-experiments?id=${data.haPcrProduct.haCloningExperiment.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${data.haPcrProduct?.haCloningExperiment?.name}</a>` : null
        },
        exportValue: (data: any) => {
            return _.get(data, 'haPcrProduct.haCloningExperiment.name', '')
        },
        index: 1,
    },
    haPuc19Primers: {
        header: 'HA pUC19 Primers',
        format: (data: any) => {
            return _.compact([data.haPuc19PrimerForward?.name, data.haPuc19PrimerReverse?.name]).join(', ')
        },
        path: 'haPuc19Primers.displayValue',
        index: 2,
    },
    haPcrProductId: { display: false },
    haPuc19PrimerForwardId: { display: false },
    haPuc19PrimerReverseId: { display: false },
    temperatureUsed: {
        header: 'Temp. Used (°C)',
    },
    cleanedBy: {
        path: 'cleanedBy.name'
    },
}
const fieldConfigs: FormFieldConfigs = {
    haPcrProductId: {
        label: 'HA PCR Product',
        autoCompleter: {
            searchBaseUrl: '/api/ha-pcr-products',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    haPuc19PrimerForwardId: {
        label: 'HA pUC19 Primer Forward',
        autoCompleter: {
            searchBaseUrl: '/api/homology-arm-puc-19-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            searchWhereClause: {"==": [{"var": "sequenceType"}, "forward"]},
        },
    },
    haPuc19PrimerReverseId: {
        label: 'HA pUC19 Primer Reverse',
        autoCompleter: {
            searchBaseUrl: '/api/homology-arm-puc-19-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            searchWhereClause: {"==": [{"var": "sequenceType"}, "reverse"]},
        },
    },
    wtHap1DnaConcentration: {
        label: 'WT HAP1 DNA Concentration (ng/µL)',
    },
    cleanedById: {
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
    cleanedBy: {
        columns: {id: true, name: true},
    },
    haPcrProduct: {
        columns: {
            id: true,
            name: true
        },
        with: {
            haCloningExperiment: {
                columns: {id: true, name: true},
            },
        },
    },
    haPuc19PrimerForward: {
        columns: {id: true, name: true},
    },
    haPuc19PrimerReverse: {
        columns: {id: true, name: true},
    },
    wellable: {
        with: {
            wellContents: {
                columns: {id: true, name: true},
                with: {
                    well: {
                        columns: {id: true, name: true},
                        with: {
                            plate: {
                                columns: {id: true, name: true},
                            }
                        }
                    }
                }
            },
        }
    },
}

</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="ha-puc-19-pcr-products"
                :zodSchema="schemas.haPuc19PcrProducts.select"
                title="HA pUC19 PCR products"
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
                submitUrl="/api/ha-puc-19-pcr-products"
                submitMethod="POST"
                :zodSchema="schemas.haPuc19PcrProducts.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/ha-puc-19-pcr-products"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/ha-puc-19-pcr-products"
                submitMethod="PUT"
                :zodSchema="schemas.haPuc19PcrProducts.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/ha-puc-19-pcr-products"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/ha-puc-19-pcr-products"
                submitMethod="PUT"
                :zodSchema="schemas.haPuc19PcrProducts.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
