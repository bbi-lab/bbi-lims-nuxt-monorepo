<script setup lang="ts">
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()
const rowActions = {}

</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="index-primers"
                :zodSchema="schemas.indexPrimers.select"
                title="Index Primers"
                :row-actions="rowActions"
                :can-edit="false"
                :can-delete="false"
                :rows-per-page-options="[10, 25, 50, 100]"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/index-primers"
                submitMethod="POST"
                :zodSchema="schemas.indexPrimers.insert"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
