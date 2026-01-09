<script setup lang="ts">
import _ from 'lodash'

const crudTable = useCrudTable()

const editWithClause = Object.freeze({userGroupMemberships:true})
const displayWithClause = Object.freeze({userGroupMemberships:{columns: {}, with: {userGroup: {columns: {name: true}}}}})

const columnDefs = {
    name: {header: 'Name'},
    email: {header: 'Email'},
    isAdmin: {header: 'Admin'},
    isVerified: {header: 'Verified'},
    userGroupMemberships: {
        header: 'Groups',
        format: (x: any) => _.map(x.userGroupMemberships, 'userGroup.name'),
        path: 'userGroupMemberships.displayValue',
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <QuickTable
                :ref="crudTable.setTableRef"
                tableName="users"
                schemaName="select-user-schema"
                title="Users"
                :canAdd="false"
                :withClause="displayWithClause"
                :columnDefs="columnDefs"
                :canDelete="false"
                @clickedRecordEdit="crudTable.didClickRecordEdit"
                @clickedRecordAdd="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <QuickForm
                v-if="crudTable.state.showAddForm"
                tableName="users"
                schemaName="insert-user-schema"
                @cancel="crudTable.didClickCancelAddForm"
                @recordAdd="crudTable.didAddRecord"
            />
            <QuickForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                :withClause="editWithClause"
                :recordId="crudTable.state.editingRecordId"
                tableName="users"
                schemaName="admin-update-user-schema"
                :fieldDefs="{'userGroupMemberships.*': {canUpdate: true}}"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @recordUpdate="crudTable.didUpdateRecord"
                @recordDelete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
