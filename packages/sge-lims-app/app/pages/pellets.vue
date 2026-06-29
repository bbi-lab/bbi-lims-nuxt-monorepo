<script setup lang="ts">
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '#shared/db/zod/zodSchemas'

const route = useRoute()
const router = useRouter()
const crudTable = useCrudTable()
const whereClauses = ref()
const readonlyValues = ref<Record<string, any>>({})
const tableKey = ref()

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const displayWithClause = Object.freeze({
    transfectTarget: {
        columns: {},
        with: {
            target: {
                columns: { id: true, name: true },
                with: {
                    region: {
                        columns: { name: true },
                        with: {
                            gene: { columns: { symbol: true } }
                        }
                    }
                }
            },
            experiment: {
                columns: { id: true },
                with: {
                    cycle: { columns: { name: true } }
                }
            }
        }
    },
    dna: {
        columns: {
            id: true
        },
    },
    rna: {
        columns: {
            id: true
        },
    },
})

const columnDefs: ColumnDefinitions = {
    name: {
        index: 0,
    },
    isBackup: {
        index: 1,
    },
    isCurrent: {
        index: 2,
    },
    dna: {
        header: 'DNA',
        index: 3,
        type: 'element',
        element: (x: any) => {
            const href = _.has(x, 'dna.id') ? `/dna?pelletId=${x.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">✓</a>` : ''
        },
        exportValue: (x: any) => {
            return _.has(x, 'dna.id') ? 'true' : 'false'
        },
    },
    rna: {
        header: 'RNA',
        index: 4,
        type: 'element',
        element: (x: any) => {
            const href = _.has(x, 'rna.id') ? `/rna?pelletId=${x.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">✓</a>` : ''
        },
        exportValue: (x: any) => {
            return _.has(x, 'rna.id') ? 'true' : 'false'
        },
    },
    transfectionExperiment: {
        path: 'transfectTarget.experiment.cycle.name',
        index: 5,
    },
    wellContents: {
        header: 'Location',
        display: false,
    },
    transfectTarget: {
        header: 'Target',
        format: (x: any) => { return _.get(x, 'transfectTarget.target.name') || `${_.get(x, 'transfectTarget.target.region.gene.symbol')} : ${_.get(x, 'transfectTarget.target.region.name')}`},
        path: 'transfectTarget.displayValue',
        type: 'string',
        index: 7,
    },
    transfectTargetId: {
        display: false,
    },
    harvestedById: { display: false },
}
const rowActions = {
    summary: {
        label: '',
        action: (data: any) => {
            router.push({path:`/pellet/summary/${data.id}`})
        },
        icon: 'pi pi-info-circle',
        tooltip: 'Pellet summary',
    }
}
const fieldConfigs: FormFieldConfigs = {
    transfectTargetId: {
        label: 'Target',
        nestedSelect: {
            parentSearchBaseUrl: '/api/transfect-experiments',
            parentValueField: 'id',
            parentDisplayFields: ['cycle.name'],
            parentIftaLabel: 'Experiment',
            parentSearchWithClause: {
                cycle: {columns: {name: true}},
            },

            searchBaseUrl: '/api/transfect-targets',
            valueField: 'id',
            displayFormat: (x:any) => { return x.target?.name ?? `${x.target?.region?.gene?.symbol}:${x.target.region.name}`},
            parentKeyField: 'experimentId',
            searchWithClause: {
                target: {columns: {name: true}, with: {region: {columns: {name: true}, with: {gene: {columns: {symbol: true}}}}}},
            },
        },
        readonly: true,
    },
    extractionExperimentId: {
        label: 'Extraction experiment',
        autoCompleter: {
            searchBaseUrl: '/api/extraction-experiments',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        }
    },
    harvestedOn: {
        readonly: true,
    },
    harvestDay: {
        readonly: true,
    },
}

</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="pellets"
                title="Pellets"
                :zodSchema="schemas.pellets.select"
                :column-defs="columnDefs"
                :row-actions="rowActions"
                :with-clause="displayWithClause"
                :where="whereClauses?.[0]"
                :can-add="false"
                :can-edit-multiple="true"
                :rows-per-page-options="[10, 25, 50, 100]"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/pellets"
                submitMethod="POST"
                :zodSchema="schemas.pellets.insert"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/pellets"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/pellets"
                submitMethod="PUT"
                :zodSchema="schemas.pellets.update"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/pellets"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/pellets"
                submitMethod="PUT"
                :zodSchema="schemas.pellets.update"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
