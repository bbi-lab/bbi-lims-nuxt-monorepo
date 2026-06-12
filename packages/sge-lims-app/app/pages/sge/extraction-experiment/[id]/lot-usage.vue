<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()
const route = useRoute()

const tableTitle = ref<string>()

onMounted(async() => {
    const experiment = await $fetch(`/api/extraction-experiments/${route.params.id as string}`)
    tableTitle.value = `${experiment.name}: Reagents`
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
        format: (x) => `${x.concentration || '--'} ${x?.lot?.reagent?.soluteUnit}/${x?.lot?.reagent?.volumeUnit}`,
        path: 'concentration.displayValue',
        type: 'string',
    },
    volumeUsed: {
        format: (x) => `${x.volumeUsed || '--'} ${x?.lot?.reagent?.soluteUnit}/${x?.lot?.reagent?.volumeUnit}`,
        path: 'volumeUsed.displayValue',
        type: 'string',
    }
}

// Generate field configs from column defs to avoid repeating ourselves
const fieldConfigs: FormFieldConfigs = _.mapValues(columnDefs, (v, k) => {
    return {
        display: v.display ?? true,
        label: v.header || _.startCase(k),
    }
})
_.set(fieldConfigs, 'concentration.label', (data: any) => data.lot?.reagent ? `Concentration (${data.lot?.reagent?.soluteUnit}/${data?.lot?.reagent?.volumeUnit})` : 'Concentration')
_.set(fieldConfigs, 'volumeUsed.label', (data: any) => data.lot?.reagent ? `Volume Used (${data.lot?.reagent?.soluteUnit}/${data?.lot?.reagent?.volumeUnit})` : 'Volume Used')

// Include an AutoCompleter widget for adding new lots
fieldConfigs['lotId'] = {
    label: 'Lot',
    autoCompleter: {
        searchBaseUrl: '/api/lots',
        searchFields: ['lotNumber', 'reagent.name'],
        valueField: 'id',
        displayFormat: (x: any) => `${x.lotNumber}: ${x.reagent.name}`,
        searchWithClause: {reagent: {columns: {name: true}}},
    },
}

const readonlyValues = {experimentId: route.params.id}

</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="extraction-lot-usage"
                :zodSchema="schemas.extractionLotUsage.select"
                :title="tableTitle"
                :column-defs="columnDefs"
                :where="{'==':[{'var': 'experimentId'}, route.params.id]}"
                :with-clause="{lot: {columns: {lotNumber: true}, with: {reagent: true}}}"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/extraction-lot-usage"
                submitMethod="POST"
                :zodSchema="schemas.extractionLotUsage.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/extraction-lot-usage"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/extraction-lot-usage"
                submitMethod="PUT"
                :zodSchema="schemas.extractionLotUsage.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
