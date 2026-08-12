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
    rnaPreseq1PrimerTargets: {
        columns: {},
        with: {
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
                },
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
        }
    }
})

const columnDefs: ColumnDefinitions = {
    name: {
        index: 1
    },
    rnaPreseq1PrimerTargets: {
        header: 'Target(s)',
        format: (x: any) => {
            return _.map(x.rnaPreseq1PrimerTargets, 'target.name')
        },
        path: 'rnaPreseq1PrimerTargets.displayValue',
        index: 2,
        exportValue: (x: any) => {
            return _.map(x.rnaPreseq1PrimerTargets, 'target.name').join(', ')
        },
    },
    projects: {
        header: 'Project(s)',
        format: (x: any) => {
            return _.uniq(_.map(x.rnaPreseq1PrimerTargets, 'target.project.name')).join(', ')
        },
        path: 'projects.displayValue',
        index: 3,
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
    rnaPreseq1PrimerTargets: {
        label: 'Targets',
        inputArray: {
            fieldConfigs: {
                targetId: {
                    label: 'Target',
                    autoCompleter: {
                        searchBaseUrl: `/api/targets`,
                        searchFields: ['name'],
                        valueField: 'id',
                        displayFields: ['name'],
                        dropdown: true,
                    },
                },
            }
        }
    },
}
const formWithClause = {
    rnaPreseq1PrimerTargets: {
        columns: {
            id: true,
            targetId: true,
        },
        with: {
            target: {
                columns: {
                    name: true
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
                table-name="rna-preseq-1-primers"
                :zodSchema="schemas.rnaPreseq1Primers.select"
                title="RNA PreSeq 1 Primers"
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
            >
                <template #header-buttons>
                    <PreseqPrimerImport @imported="tableKey = uuidv4()" />
                </template>
            </SmartTable>
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/rna-preseq-1-primers"
                submitMethod="POST"
                :zodSchema="schemas.rnaPreseq1Primers.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/rna-preseq-1-primers"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/rna-preseq-1-primers"
                submitMethod="PUT"
                :zodSchema="schemas.rnaPreseq1Primers.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :with-clause="formWithClause"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/rna-preseq-1-primers"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/rna-preseq-1-primers"
                submitMethod="PUT"
                :zodSchema="schemas.rnaPreseq1Primers.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
