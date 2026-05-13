<script setup lang="ts">
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '../../shared/db/zod/zodSchemas'

const router = useRouter()
const route = useRoute()
const crudTable = useCrudTable()

const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, unknown>>({})

const definedRoutes = router.getRoutes()

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const columnDefs = {
    name: { index: 0},
    plateType: { display: false },
    plateTypeLabel: { header: 'Type', index: 1 },
    sizeX: { display: false },
    sizeY: { display: false },
    wellsCount: { display: false },
    wellsWithContentCount: { display: false },
    wellsProcessedCount: { display: false },
    filled: {
        index: 3,
        format: (data: any) => {
            if (_.isNumber(data.wellsCount) && data.wellsCount > 0 && _.isNumber(data.wellsWithContentCount)) {
                return `${data.wellsWithContentCount} / ${data.wellsCount}`
            } else {
                return '-'
            }
        },
        path: 'filled.displayValue',
    },
    discarded: { index: 5 },
    processed: { header: 'Plate processed', index: 6 },
}
const rowActions = {
    layout: {
        action: (data: any) => {
            const routerPath = `/plate-layout/${data.plateType}/:id()`
            // route to generic plate layout page if no specific route exists for plate type
            if (!definedRoutes.find(r => r.path === routerPath)) {
                router.push({path:`/plate-layout/${data.id}`})
            } else {
                router.push({path:`/plate-layout/${data.plateType}/${data.id}`})
            }
        },
        disabled: ({plateType}: { plateType: PlateType }) => _.includes([], plateType)
    },
}

const fieldConfigs: Record<string, FormFieldConfig> = {
    name: {
        label: 'Plate Name',
    },
    sizeX: {
        defaultValue: 12,
    },
    sizeY: {
        defaultValue: 8,
    },
    plateType: {
        autoCompleter: {
            searchBaseUrl: '/api/plate-types',
            valueField: 'value',
            displayFields: ['label'],
            searchFields: ['label'],
            dropdown: true,
        },
    },
}

const withClause = {
    plateTypeRef: true,
}
// plateType is now a FK to plate_types.value — use z.string() since valid values are enforced by the DB
const insertPlateSchema = schemas.plates.insert
const updatePlateSchema = schemas.plates.update
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="view-plates-with-well-counts"
                :zodSchema="schemas.viewPlatesWithWellCounts.select"
                title="Plates/Storage boxes"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :column-defs="columnDefs"
                :row-actions="rowActions"
                :where="whereClauses"
                :can-delete="false"
                :can-edit-multiple="true"
                :show-column-filters="true"
                :sort-by="['plateTypeLabel', 'name']"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/plates"
                submitMethod="POST"
                :zodSchema="insertPlateSchema"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/plates"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/plates"
                submitMethod="PUT"
                :zodSchema="updatePlateSchema"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm && crudTable.state.editingMultipleRecordsIds.length > 0"
                selectUrl="/api/plates"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/plates"
                submitMethod="PUT"
                :zodSchema="updatePlateSchema"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
