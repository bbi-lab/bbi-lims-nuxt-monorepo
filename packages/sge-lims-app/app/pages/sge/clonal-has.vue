
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
        index: 1,
    },
    clonalHaTargets: {
        header: 'Targets',
        format: (data: any) => {
            return _.map(data.clonalHaTargets, 'target.name')
        },
        path: 'clonalHaTargets.displayValue',
        index: 2,
    },
    snvLibCloningExperiments: {display: false},
    snvLibGoldenGateProducts: {display: false},

}

const fieldConfigs: FormFieldConfigs = {
    'clonalHaTargets.*': {
        label: 'Targets',
        component: 'InputArray',
        canDelete: true,
        canUpdate: true,
        props: {
            components: [
                {
                    variableField: 'targetId',
                    label: 'Target',
                    component: 'AutoCompleter',
                    componentProps: {
                        searchBaseUrl: '/api/targets',
                        searchFields: ['region.gene.symbol', 'region.name', 'name'],
                        valueField: 'id',
                        inputClass: 'w-64',
                        displayFormat: (x: any) => {
                            return x.name ?? `${x.region?.gene?.symbol}: ${x.region?.name}`
                        },
                        searchWithClause: {region: {columns: {name: true}, with: {gene: {columns: {symbol:true}}}}},
                    },
                },
            ]
        }
    },
    snvLibCloningExperiments: {display: false},
    snvLibGoldenGateProducts: {display: false},
}
const displayWithClause = {
    clonalHaTargets: {
        with: {
            target: {
                columns: {
                    id: true,
                    name: true,
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
                table-name="clonal-has"
                :zodSchema="schemas.clonalHas.select"
                title="Clonal Homology Arms"
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
                submitUrl="/api/clonal-has"
                submitMethod="POST"
                :zodSchema="schemas.clonalHas.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/clonal-has"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/clonal-has"
                submitMethod="PUT"
                :zodSchema="schemas.clonalHas.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :with-clause="{clonalHaTargets: true}"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/clonal-has"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/clonal-has"
                submitMethod="PUT"
                :zodSchema="schemas.clonalHas.update"
                :fieldConfigs="fieldConfigs"
                :with-clause="{clonalHaTargets: true}"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
