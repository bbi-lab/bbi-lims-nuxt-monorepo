<script setup lang="ts">
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { schemas } from '../../shared/db/zod/zodSchemas'

const router = useRouter()
const route = useRoute()
const crudTable = useCrudTable()

const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, unknown>>({})

const definedRoutes = router.getRoutes()

watch(() => route.query, async (newValue) => {
    const queryParamFilters = _.map(newValue, (val, key) => {
        return {"==": [{"var": key}, val] }
    })
    whereClauses.value = _.size(queryParamFilters) > 1 ? {and: queryParamFilters} : queryParamFilters
    readonlyValues.value = newValue
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

const fieldDefs = {
    wells: { display: false },
    name: { index: 0 },
    plateType: {
        index: 1,
        component: 'Select',
        props: {
            options: _.sortBy(_.map(appConstants.enumLookups.plates.plateType, (value, key) => {
                const pattern = /^preseq-|-pcr$/
                if (pattern.test(key)) {
                    return { label: value.label, code: key, disabled: true }
                } else {
                    return { label: value.label, code: key }
                }
            }), 'label'),
            optionLabel: 'label',
            optionValue: 'code',
            optionDisabled: 'disabled',
        },
        events: {
            change: (record: any, recordOld: any) => {
                if (record?.plateType == recordOld?.plateType) return
                if (_.endsWith(record.plateType, '-storage')) {
                    record.sizeX = 9
                    record.sizeY = 9
                } else {
                    record.sizeX = 12
                    record.sizeY = 8
                }
            }
        },
    },
}

const fieldConfigs: Record<string, FormFieldConfig> = {
    name: {
        label: 'Plate Name',
    },
}

// Apply enum mapping for plateType field
const plateTypeOptions = _.mapValues(appConstants.enumLookups.plates.plateType, 'label')
_.set(schemas.plates.insert, 'shape.plateType', z.enum(_.invert(plateTypeOptions)))
_.set(schemas.plates.update, 'shape.plateType', z.enum(_.invert(plateTypeOptions)))
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <QuickTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="view-plates-with-well-counts"
                schema-name="select"
                title="Plates/Storage boxes"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :column-defs="columnDefs"
                :row-actions="rowActions"
                :where="whereClauses"
                :can-delete="false"
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
                :zodSchema="schemas.plates.insert"
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
                :zodSchema="schemas.plates.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <!-- TODO: Multiple edit form not yet implemented with RecordsSmartForm -->
        </SplitterPanel>
    </Splitter>
</template>
