<script setup lang="ts">
import { wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'
import type { Dna, Rna } from '#shared/db/schema/nucleic-acid'
import type { Pellet } from '#shared/db/schema/pellet'
import type { IndexPrimer } from '#shared/db/schema/primer'
import _ from 'lodash'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { schemas } from '#shared/db/zod/zodSchemas'

const route = useRoute()
const sequencingRun = ref()
const showPlatePanel = ref(false)
const showExternalSamples = ref(false)
const breakpoints = useBreakpoints(breakpointsTailwind)
const smallerThanLg = breakpoints.smaller('lg')
const selectedPlateId = ref()
const plateLayout = usePlateLayout<{ dna: (Dna & { pellet: Pellet | null }) | null; rna: (Rna & { pellet: Pellet | null }) | null; indexPrimer: IndexPrimer | null }>()
const plateWithWellSpecs = ref()
const plateDiagramKey = ref(0)
const toast = useToast()
const sequencingRunAllSamplesTable = ref()
const externalSamplesTable = ref()
const editingRecords = ref<any[]>([])
const editingRecordType = ref<'internal' | 'external' | null>(null)

const showRecordEditForm = computed(() => _.size(editingRecords.value) == 1)
const showMultipleRecordEditForm = computed(() => editingRecords.value?.length > 1)
const selectedExternalSampleRecords = computed(() => externalSamplesTable?.value?.selectedRecords || [])
const sequencingRunSelectedRecords = computed(() => sequencingRunAllSamplesTable?.value?.selectedRecords || [])

const frozenRecordIds = computed(() => {
    const selectedWellIds = _.map(plateLayout.selectedWells.value, 'id')
    return _.map(_.filter(sequencingRunAllSamplesTable.value?.records , (x) => {
        return _.includes(selectedWellIds, x.sourceWellId)
    }), 'id')
})

const invalidRecords = computed(() => {
    const sampleNameCounts = _.countBy(sequencingRunAllSamplesTable.value?.records || [], 'sampleName')
    const recordsWithRepeatedDna = _.filter(sequencingRunAllSamplesTable.value?.records || [], (record) => {
        return _.get(sampleNameCounts, record.sampleName) > 1
    }).map((record) => ({id: record.id, count: sampleNameCounts[record.sampleName]}))
    const invalidDna = _.mapValues(_.keyBy(recordsWithRepeatedDna, 'id'), (val, id) => {
        return {messages: [`Repeated (${val?.count}x)`]}
    })

    const repeatedPrimerCombinations = _.countBy(sequencingRunAllSamplesTable.value?.records || [], (record) => {
        return [record.indexPrimer1Label || '', record.indexPrimer2Label || '', record.customIndexSeq1 || '', record.customIndexSeq2 || ''].sort().join(';')
    })
    const recordsWithRepeatedPrimerCombinations = _.filter(sequencingRunAllSamplesTable.value?.records || [], (record) => {
        const combinationKey = [record.indexPrimer1Label || '', record.indexPrimer2Label || '', record.customIndexSeq1 || '', record.customIndexSeq2 || ''].sort().join(';')
        return _.get(repeatedPrimerCombinations, combinationKey) > 1
    }).map((record) => ({id: record.id, count: repeatedPrimerCombinations[[record.indexPrimer1Label || '', record.indexPrimer2Label || '', record.customIndexSeq1 || '', record.customIndexSeq2 || ''].sort().join(';')]}))

    const invalidPrimerCombinations = _.mapValues(_.keyBy(recordsWithRepeatedPrimerCombinations, 'id'), (val, id) => {
        return {messages: [`Repeated index primers (${val?.count}x)`]}
    })

    return {
        ...invalidDna,
        ...invalidPrimerCombinations,
    }
})

watch (selectedPlateId, async (newValue) => {
    if (newValue) {
        plateLayout.setPlateId(newValue)
        plateLayout.wellContentsDisplayConfig.value = {
            colorBy: [() => true],
            tooltip: (well: any) => {
                const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
                const wellContentsText = _.map(well.wellContents, (wellContent) => {
                    const dna = wellContent?.wellable?.dna
                    if (dna) {
                        return dna.pellet ? `${dna.pellet.name} (DNA)` : '?? (DNA)'
                    } else if (wellContent?.wellable?.indexPrimer) {
                        return `${wellContent.wellable.indexPrimer.indexSequence} (${wellContent.wellable.indexPrimer.primerType} INDEX)`
                    } else {
                        return ''
                    }
                }).join('<br>')
                return wellContentsText ? `${wellCoordinate}:<br>${wellContentsText}` : wellCoordinate
            },
            symbol: (well: any) => {
                return _.size(well.wellContents) || ''
            },
        }
        await plateLayout.loadPlate({
            dna: {
                with: {
                    pellet: true
                }
            },
            rna: {
                with: {
                    pellet: true
                }
            },
            indexPrimer: true,
            wellContents: {
                with: {
                    wellContentSources: {
                        with: {
                            sourceWell: {
                                columns: {},
                                with: {
                                    plate: {
                                        columns: {
                                            id: true,
                                        }
                                    }
                                }
                            },
                        },
                    },
                }
            },
        })
        plateWithWellSpecs.value = {
            ...plateLayout.plateWithWellContents.value,
            wells: _.values(plateLayout.wellSpecs.value),
        }
        plateDiagramKey.value += 1
    }
})

onMounted(async () => {
    sequencingRun.value = await $fetch(`/api/sequencing-runs/${route.params.id}`, { query: { with: JSON.stringify({}) } })
})

const didClickCancelEdit = () => {
    editingRecords.value = []
    editingRecordType.value = null
}
const didClickRecordEdit = (record: any) => {
    editingRecords.value = [record]
    editingRecordType.value = record.sampleType
}
const didClickMultipleRecordEdit = (records: any[]) => {
    // check to make sure all records are of the same type
    const recordTypes = _.uniq(_.map(records, 'sampleType'))
    if (recordTypes.length > 1) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Cannot edit internal and external records together, select only one type.',
            life: 5000,
        })
        return
    }
    editingRecords.value = records
    editingRecordType.value = recordTypes[0]
}
const didUpdateRecord = (record: any) => {
    sequencingRunAllSamplesTable.value.addOrRefreshRecordIds([record.id])
    editingRecords.value = []
    editingRecordType.value = null
}
const didUpdateRecords = (records: any[]) => {
    sequencingRunAllSamplesTable.value.addOrRefreshRecordIds(_.map(records, 'id'))
    editingRecords.value = []
    editingRecordType.value = null
}
const didDeleteRecord = (record: any) => {
    sequencingRunAllSamplesTable.value.removeRecordId(record.id)
    editingRecords.value = []
    editingRecordType.value = null
}
const removeSelectedSamplesFromRun = async () => {
    const sequencingRunInternalSampleIds = _.map(_.filter(sequencingRunSelectedRecords.value, (x) => x.sampleType == 'internal'), 'id')

    if (!_.isEmpty(sequencingRunInternalSampleIds)) {
        try {
            const result: any[] = []
            for (const id of sequencingRunInternalSampleIds) {
                const data = await $fetch(`/api/sequencing-run-samples/${id}`, { method: 'DELETE' })
                result.push(data)
            }
            if (!_.isEmpty(result)) {
                toast.add({ severity: 'success', summary: 'Successful', detail: `${result.length} internal samples removed`, life: 3000 })
                for (const id of sequencingRunInternalSampleIds) {
                    sequencingRunAllSamplesTable.value.removeRecordId(id)
                }
            }
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.data?.statusMessage || error.data?.message,
            })
        }
    }
    const sequencingRunExternalSampleIds = _.map(_.filter(sequencingRunSelectedRecords.value, (x) => x.sampleType == 'external'), 'id')
    if (!_.isEmpty(sequencingRunExternalSampleIds)) {
        try {
            const result: any[] = []
            for (const id of sequencingRunExternalSampleIds) {
                const data = await $fetch(`/api/sequencing-run-external-samples/${id}`, { method: 'DELETE' })
                result.push(data)
            }
            if (!_.isEmpty(result)) {
                toast.add({ severity: 'success', summary: 'Successful', detail: `${result.length} external samples removed`, life: 3000 })
                for (const id of sequencingRunExternalSampleIds) {
                    sequencingRunAllSamplesTable.value.removeRecordId(id)
                }
            }
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.data?.statusMessage || error.data?.message,
            })
        }
    }
}
const addSelectedExternalSamples = async () => {
    const sequencingRunSamplesToAdd = _.map(selectedExternalSampleRecords.value, (selectedSample) => {
        return {
            externalSampleId: selectedSample.id,
            sequencingRunId: sequencingRun.value.id,
            customIndexSeq1: selectedSample.customIndexSeq1,
            customIndexSeq2: selectedSample.customIndexSeq2,
            indexPrimer1Id: selectedSample.indexPrimer1Id,
            indexPrimer2Id: selectedSample.indexPrimer2Id,
        }
    })

    try {
        const result: any = await $fetch('/api/sequencing-run-external-samples', { method: 'POST', body: sequencingRunSamplesToAdd })
        sequencingRunAllSamplesTable.value.addOrRefreshRecordIds(_.map(result, 'id'))
        toast.add({ severity: 'success', summary: 'Successful', detail: `${result.length} records updated`, life: 3000 })
        showExternalSamples.value = false
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.data?.statusMessage || error.data?.message,
        })
    }
}
const addToSequencingRun = async (selectedWells: any) => {
    try {
        const sequencingRunSamplesToAdd = _.compact(_.map(selectedWells, ({data}) => {
            if (_.isEmpty(data.wellContents)) return null

            const indexPrimerContentsP7 = _.filter(data.wellContents, (x) => x.wellable?.indexPrimer?.primerType == 'P7')
            const indexPrimerContentsP5 = _.filter(data.wellContents, (x) => x.wellable?.indexPrimer?.primerType == 'P5')
            const dnaWellContents = _.filter(data.wellContents, (x) => x.wellable?.dna?.id)
            const rnaWellContents = _.filter(data.wellContents, (x) => x.wellable?.rna?.id)
            const sampleField = dnaWellContents.length == 1 ? 'dnaId' : (rnaWellContents.length == 1 ? 'rnaId' : null)
            if (indexPrimerContentsP7.length == 1 && indexPrimerContentsP5.length == 1 && sampleField) {
                return {
                    sequencingRunId: sequencingRun.value.id,
                    [sampleField]: sampleField == 'dnaId' ? dnaWellContents[0].wellable.id : rnaWellContents[0].wellable.id,
                    indexPrimer1Id: indexPrimerContentsP7[0].wellable.id,
                    indexPrimer2Id: indexPrimerContentsP5[0].wellable.id,
                    sourceWellId: data.id,
                }
            } else {
                throw new Error('Invalid well contents: selected wells must contain exactly one P5 index primer, one P7 index primer, and one sample.')
            }
        }))
        if (sequencingRunSamplesToAdd.length > 0) {
            const newRecords = await $fetch(`/api/custom/sequencing-run/${route.params.id}/sequencing-run-samples`, { method: 'POST', body: sequencingRunSamplesToAdd }) as any[]
            if (!_.isEmpty(newRecords)) {
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${sequencingRunSamplesToAdd.length} samples added to sequencing run.`,
                    life: 3000,
                })
                sequencingRunAllSamplesTable.value.addOrRefreshRecordIds(_.map(newRecords, 'id'))
            }
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.data?.statusMessage || error.data?.message || error,
            life: 10000,
        })
    }
}

const columnDefs: ColumnDefinitions = {
    projectName: {index: 0, header: 'Project name (sequencing)'},
    sequencingRunId: { display: false},
    createdAt: { display: false },
    dnaId: { display: false },
    rnaId: { display: false },
    indexPrimer1Id: { display: false },
    indexPrimer2Id: { display: false },
    indexPrimer1Label: { display: false },
    indexPrimer2Label: { display: false },
    customIndexSeq1: { display: false },
    customIndexSeq2: { display: false },
    sourceWellId: { display: false },
    sourceWellX: { display: false },
    sourceWellY: { display: false },
    sourcePlateName: { display: false },
    dna: { display: false},
    sampleName: { index: 1 },
    sampleType: { index: 2 },
    indexPrimer1: {
        format: (data: any) => data.indexPrimer1Label || data.customIndexSeq1,
        path: 'indexPrimer1.displayValue',
        index: 3,
    },
    indexPrimer2: {
        format: (data: any) => data.indexPrimer2Label || data.customIndexSeq2,
        path: 'indexPrimer2.displayValue',
        index: 4,
    },
    indexPlateWellLabel: { index: 5, header: 'Index plate: well' },
    sourceWell: {
        format: (data: any) => {
            return data.sourceWellId ? `${data.sourcePlateName}: ${wellCoordinateToChar(data.sourceWellY)}${data.sourceWellX}` : ''
        },
        path: 'sourceWell.displayValue',
        index: 6,
    },
}
const internalSampleFieldConfigs: FormFieldConfigs = {
    millionReadsRequired: { inputType: 'number' },
}
const externalSampleFieldConfigs: FormFieldConfigs = {}
const externalSamplesColumnDefs: ColumnDefinitions = {
    sequencingRuns: { display: false },
    wellContents: { display: false }
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden" :layout="smallerThanLg ? 'vertical' : 'horizontal'">
        <SplitterPanel :size="50">
            <SmartTable
                ref="sequencingRunAllSamplesTable"
                v-if="sequencingRun"
                table-name="view-sequencing-run-all-samples"
                :zodSchema="schemas.viewSequencingRunAllSamples.select"
                :can-add="false"
                :can-edit="true"
                :can-edit-multiple="true"
                :can-delete="false"
                :column-defs="columnDefs"
                :invalidRecords="invalidRecords"
                :where="{'==': [{'var': 'sequencingRunId'}, sequencingRun.id]}"
                v-model:frozenRecordIds="frozenRecordIds"
                :rows-per-page-options="[10, 25, 50, 100]"
                @clicked-record-edit="didClickRecordEdit"
                @clicked-multiple-record-edit="didClickMultipleRecordEdit"
                @clicked-record-delete="didDeleteRecord"
            >
                <template #title>
                    <span class="text-2xl font-bold m-0">{{ sequencingRun.name }} samples</span>
                    <span v-if="_.size(invalidRecords) > 0" class="ml-4 p-2 bg-red-100 text-red-800 rounded">
                        {{ _.size(invalidRecords) }} invalid sample(s)
                    </span>
                </template>
                <template #header-buttons>
                    <span>
                        <Button
                            label="Remove selected"
                            class="mr-2"
                            severity="danger"
                            :disabled="_.isEmpty(sequencingRunSelectedRecords)"
                            @click="removeSelectedSamplesFromRun" />
                        <Button
                            label="Add from plate"
                            class="mr-2"
                            @click="() => {showExternalSamples=false; showPlatePanel=true}" />
                        <Button
                            label="Add external samples"
                            @click="() => {showExternalSamples=true; showPlatePanel=false}" />
                    </span>
                </template>
            </SmartTable>
        </SplitterPanel>

        <SplitterPanel v-if="showPlatePanel || showExternalSamples || showRecordEditForm || showMultipleRecordEditForm">
            <template v-if="showPlatePanel">
                <div class="flex justify-end m-2">
                    <Button
                        icon="pi pi-times"
                        severity="secondary"
                        size="small"
                        @click="showPlatePanel=false" />
                </div>
                <br/>
                <div class="h-full w-full overflow-y-scroll pb-24">
                    <div class="mt-2 mx-auto max-w-fit">
                        <AutoCompleter
                            v-model="selectedPlateId"
                            searchBaseUrl="/api/plates"
                            :searchWhereClause="{'in': [{'var': 'plateType'}, ['dna-preseq-3', 'rna-preseq-3']]}"
                            iftaLabel="Plate"
                            dropdown
                            hideClearButton
                        />
                    </div>
                    <div class="mt-2 mx-auto max-w-md max-w-fit">
                        <PlateDiagram
                            :key="plateDiagramKey"
                            v-if="plateWithWellSpecs"
                            :ref="plateLayout.setPlateDiagramRef"
                            v-model="plateWithWellSpecs"
                            :plateType="plateWithWellSpecs.plateType"
                            :sizeX="plateWithWellSpecs.sizeX"
                            :sizeY="plateWithWellSpecs.sizeY"
                            @well-range-selected="plateLayout.wellRangeSelected"
                            @well-selection-cleared="plateLayout.wellSelectionCleared"
                            @all-wells-selected="plateLayout.selectedAllWells"
                        >
                            <template #button1>
                                <Button
                                    class="p-button-secondary"
                                    icon="pi pi-plus"
                                    v-tooltip="{value: 'Add to sequencing run', showDelay: 500}"
                                    :disabled="_.isEmpty(plateLayout.selectedWells.value)"
                                    @click="addToSequencingRun(plateLayout.selectedWells.value)" />
                            </template>
                        </PlateDiagram>
                    </div>
                </div>
            </template>
            <div v-if="showExternalSamples" class="overflow-y-scroll">
                <div class="flex justify-end m-2">
                    <Button
                        icon="pi pi-times"
                        severity="secondary"
                        size="small"
                        @click="showExternalSamples=false" />
                </div>
                <SmartTable
                    ref="externalSamplesTable"
                    table-name="external-samples"
                    :zodSchema="schemas.externalSamples.select"
                    :column-defs="externalSamplesColumnDefs"
                    :can-add="false"
                    :can-edit="false"
                    :can-edit-multiple="false"
                    :can-delete="false"
                    :rows-per-page-options="[10, 25, 50, 100]"
                >
                    <template #header-buttons>
                        <span>
                            <Button
                                label="Add selected samples"
                                severity="warn"
                                :disabled="_.isEmpty(selectedExternalSampleRecords)"
                                @click="addSelectedExternalSamples" />
                        </span>
                    </template>
                </SmartTable>
            </div>
            <RecordsSmartForm
                v-if="showRecordEditForm"
                :selectUrl="editingRecordType == 'internal' ? '/api/sequencing-run-samples' : '/api/sequencing-run-external-samples'"
                :recordIds="[editingRecords[0]?.id]"
                :submitUrl="editingRecordType == 'internal' ? '/api/sequencing-run-samples' : '/api/sequencing-run-external-samples'"
                submitMethod="PUT"
                :zodSchema="editingRecordType == 'internal' ? schemas.sequencingRunSamples.updateInRun : schemas.sequencingRunExternalSamples.updateInRun"
                :can-delete="false"
                :fieldConfigs="editingRecordType == 'internal' ? internalSampleFieldConfigs : externalSampleFieldConfigs"
                @cancel="didClickCancelEdit"
                @record-update="didUpdateRecord"
                @record-delete="didDeleteRecord"
            >
                <template #form-element-header>
                    <hr />
                    <div><b>Sample name:</b> {{ editingRecords[0].sampleName }}</div>
                    <div><b>Sample type:</b> {{ editingRecords[0].sampleType }}</div>
                    <div><b>Index Primer 1:</b> {{ editingRecords[0].indexPrimer1Label }}</div>
                    <div><b>Index Primer 2:</b> {{ editingRecords[0].indexPrimer2Label }}</div>
                    <div><b>Plate/well:</b> {{ editingRecords[0].sourceWell?.displayValue || '' }}</div>
                    <hr />
                </template>
            </RecordsSmartForm>
            <RecordsSmartForm
                v-if="showMultipleRecordEditForm"
                :selectUrl="editingRecordType == 'internal' ? '/api/sequencing-run-samples' : '/api/sequencing-run-external-samples'"
                :recordIds="_.map(editingRecords, 'id')"
                :submitUrl="editingRecordType == 'internal' ? '/api/sequencing-run-samples' : '/api/sequencing-run-external-samples'"
                submitMethod="PUT"
                :zodSchema="editingRecordType == 'internal' ? schemas.sequencingRunSamples.updateInRun : schemas.sequencingRunExternalSamples.updateInRun"
                :fieldConfigs="editingRecordType == 'internal' ? internalSampleFieldConfigs : externalSampleFieldConfigs"
                @cancel="didClickCancelEdit"
                @records-update="didUpdateRecords"
            >
                <template #form-element-header>
                    <hr />
                    <div><b>Sample Names:</b></div>
                    <div class="w-96">{{ _.join(_.map(editingRecords, 'sampleName'), ', ') }}</div>
                    <hr />
                </template>
            </RecordsSmartForm>
        </SplitterPanel>
    </Splitter>
</template>
