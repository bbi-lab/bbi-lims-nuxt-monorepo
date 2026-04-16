<script setup lang="ts">
import { schemas } from '../../../shared/db/zod/zodSchemas'

const crudTable = useCrudTable()

const columnDefs = {
    name: { header: 'Name', index: 0 },
}

</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <QuickTable
                :ref="crudTable.setTableRef"
                :columnDefs="columnDefs"
                tableName="user-groups"
                schemaName="select"
                title="User Groups"
                :canAdd="true"
                :canDelete="false"
                @clickedRecordEdit="crudTable.didClickRecordEdit"
                @clickedRecordAdd="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/user-groups"
                submitMethod="POST"
                :zodSchema="schemas.userGroups.insert"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/user-groups"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/user-groups"
                submitMethod="PUT"
                :zodSchema="schemas.userGroups.update"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
