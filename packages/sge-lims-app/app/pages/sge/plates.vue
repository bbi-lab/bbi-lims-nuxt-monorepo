<script setup lang="ts">
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '#shared/db/zod/zodSchemas'

// plateType is a FK to plate_types.value (open lookup set) — just a string at the type level.
type PlateType = string

// Plate types come from the plate_types lookup table.
const { data: plateTypes } = await useFetch('/api/plate-types', { default: () => [] })
const plateTypeOptions = _.sortBy(_.map(plateTypes.value, (pt) => {
    // disable PCR plate types that should only be generated on experiment creation
    const pattern = /^preseq-|-pcr$|^[d|r]na-preseq-/
    const disabled = pattern.test(pt.value) && !_.endsWith(pt.value, '-storage')
    return { label: pt.label, code: pt.value, ...(disabled ? { disabled: true } : {}) }
}), 'label')

const router = useRouter()
const route = useRoute()
const crudTable = useCrudTable()

const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, any>>({})

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const columnDefs: ColumnDefinitions = {
    name: { index: 0},
    plateType: { display: false },
    plateTypeLabel: { header: 'Type', index: 1 },
    sizeX: { display: false },
    sizeY: { display: false },
    cycleId: { display: false },
    cycleName: { header: 'Cycle', index: 2 },
    targets: { index: 4 },
    wellsCount: { display: false },
    wellsWithContentCount: { display: false },
    wellsProcessedCount: { display: false },
    pcrExperimentId: { display: false},
    sgRnaCloningExperimentId: { display: false},
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
    wellsProcessed: {
        header: 'Wells processed',
        index: 3,
        format: (data: any) => {
            return _.includes(['preseq-1', 'preseq-2'], data.plateType) ? data.wellsProcessedCount : ''
        },
        path: 'wellsProcessed.displayValue',
    },
    discarded: { index: 5 },
    processed: { header: 'Plate processed', index: 6 },
}
const rowActions = {
    layout: {
        action: (data: any) => {
            router.push({path:`/sge/plate-layout/${data.plateType}/${data.id}`})
        },
        disabled: ({plateType}: { plateType: PlateType }) => _.includes(['amp-pcr', 'lin-pcr', 'ha-pcr'], plateType)
    },
}

const fieldConfigs: FormFieldConfigs = {
    wells: { display: false },
    name: { index: 0 },
    plateType: {
        index: 1,
        component: 'Select',
        props: {
            options: plateTypeOptions,
            optionLabel: 'label',
            optionValue: 'code',
            optionDisabled: 'disabled',
        },
    },
    pcrExperiments: {display: false},
    sgRnaCloningExperiments: {display: false},
}

const editFieldConfigs: FormFieldConfigs = {
    ...fieldConfigs,
    plateType: { readonly: true, index: 1 },
    sizeX: { readonly: true },
    sizeY: { readonly: true },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="view-plates-with-well-counts"
                :zodSchema="schemas.plates.select"
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
                :fieldConfigs="editFieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
