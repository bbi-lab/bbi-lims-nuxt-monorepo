<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '../../../shared/db/zod/zodSchemas'

const crudTable = useCrudTable()

const editWithClause = Object.freeze({userGroupMemberships:true})
const displayWithClause = Object.freeze({userGroupMemberships:{columns: {}, with: {userGroup: {columns: {name: true}}}}})

const fieldConfigs: FormFieldConfigs = {
    userGroupMemberships: {
        inputArray: {
            canAdd: true,
            canDelete: true,
            fieldConfigs: {
                userGroupId: {
                    autoCompleter: {
                        searchBaseUrl: '/api/user-groups',
                        valueField: 'id',
                        displayFields: ['name'],
                        dropdown: true,
                    },
                },
            },
        },
    },
}

const columnDefs: ColumnDefinitions = {
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
            <SmartTable
                :ref="crudTable.setTableRef"
                tableName="users"
                :zodSchema="schemas.users.select"
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
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/users"
                submitMethod="POST"
                :zodSchema="schemas.users.insert"
                :formDebug="true"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/users"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/users"
                submitMethod="PUT"
                :zodSchema="schemas.users.adminUpdate"
                :withClause="editWithClause"
                :fieldConfigs="fieldConfigs"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
