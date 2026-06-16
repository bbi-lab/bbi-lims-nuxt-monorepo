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
    haPuc19GibsonProductId: { display: false },
    eColiStellarVolume: {
        header: 'E. coli Stellar Volume (µL)',
    },
    haCloningExperiment: {
        header: 'HA Cloning Experiment',
        type: 'element',
        element: (data: any) => {
            const href = data.haPuc19GibsonProduct?.haPuc19PcrProduct?.haPcrProduct?.haCloningExperiment?.id ? `/sge/ha-cloning-experiments?id=${data.haPuc19GibsonProduct.haPuc19PcrProduct.haPcrProduct.haCloningExperiment.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${data.haPuc19GibsonProduct?.haPuc19PcrProduct?.haPcrProduct?.haCloningExperiment?.name}</a>` : null
        },
        exportValue: (data: any) => {
            return _.get(data, 'haPuc19GibsonProduct.haPuc19PcrProduct.haPcrProduct.haCloningExperiment.name', '')
        },
        index: 1,
    },
    // haPuc19Primers: {
    //     header: 'HA pUC19 Primers',
    //     format: (data: any) => {
    //         return _.compact([data.haPuc19PrimerForward?.name, data.haPuc19PrimerReverse?.name ]).join(', ')
    //     },
    //     path: 'haPuc19Primers.displayValue',
    //     index: 2,
    // },
    // haPcrProductId: { display: false },
    // haPuc19PrimerForwardId: { display: false },
    // haPuc19PrimerReverseId: { display: false },
    // temperatureUsed: {
    //     header: 'Temp. Used (°C)',
    // },
    transformedBy: {
        path: 'transformedBy.name'
    },
    colonyPickedBy: {
        path: 'colonyPickedBy.name'
    },
    preppedBy: {
        path: 'preppedBy.name'
    },
}
const fieldConfigs: FormFieldConfigs = {
    haPuc19GibsonProductId: {
        label: 'HA pUC19 Gibson Product',
        autoCompleter: {
            searchBaseUrl: '/api/ha-puc-19-gibson-products',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
        index: 1,
    },
    eColiStellarVolume: {
        label: 'E. coli Stellar Volume (µL)',
        props: {
            defaultValue: 20,
        }
    },
    transformedById: {
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        }
    },
    preppedById: {
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        }
    },
    colonyPickedById: {
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
    transformedBy: {
        columns: {id: true, name: true},
    },
    colonyPickedBy: {
        columns: {id: true, name: true},
    },
    preppedBy: {
        columns: {id: true, name: true},
    },
    haPuc19GibsonProduct: {
        columns: {id: true, name: true},
        with: {
            haPuc19PcrProduct: {
                columns: {id: true, name: true},
                with: {
                    haPcrProduct: {
                        columns: {id: true, name: true},
                        with: {
                            haCloningExperiment: {
                                columns: {id: true, name: true},
                            },
                        }
                    },
                },
            },
        },
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="ha-puc-19-plasmids"
                :zodSchema="schemas.haPuc19Plasmids.select"
                title="HA pUC19 Plasmids"
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
                submitUrl="/api/ha-puc-19-plasmids"
                submitMethod="POST"
                :zodSchema="schemas.haPuc19Plasmids.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/ha-puc-19-plasmids"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/ha-puc-19-plasmids"
                submitMethod="PUT"
                :zodSchema="schemas.haPuc19Plasmids.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :can-delete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/ha-puc-19-plasmids"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/ha-puc-19-plasmids"
                submitMethod="PUT"
                :zodSchema="schemas.haPuc19Plasmids.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
