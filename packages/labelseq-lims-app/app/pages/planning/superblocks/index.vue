<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '#shared/db/zod/zodSchemas'
import _ from 'lodash'
import { Icon } from '#components'

const SequenceIcon = h(Icon, { name: 'token:sequence', class: 'text-2xl' })

const route = useRoute()
const router = useRouter()
const crudTable = useCrudTable()

const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, unknown>>({})


watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const columnDefs: ColumnDefinitions = {
    name: { index: 0 },
    description: { index: 1 },
    projectId: { display: false },
    project: { header: 'Project', index: 2, path: 'project.name' },
    classification: { index: 3 },
    refseqTranscriptId: { display: false },
    refseqTranscript: { header: 'RefSeq transcript ID', index: 4, path: 'refseqTranscript.transcriptId' },
    start: { index: 5 },
    end: { index: 6 },
    aaStart: {
        index: 7,
        header: 'AA start',
        format: (row) => row.start && (row.start - 1) % 3 === 0 ? _.toString((row.start - 1) / 3 + 1) : '',
        path: 'aaStart.displayValue',
    },
    seq: { header: 'Sequence (optimized)', index: 8, bodyClass: 'max-w-64', truncatable: true },
    length: { header: 'Length', index: 9, format: (row) => row.seq?.length || '', path: 'length.displayValue' },
}

const fieldConfigs: FormFieldConfigs = {
    projectId: {
        label: 'Project',
        autoCompleter: {
            searchBaseUrl: '/api/projects',
            valueField: 'id',
            displayFields: ['name'],
            searchFields: ['name'],
            dropdown: true,
        },
    },
    refseqTranscriptId: {
        label: 'RefSeq Transcript',
        autoCompleter: {
            searchBaseUrl: '/api/refseq-transcripts',
            valueField: 'id',
            displayFields: ['transcriptId', 'gene.symbol'],
            searchFields: ['transcriptId', 'gene.symbol'],
            searchWithClause: {
                gene: true,
            },
            dropdown: true,
        },
    },
    seq: {
        inputType: 'textarea',
        label: 'Sequence (optimized)',
    },
}

const withClause = {
    project: true,
    refseqTranscript: {
        with: {
            gene: true,
        },
    },
}

interface SequenceDialogData {
    name: string
    refSeq: string
    altSeq: string
    startPos: number
}

const sequenceDialogVisible = ref(false)
const sequenceDialog = ref<SequenceDialogData | null>(null)

const openSequenceDialog = async (data: Record<string, any>) => {
    const transcriptSeq: string = data.refseqTranscript?.cds ?? ''
    const start: number = data.start ?? 1
    const end: number = data.end ?? transcriptSeq.length
    sequenceDialog.value = {
        name: data.name,
        refSeq: transcriptSeq.substring(start - 1, end),
        altSeq: data.seq ?? '',
        startPos: start,
    }
    sequenceDialogVisible.value = true
}

const rowActions = {
    viewTiles: {
        action: (data: Record<string, any>) => {
            router.push(`/planning/tiles?superblockId=${data.id}`)
        },
        icon: 'pi pi-objects-column',
        tooltip: 'View tiles',
        label: '',
    },
    viewTileOligos: {
        action: (data: Record<string, any>) => {
            router.push(`/planning/superblocks/${data.id}/tiles`)
        },
        icon: 'pi pi-eye',
        tooltip: 'View tile oligos',
        label: '',
    },
    viewSequenceAlignment: {
        action: openSequenceDialog,
        tooltip: 'View sequence alignment',
        label: '',
        iconComponent: SequenceIcon,
    },
}
</script>
<template>
    <Dialog
        v-model:visible="sequenceDialogVisible"
        :header="sequenceDialog ? `Sequence alignment — ${sequenceDialog.name}` : ''"
        modal
        :style="{ width: '90vw', maxWidth: '1400px' }"
        @hide="sequenceDialog = null"
    >
        <SequenceAlignmentViewer
            v-if="sequenceDialog"
            :reference-sequence="sequenceDialog.refSeq"
            :alt-sequence="sequenceDialog.altSeq"
            :show-codons="true"
            :start-pos="sequenceDialog.startPos"
        />
    </Dialog>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="superblocks"
                :zodSchema="schemas.superblocks.select"
                title="Superblocks"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                :column-defs="columnDefs"
                :where="whereClauses"
                :withClause="withClause"
                :can-edit-multiple="true"
                :show-column-filters="true"
                :sort-by="['name']"
                :row-actions="rowActions"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/superblocks"
                submitMethod="POST"
                :zodSchema="schemas.superblocks.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/superblocks"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/superblocks"
                submitMethod="PUT"
                :zodSchema="schemas.superblocks.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :canDelete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm && crudTable.state.editingMultipleRecordsIds.length > 0"
                selectUrl="/api/superblocks"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/superblocks"
                submitMethod="PUT"
                :zodSchema="schemas.superblocks.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
