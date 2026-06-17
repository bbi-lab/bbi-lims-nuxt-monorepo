
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
            const href = data.snvLibCloningExperiment?.id ? `/sge/snv-lib-cloning-experiments?id=${data.snvLibCloningExperiment?.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${data.snvLibCloningExperiment?.name}</a>` : ''
        },
        exportValue: (data: any) => {
            return _.get(data.snvLibCloningExperiment, 'name', '')
        },
        index: 1,
    },
    ampPrimers: {
        header: 'AMP Primers',
        type: 'element',
        element: (data: any) => {
            return _.compact(_.map([data.ampPrimerForward, data.ampPrimerReverse], (primer: any) => {
                return primer?.id ? `<span class="${primer?.archived ? 'line-through' : ''}">${primer.name}</span>` : null
            })).join(', ')
        },
        exportValue: (data: any) => {
            return _.compact([data.ampPrimerForward?.name, data.ampPrimerReverse?.name]).join(', ')
        },
        path: 'ampPrimers.displayValue',
        index: 2,
    },
    sgeOligoId: { display: false },
    sgeOligo: {
        header: 'SGE Oligo',
        path: 'sgeOligo.name',
        index: 3,
    },
    lots: {
        header: 'Lot(s)',
        format: (data: any) => {
            return _.join(_.compact(_.map(data.sgeOligo?.sgeOligoLots, (sgeOligoLot: any) => sgeOligoLot.lot?.lotNumber)), ', ')
        },
        path: 'lots.displayValue',
        index: 4,
    },
    startPosition: {
        index: 5,
    },
    stopPosition: {
        index: 6,
    },
    length: {
        header: 'Length (bp)',
        format: (data: any) => {
            if (data.startPosition && data.stopPosition) {
                return _.toString(Math.abs(data.stopPosition - data.startPosition) + 1)
            } else {
                return ''
            }
        },
        path: 'length.displayValue',
        index: 7,
    },
    snvLibCloningExperimentId: { display: false },
    ampPrimerForwardId: { display: false },
    ampPrimerReverseId: { display: false },
    quant: {
        header: 'Quant (ng/µL)',
    },
    cleanedBy: {
        path: 'cleanedBy.name'
    },
    cleanedById: { display: false },
}
// fieldConfigs is computed so we can access crudTable.state.editingRecord and crudTable.state.editingMultipleRecordsIds
// to apply additional logic to certain properties (e.g. readonly, searchWhereClause)
const fieldConfigs: ComputedRef<FormFieldConfigs> = computed(() => {
    return {
        name: {
            index: 0,
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
            index: 1,
        },
        ampPrimerForwardId: {
            label: 'AMP Primer Forward',
            autoCompleter: {
                searchBaseUrl: '/api/amplification-primers',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
                searchWhereClause: {"and": [
                    {"==": [{"var": "sequenceType"}, "forward"]},
                    {"==" : [ {"var":"targetId"}, crudTable.state.editingRecord?.snvLibCloningExperiment?.targetId ]},
                    {"==" : [ {"var":"cloningMethod"}, crudTable.state.editingRecord?.snvLibCloningExperiment?.cloningStrategy ]},
                ]},
                dropdown: true,
            },
            readonly: !_.isEmpty(crudTable.state.editingMultipleRecordsIds),
            index: 2,
        },
        ampPrimerReverseId: {
            label: 'AMP Primer Reverse',
            autoCompleter: {
                searchBaseUrl: '/api/amplification-primers',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
                searchWhereClause: {"and": [
                    {"==": [{"var": "sequenceType"}, "reverse"]},
                    {"==" : [ {"var":"targetId"}, crudTable.state.editingRecord?.snvLibCloningExperiment?.targetId] },
                    {"==" : [ {"var":"cloningMethod"}, crudTable.state.editingRecord?.snvLibCloningExperiment?.cloningStrategy ]},
                ]},
                dropdown: true,
            },
            readonly: !_.isEmpty(crudTable.state.editingMultipleRecordsIds),
            index: 3,
        },
        quant: {
            label: 'Quant (ng/µL)',
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
        sgeOligoId: {
            label: 'SGE Oligo',
            autoCompleter: {
                searchBaseUrl: '/api/sge-oligos',
                searchFields: ['name'],
                valueField: 'id',
                displayFields: ['name'],
                dropdown: true,
                searchWhereClause: {"==" : [ {"var":"targetId"}, crudTable.state.editingRecord?.snvLibCloningExperiment?.targetId] },
            },
        },
    }
})
const displayWithClause = {
    cleanedBy: {
        columns: {id: true, name: true},
    },
    snvLibCloningExperiment: {
        columns: {id: true, name: true, targetId: true, cloningStrategy: true},
    },
    ampPrimerForward: {
        columns: {id: true, name: true, archived: true},
    },
    ampPrimerReverse: {
        columns: {id: true, name: true, archived: true},
    },
    sgeOligo: {
        columns: {id: true, name: true},
        with: {
            sgeOligoLots: {
                with: {
                    lot: {
                        columns: {id: true, lotNumber: true},
                    },
                },
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
                table-name="snv-lib-amp-products"
                :zodSchema="schemas.snvLibAmpProducts.select"
                title="AMP products"
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
                submitUrl="/api/snv-lib-amp-products"
                submitMethod="POST"
                :zodSchema="schemas.snvLibAmpProducts.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/snv-lib-amp-products"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/snv-lib-amp-products"
                submitMethod="PUT"
                :zodSchema="schemas.snvLibAmpProducts.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/snv-lib-amp-products"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/snv-lib-amp-products"
                submitMethod="PUT"
                :zodSchema="schemas.snvLibAmpProducts.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
