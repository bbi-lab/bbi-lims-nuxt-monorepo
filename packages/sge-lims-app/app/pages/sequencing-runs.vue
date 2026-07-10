
<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()
const router = useRouter()
const invalidRecords = ref()

const columnDefs: ColumnDefinitions = {
    startedOn: {
        format: 'date-time'
    },
    createdOn: {
        format: 'date-time'
    },
    endedOn: {
        format: 'date-time'
    },
    samples: {
        display: false,
    },
    externalSamples: {
        display: false,
    },
}
const fieldConfigs: FormFieldConfigs = {
    createdOn: {
        inputType: 'date'
    },
    startedOn: {
        inputType: 'date'
    },
    endedOn: {
        inputType: 'date'
    },
}
const rowActions = {
    samples: {
        label: (data: any) => { return `${_.size(data.samples) + _.size(data.externalSamples)}`},
        action: (data: any) => {
            router.push({path:`/sequencing-run/${data.id}/samples`})
        },
        icon: 'pi pi-fw pi-list',
        iconPos: 'right',
        tooltip: 'View samples',
    }
}
const didAddRecord = async (record: any) => {
    // await updateInvalidRecords()
    crudTable.didAddRecord(record)
}
const didUpdateRecord = async (record: any) => {
    // await updateInvalidRecords()
    crudTable.didUpdateRecord(record)
}
const didDeleteRecord = async (record: any) => {
    // await updateInvalidRecords()
    crudTable.didDeleteRecord(record)
}
const displayWithClause = {
    samples: {
        columns: {
            id: true,
        },
    },
    externalSamples: {
        columns: {
            id: true,
        },
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="sequencing-runs"
                :zodSchema="schemas.sequencingRuns.select"
                title="Sequencing runs"
                :column-defs="columnDefs"
                :can-edit-multiple="true"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm"
                :row-actions="rowActions"
                :with-clause="displayWithClause"
                :invalidRecords="invalidRecords"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/sequencing-runs"
                submitMethod="POST"
                :zodSchema="schemas.sequencingRuns.insert"
                :fieldConfigs="fieldConfigs"
                :initialValues="{status: 'pending', createdOn: new Date()}"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/sequencing-runs"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/sequencing-runs"
                submitMethod="PUT"
                :zodSchema="schemas.sequencingRuns.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="didUpdateRecord"
                @record-delete="didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
