<script setup lang="ts">
import { schemas } from '#shared/db/zod/zodSchemas'
import _ from 'lodash'

const tableTitle = ref<string>()
const crudTable = useCrudTable()

const rowActions = {}
const route = useRoute()

onMounted(async() => {
    const experiment = await $fetch(`/api/transfect-experiments/${route.params.id}`, { query: { with: JSON.stringify({cycle: {columns: {name: true}}}) } }) as { cycle: { name: string } }
    tableTitle.value = `${experiment.cycle.name}: Reagents`
})

const columnDefs: ColumnDefinitions = {
    experimentId: {
        display: false,
    },
    lotId: {
        display: false,
    },
    reagent: {
        index: 1,
        path: 'lot.reagent.name',
    },
    lot: {
        header: 'Lot #',
        path: 'lot.lotNumber',
        index: 0,
    },
    concentration: {
        format: (x: any) => `${x.concentration || '--'} ${x?.lot?.reagent?.soluteUnit}/${x?.lot?.reagent?.volumeUnit}`,
        path: 'concentration.displayValue',
        type: 'string',
    },
    volumeUsed: {
        format: (x: any) => `${x.volumeUsed || '--'} ${x?.lot?.reagent?.soluteUnit}/${x?.lot?.reagent?.volumeUnit}`,
        path: 'volumeUsed.displayValue',
        type: 'string',
    }
}

// Generate field configs from column defs to avoid repeating ourselves
const editFormFieldConfigs: FormFieldConfigs = _.mapValues(columnDefs, (v: any, k) => {
    return {
        display: v.display ?? true,
        label: v.header || _.startCase(k),
    }
})
_.set(editFormFieldConfigs, 'concentration.label', (data: any) => data.lot?.reagent ? `Concentration (${data.lot?.reagent?.soluteUnit}/${data?.lot?.reagent?.volumeUnit})` : 'Concentration')
_.set(editFormFieldConfigs, 'volumeUsed.label', (data: any) => data.lot?.reagent ? `Volume Used (${data.lot?.reagent?.soluteUnit}/${data?.lot?.reagent?.volumeUnit})` : 'Volume Used')

// Include an AutoCompleter widget for adding new lot usage
editFormFieldConfigs['lotId'] = {
    label: 'Lot',
    autoCompleter: {
        searchBaseUrl: '/api/lots',
        searchFields: ['lotNumber', 'reagent.name'],
        valueField: 'id',
        displayFormat: (x: any) => `${x.lotNumber}: ${x.reagent.name}`,
        searchWithClause: {reagent: {columns: {name: true}}},
    },
}

const addFormFieldConfigs = _.cloneDeep(editFormFieldConfigs)

const readonlyValues = {experimentId: route.params.id}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="transfect-lot-usage"
                :zodSchema="schemas.transfectLotUsage.select"
                :title="tableTitle"
                :row-actions="rowActions"
                :column-defs="columnDefs"
                :where="{'==':[{'var': 'experimentId'}, route.params.id]}"
                :with-clause="{lot: {columns: {lotNumber: true}, with: {reagent: true}}}"
                :rows-per-page-options="[10, 25, 50, 100]"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/transfect-lot-usage"
                submitMethod="POST"
                :zodSchema="schemas.transfectLotUsage.insert"
                :fieldConfigs="addFormFieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/transfect-lot-usage"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/transfect-lot-usage"
                submitMethod="PUT"
                :zodSchema="schemas.transfectLotUsage.update"
                :can-delete="true"
                :fieldConfigs="editFormFieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
