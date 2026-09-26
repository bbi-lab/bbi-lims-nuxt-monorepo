<script setup lang="ts">
import _ from 'lodash'
import { Icon } from '#components'
import { schemas } from '#shared/db/zod/zodSchemas'

const router = useRouter()
const crudTable = useCrudTable()

const definedRoutes = router.getRoutes()

// Casing here is the lab's own, so the stored kebab-case values map to it explicitly.
// Values outside the map (retired PCR types still on old records) fall back to upper case.
const PCR_TYPE_LABELS: Record<string, string> = {
    'tile-oligo-pcr-1': 'tile oligo PCR 1',
    'tile-oligo-pcr-2': 'tile oligo PCR 2',
    'plasmid-barcode-pcr-1': 'plasmid barcode PCR 1',
    'plasmid-barcode-pcr-2': 'plasmid barcode PCR 2',
    'rt-pcr': 'RT PCR',
    'post-rt-pcr-1': 'post-RT PCR 1',
    'post-rt-pcr-2': 'post-RT PCR 2',
}
const pcrTypeLabel = (value: unknown) => PCR_TYPE_LABELS[_.toString(value)] ?? _.upperCase(_.toString(value))

const columnDefs: ColumnDefinitions = {
    name: { index: 0 },
    pcrType: {
        header: 'Type',
        index: 1,
        // SmartTable rewrites formatted cells to { originalValue, displayValue } on each refresh
        format: (data: any) => pcrTypeLabel(_.get(data, 'pcrType.originalValue', data.pcrType)),
        path: 'pcrType.displayValue',
    },
    startedOn: { index: 2 },
    plateId: { display: false },
    plate: { display: false },
}

const rowActions = {
    layout: {
        action: (data: any) => {
            // PCR plate types have no type-specific layout page, so they fall through to
            // the generic /plate-layout/:id page (same check as plates.vue).
            const routerPath = `/plate-layout/${data.plate?.plateType}/:id()`
            if (definedRoutes.find(r => r.path === routerPath)) {
                router.push({path: `/plate-layout/${data.plate.plateType}/${data.plate.id}`})
            } else {
                router.push({path: `/plate-layout/${data.plate.id}`})
            }
        },
        visible: (data: any) => !!data.plate,
        iconComponent: h(Icon, { name: 'ph:grid-nine-fill', class: 'm-1' }),
        iconPos: 'right',
        tooltip: 'Plate layout',
    },
}

const addFieldConfigs: FormFieldConfigs = {
    name: {
        subtext: 'The experiment\'s 8x12 plate is created with this name.',
    },
    pcrType: {
        label: 'Type',
        optionLabel: (option: any) => pcrTypeLabel(option.name),
    },
    startedOn: {
        dateType: 'date',
    },
}

// pcrType renders disabled here — it is readonly in the update schema because the
// experiment's plate was created with the matching plate type.
const editFieldConfigs: FormFieldConfigs = {
    pcrType: { label: 'Type', optionLabel: (option: any) => pcrTypeLabel(option.name) },
    startedOn: { dateType: 'date' },
}

const withClause = {
    plate: {columns: {id: true, name: true, plateType: true}},
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="pcr-experiments"
                :zodSchema="schemas.pcrExperiments.select"
                title="PCR Experiments"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm"
                :column-defs="columnDefs"
                :row-actions="rowActions"
                :withClause="withClause"
                :can-delete="false"
                :show-column-filters="true"
                :sort-by="['name']"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/pcr-experiments"
                submitMethod="POST"
                :zodSchema="schemas.pcrExperiments.insert"
                :fieldConfigs="addFieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/pcr-experiments"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/pcr-experiments"
                submitMethod="PUT"
                :zodSchema="schemas.pcrExperiments.update"
                :fieldConfigs="editFieldConfigs"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
