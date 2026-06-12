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
    target: {
        path: 'target.name',
        type: 'string',
        index: 1,
    },
    snvLibCloningExperiment: {
        header: 'SNVlib Cloning Experiment',
        type: 'element',
        element: (data: any) => {
            const href = data.snvLibCloningExperiment ? `/sge/snv-lib-cloning-experiments?id=${data.snvLibCloningExperiment.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${data.snvLibCloningExperiment?.name}</a>` : null
        },
        exportValue: (data: any) => {
            return _.get(data, 'snvLibCloningExperiment.name', '')
        },
        index: 1,
    },
    snvLibCloningExperimentId: { display: false},
    volume: {
        header: 'Volume (uL)',
    },
    quant: {
        header: 'Quant (ng/uL)',
    },
    externalLink: {
        format: 'hyperlink',
    },
    targetId: { display: false},
}
const fieldConfigs: FormFieldConfigs = {
    targetId: {
        label: 'Target',
        autoCompleter: {
            searchBaseUrl: '/api/targets',
            searchFields: ['name', 'region.gene.symbol', 'region.name'],
            searchWithClause: {
                region: {columns: {name: true}, with: {gene: {columns: {symbol: true}}}},
            },
            valueField: 'id',
            displayFields: ['name', 'region.gene.symbol', 'region.name'],
        }
    },
    externalLink: {
        type: 'hyperlink',
    },
    snvLibCloningExperimentId: {
        label: 'Experiment',
        autoCompleter: {
            searchBaseUrl: '/api/snv-lib-cloning-experiments',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
        }
    },
    volume: {
        label: 'Volume (uL)',
    },
    quant: {
        label: 'Quant (ng/uL)',
    },
}
const displayWithClause = {
    target: {
        columns: {name: true},
        with: {
            region: {
                columns: {name: true},
                with: {
                    gene: {columns: {symbol: true}}
                }
            }
        }
    },
    snvLibCloningExperiment: {
        columns: {id: true, name: true},
    },
    // wellable: {
    //     with: {
    //         wellContents: {
    //             columns: {id: true, name: true},
    //             with: {
    //                 well: {
    //                     columns: {id: true, name: true},
    //                     with: {
    //                         plate: {
    //                             columns: {id: true, name: true},
    //                         }
    //                     }
    //                 }
    //             }
    //         },
    //     }
    // },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="snv-lib-plasmids"
                :zodSchema="schemas.snvLibPlasmids.select"
                title="SNVlib Plasmids"
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
                submitUrl="/api/snv-lib-plasmids"
                submitMethod="POST"
                :zodSchema="schemas.snvLibPlasmids.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/snv-lib-plasmids"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/snv-lib-plasmids"
                submitMethod="PUT"
                :zodSchema="schemas.snvLibPlasmids.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :can-delete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/snv-lib-plasmids"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/snv-lib-plasmids"
                submitMethod="PUT"
                :zodSchema="schemas.snvLibPlasmids.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
