<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '#shared/db/zod/zodSchemas'

const route = useRoute()
const crudTable = useCrudTable()

const tableKey = ref<string>(uuidv4())
const whereClauses = ref()

watch(() => route.query, async (newValue, _oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

// The view denormalizes everything, so no withClause/relations are needed. Most of the
// per-segment sequence columns are hidden in the table and only shown in the read-only
// detail form; the assembled `gblockSeq` and orderable `gblockOrderSeq` are the useful ones.
const columnDefs: ColumnDefinitions = {
    id: { display: false },
    tileId: { display: false },
    superblockId: { display: false },
    tileName: { header: 'Tile', index: 0 },
    side: { header: 'Side', index: 1 },
    restrictionEnzymeName: { header: 'Restriction Enzyme', index: 2 },
    applyCapseqToGblocks: { header: 'Capseq included', index: 3 },
    superblockFirst: { display: false },
    superblockLast: { display: false },
    mutagenesisStart: { display: false },
    mutagenesisEnd: { display: false },
    gblockLength: {
        header: 'Length',
        index: 4,
        format: (row) => row.gblockSeq?.length || 0,
        path: 'gblockLength.displayValue',
    },
    gblockSeq: { header: 'Gblock sequence', index: 5, bodyClass: 'max-w-64', truncatable: true },
    gblockOrderLength: {
        header: 'Order length',
        index: 6,
        format: (row) => row.gblockOrderSeq?.length || 0,
        path: 'gblockOrderLength.displayValue',
    },
    gblockOrderSeq: { header: 'Order sequence', index: 7, bodyClass: 'max-w-64', truncatable: true },
    gblockCapseqFSeq: { display: false },
    gblockNtermOverhangSeq: { display: false },
    gblockNtermRestrictionEnzymeSeq: { display: false },
    gblockCoreSeq: { display: false },
    gblockCtermRestrictionEnzymeSeqRevComp: { display: false },
    gblockCtermOverhangSeq: { display: false },
    gblockCapseqRRevCompSeq: { display: false },
    gblockPadSeq: { display: false },
}

// Read-only detail form: hide the internal id/FK columns and render the long assembled
// sequences as textareas. The `readOnly` prop disables every field and hides submit/delete.
const detailFieldConfigs: FormFieldConfigs = {
    id: { display: false },
    tileId: { display: false },
    superblockId: { display: false },
    tileName: { label: 'Tile' },
    side: { label: 'Side' },
    restrictionEnzymeName: { label: 'Enzyme' },
    applyCapseqToGblocks: { label: 'Apply capseq' },
    gblockSeq: { label: 'Gblock sequence', inputType: 'textarea' },
    gblockPadSeq: { label: 'Pad sequence', inputType: 'textarea' },
    gblockOrderSeq: { label: 'Order sequence', inputType: 'textarea' },
}

// Row action: view the individual components that concatenate to gblockOrderSeq
// (pad + capseq + overhangs + RE sites + core) in the OligoViewer dialog.
const showOligoViewerDialog = ref(false)
const selectedGblock = ref<Record<string, any> | null>(null)

const selectedGblockOligoItems = computed<OligoItem[]>(() =>
    selectedGblock.value ? buildGblockOligoItems(selectedGblock.value) : []
)
const selectedGblockName = computed(() =>
    selectedGblock.value ? `${selectedGblock.value.tileName} (${selectedGblock.value.side})` : 'Gblock'
)

const rowActions = {
    viewComponents: {
        action: (data: Record<string, any>) => {
            selectedGblock.value = data
            showOligoViewerDialog.value = true
        },
        icon: 'pi pi-eye',
        tooltip: 'View sequence components',
        label: '',
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="view-tile-gblocks"
                :zodSchema="schemas.viewTileGblocks.select"
                title="Gblocks"
                :where="whereClauses"
                :canAdd="false"
                :canDelete="false"
                selectionMode="single"
                :column-defs="columnDefs"
                :row-actions="rowActions"
                :show-column-filters="true"
                :sort-by="['tileName', 'side']"
                :rowsPerPageOptions="[10, 25, 50, 100]"
                @clicked-record-edit="crudTable.didClickRecordEdit"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/view-tile-gblocks"
                :recordIds="[crudTable.state.editingRecordId]"
                :zodSchema="schemas.viewTileGblocks.select"
                :fieldConfigs="detailFieldConfigs"
                :readOnly="true"
                :canDelete="false"
                @cancel="crudTable.didClickCancelEditForm"
            />
        </SplitterPanel>
    </Splitter>
    <Dialog
        v-model:visible="showOligoViewerDialog"
        :header="selectedGblockName"
        modal
        :style="{ width: '60rem', maxWidth: '95vw' }"
        :dismissable-mask="true"
    >
        <OligoViewer
            v-if="selectedGblock"
            :data="selectedGblockOligoItems"
            :name="selectedGblockName"
        />
    </Dialog>
</template>
