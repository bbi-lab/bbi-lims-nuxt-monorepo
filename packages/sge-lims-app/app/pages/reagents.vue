<script setup lang="ts">
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()

const rowActions = {}

const columnDefs: ColumnDefinitions = {
    name: {
        index: 0,
    },
    concentrationUnit: {
        format: ({soluteUnit, volumeUnit}: {soluteUnit: string, volumeUnit: string}) => { return soluteUnit && volumeUnit ? `${soluteUnit}/${volumeUnit}` : ''},
        path: 'concentrationUnit.displayValue',
        type: 'string',
        index: 1,
    },
    soluteUnit: {
        display: false,
    },
    volumeUnit: {
        display: false,
    }
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="reagents"
                :zodSchema="schemas.reagents.select"
                title="Reagents"
                :column-defs="columnDefs"
                :row-actions="rowActions"
                :rows-per-page-options="[10, 25, 50, 100]"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/reagents"
                submitMethod="POST"
                :zodSchema="schemas.reagents.insert"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/reagents"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/reagents"
                submitMethod="PUT"
                :zodSchema="schemas.reagents.update"
                :can-delete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
