<script setup lang="ts">
import { schemas } from '#shared/db/zod/zodSchemas'

const router = useRouter()
const crudTable = useCrudTable()

const columnDefs: ColumnDefinitions = {
    startedOn: {
        format: 'date-time'
    },
    endedOn: {
        format: 'date-time'
    },
    transfectExperiments: {
        display: false,
    }
}
const rowActions = {
    targets: {
        header: 'Experiments',
        label: (data: any) => { return `${data.transfectExperiments?.length || 0}`},
        action: (data: any) => {
            router.push({path:'/transfect-experiments', query: {'cycleId': data.id}})
        },
        iconComponent: h(Icon, { name: 'icon-park-solid:experiment', class: 'm-1' }),
        iconPos: 'right',
        tooltip: 'Transfection experiments',
    }
}
const fieldConfigs: FormFieldConfigs = {
    startedOn: {
        inputType: 'date'
    },
    endedOn: {
        inputType: 'date'
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="cycles"
                :zodSchema="schemas.cycles.select"
                title="SGE Cycles"
                :row-actions="rowActions"
                :with-clause="{transfectExperiments: true}"
                :column-defs="columnDefs"
                :can-edit-multiple="true"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/cycles"
                submitMethod="POST"
                :zodSchema="schemas.cycles.insert"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/cycles"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/cycles"
                submitMethod="PUT"
                :zodSchema="schemas.cycles.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/cycles"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/cycles"
                submitMethod="PUT"
                :zodSchema="schemas.cycles.update"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
