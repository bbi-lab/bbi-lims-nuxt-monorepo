<script setup lang="ts">
import { schemas } from '#shared/db/zod/zodSchemas'

const router = useRouter()
const crudTable = useCrudTable()

const columnDefs: ColumnDefinitions = {
    startedOn: {
        format: 'date'
    },
    targets: {
        display: false,
    }
}
const rowActions = {
    targets: {
        header: 'Targets',
        label: (data: any) => { return `${data.targets?.length || 0}`},
        action: (data: any) => {
            router.push({path:'/targets', query: {'projectId': data.id}})
        },
        icon: 'pi pi-fw pi-bullseye',
        iconPos: 'right',
        tooltip: 'Targets',
    }
}
const fieldConfigs: FormFieldConfigs = {
    startedOn: {
        inputType: 'date',
    }
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="projects"
                :zodSchema="schemas.projects.select"
                title="SGE Projects"
                :row-actions="rowActions"
                :column-defs="columnDefs"
                :with-clause="{targets: true}"
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
                submitUrl="/api/projects"
                submitMethod="POST"
                :zodSchema="schemas.projects.insert"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/projects"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/projects"
                submitMethod="PUT"
                :zodSchema="schemas.projects.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/projects"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/projects"
                submitMethod="PUT"
                :zodSchema="schemas.projects.update"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
