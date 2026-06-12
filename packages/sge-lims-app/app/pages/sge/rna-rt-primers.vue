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
    gene: {
        columns: {
            id: true,
            symbol: true,
            ncbiAccession: true,
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
        }
    }
})

const columnDefs: ColumnDefinitions = {
    name: {
        index: 1
    },
    geneId: {display: false},
    gene: {
        format: (x: any) => {
            return `${x.gene?.symbol} (${x.gene?.ncbiAccession})`
        },
        path: 'gene.displayValue',
        index: 2,
    },
    wellContents: {
        header: 'Location',
        format: (x: any) => {
            return combinedWellLocations(x) as string
        },
        path: 'wellContents.displayValue',
        type: 'string',
        index: 5,
    },
}

const fieldConfigs: FormFieldConfigs = {
    name: {index: 1},

    geneId: {
        label: 'Gene',
        autoCompleter: {
            searchBaseUrl: `/api/sge-valid-genes`,
            searchFields: ['symbol', 'ncbiAccession'],
            valueField: 'id',
            displayFields: ['symbol', 'ncbiAccession'],
            displayFormat: (x: any) => `${x.symbol} (${x.ncbiAccession})`,
            searchMode: 'simple',
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
                table-name="rna-rt-primers"
                :zodSchema="schemas.rnaRtPrimers.select"
                title="RNA RT Primers"
                :with-clause="displayWithClause"
                :where="whereClauses"
                :column-defs="columnDefs"
                :can-edit-multiple="true"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :rowsPerPageOptions="[10, 25, 50, 100]"
                :rowStyle="(data: any) => {
                    return data?.archived ? {textDecoration: 'line-through'} : {}
                }"
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
                submitUrl="/api/rna-rt-primers"
                submitMethod="POST"
                :zodSchema="schemas.rnaRtPrimers.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/rna-rt-primers"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/rna-rt-primers"
                submitMethod="PUT"
                :zodSchema="schemas.rnaRtPrimers.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/rna-rt-primers"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/rna-rt-primers"
                submitMethod="PUT"
                :zodSchema="schemas.rnaRtPrimers.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
