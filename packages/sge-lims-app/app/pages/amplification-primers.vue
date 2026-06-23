<script setup lang="ts">
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
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

const displayWithClause = Object.freeze({
    target: {
        columns: {
            name: true
        },
        with: {
            project: {
                columns: {
                    name: true
                }
            },
            region: {
                columns: {
                    name: true
                },
                with: {
                    gene: {
                        columns: {
                            symbol: true
                        }
                    }
                }
            },
        },
    },
    wellable: {
        with: {
            wellContents: {
                with: {
                    well: {
                        columns: {
                            id: true,
                            x: true,
                            y: true,
                        },
                        with: {
                            plate: {
                                columns: {
                                    id: true,
                                    name: true,
                                    plateType: true,
                                }
                            }
                        }
                    },
                },
            },
        },
    },
})

const columnDefs: ColumnDefinitions = {
    name: {
        index: 1
    },
    cloningMethod: {
        header: 'Cloning Method',
        index: 2,
    },
    targetId: {
        header: 'Target',
        format: (x: any) => {
            return x.target?.name || (x.target?.region ? `${_.get(x, 'target.region.gene.symbol')} : ${_.get(x, 'target.region.name')}` : '')
        },
        path: 'targetId.displayValue',
        type: 'string',
        index: 2,
    },
    project: {
        format: (x: any) => {
            return x.target?.project?.name || ''
        },
        path: 'project.displayValue',
        index: 3,
    },
    wellContents: {
        header: 'Location',
        format: (x: any) => {
            return combinedWellLocations(x) as string
        },
        path: 'wellContents.displayValue',
        type: 'string',
        index: 4,
    },
    sequence: {
        index: 5,
    },
    sequenceType: {
        index: 6,
    },
    ggFwdRevAdapter: {
        header: 'GG Fwd/Rev Adapter',
        format: (x: any) => {
            return x.cloningMethod === 'Golden Gate' ? (x.sequenceType === 'forward' ? 'ATGTCACCTGCCACT' : (x.sequenceType === 'reverse' ? 'CTAGCACCTGCCACA' : '?')) : ''
        },
        path: 'ggFwdRevAdapter.displayValue',
        index: 7,
    },
}

const fieldConfigs: FormFieldConfigs = {
    targetId: {
        label: 'Target',
        autoCompleter: {
            searchBaseUrl: '/api/targets',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
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
                table-name="amplification-primers"
                :zodSchema="schemas.amplificationPrimers.select"
                title="Amplification Primers"
                :with-clause="displayWithClause"
                :where="whereClauses"
                :column-defs="columnDefs"
                :can-edit-multiple="true"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :rows-per-page-options="[10, 25, 50, 100]"
                :row-style="(data: any) => {
                    return data?.archived ? {textDecoration: 'line-through'} : {}
                }"
                sort-field="name"
                :sort-order="1"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/amplification-primers"
                submitMethod="POST"
                :zodSchema="schemas.amplificationPrimers.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/amplification-primers"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/amplification-primers"
                submitMethod="PUT"
                :zodSchema="schemas.amplificationPrimers.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :can-delete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/amplification-primers"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/amplification-primers"
                submitMethod="PUT"
                :zodSchema="schemas.amplificationPrimers.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
