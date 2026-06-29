<script setup lang="ts">
import _ from 'lodash'
import { getWellTextColor, wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '#shared/db/zod/zodSchemas'

const { breakpoints } = useLayout()
const route = useRoute()
const plateLayout = usePlateLayout()
const toast = useToast()

const smallerThanLg = breakpoints.smaller('lg')
const plateWithWellSpecs = ref()
const tableKey = ref(uuidv4())

const PRIMER_TYPE_LABELS: Record<string, string> = {
    'dna-preseq-1': 'DNA PreSeq 1',
    'dna-preseq-2': 'DNA PreSeq 2',
    'rna-preseq-1': 'RNA PreSeq 1',
    'rna-preseq-2': 'RNA PreSeq 2',
}

onMounted(async () => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: [(wellContent: any) => {
            if (_.get(wellContent, 'preseq2Primer')) {
                return _.compact([_.get(wellContent, 'preseq2Primer.target.id')])
            }
            return _.map(
                _.get(wellContent, 'preseq1Primer.preseq1PrimerTargets') ||
                _.get(wellContent, 'rnaPreseq1Primer.rnaPreseq1PrimerTargets') ||
                _.get(wellContent, 'rnaPreseq2Primer.rnaPreseq2PrimerTargets'), 'target.id')
        }],
        selectionTableRecordIdPaths: [
            'preseq1Primer.id',
            'preseq2Primer.id',
            'rnaPreseq1Primer.id',
            'rnaPreseq2Primer.id',
        ],
        tooltip: (well: any) => {
            const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
            const wellable = well.wellContents?.[0]?.wellable
            const primerName = wellable?.preseq1Primer?.name
                || wellable?.preseq2Primer?.name
                || wellable?.rnaPreseq1Primer?.name
                || wellable?.rnaPreseq2Primer?.name
            return primerName ? `${wellCoordinate}:<br>${primerName}` : wellCoordinate
        },
        symbol: (well: any) => {
            const wellable = well.wellContents?.[0]?.wellable
            const primer = wellable?.preseq1Primer
                || wellable?.preseq2Primer
                || wellable?.rnaPreseq1Primer
                || wellable?.rnaPreseq2Primer
            return primer?.sequenceType ? _.upperCase(primer.sequenceType[0]) : ''
        },
    }

    plateLayout.setExportPlateLayoutConfig({
        columns: [
            { header: 'Well Position', data: (well: any) => `${wellCoordinateToChar(well.y)}${well.x}` },
            { header: 'Primer Type', data: (well: any) => {
                const wellable = well.wellContents?.[0]?.wellable
                if (wellable?.preseq1Primer) return 'DNA PreSeq 1'
                if (wellable?.preseq2Primer) return 'DNA PreSeq 2'
                if (wellable?.rnaPreseq1Primer) return 'RNA PreSeq 1'
                if (wellable?.rnaPreseq2Primer) return 'RNA PreSeq 2'
                return ''
            }},
            { header: 'Primer', data: (well: any) => {
                const wellable = well.wellContents?.[0]?.wellable
                return wellable?.preseq1Primer?.name
                    || wellable?.preseq2Primer?.name
                    || wellable?.rnaPreseq1Primer?.name
                    || wellable?.rnaPreseq2Primer?.name
                    || ''
            }},
        ],
        sortBy: (well: any) => `${wellCoordinateToChar(well.y)}${well.x}`,
    })

    await plateLayout.loadPlate({
        preseq1Primer: { with: { preseq1PrimerTargets: { with: { target: { with: { project: { columns: { name: true } } } } } } } },
        preseq2Primer: { with: { target: { with: { project: { columns: { name: true } } } } } },
        rnaPreseq1Primer: { with: { rnaPreseq1PrimerTargets: { with: { target: { with: { project: { columns: { name: true } } } } } } } },
        rnaPreseq2Primer: { with: { rnaPreseq2PrimerTargets: { with: { target: { with: { project: { columns: { name: true } } } } } } } },
    })

    plateWithWellSpecs.value = {
        ...plateLayout.plateWithWellContents.value,
        wells: _.values(plateLayout.wellSpecs.value),
    }
})

const reloadAll = async () => {
    await plateLayout.reloadPlate()
    plateWithWellSpecs.value = {
        ...plateLayout.plateWithWellContents.value,
        wells: _.values(plateLayout.wellSpecs.value),
    }
    tableKey.value = uuidv4()
}

const whereClause = {
    'or':[
        {'==':[{'var': 'wellContents'}, null]},
        {'==':[{'var': 'wellContents.well.plate.id'}, route.params.id]},
    ]
}

const columnDefs: ColumnDefinitions = {
    colorTile: {
        index: 0,
        header: '',
        sortable: false,
        type: 'element',
        element: (x: any) => {
            const wellSpec = plateLayout.getWellSpecBySelectionTableRecordId(x.id)
            return wellSpec ? `<span
                class="inline-block w-6 h-6 rounded-sm text-center"
                style="color: ${getWellTextColor(wellSpec.color)}; background-color:${wellSpec.color}">
                ${wellSpec.symbol}
            </span>` : ''
        },
        searchable: false,
        exportable: false,
    },
    name: { index: 1 },
    primerType: {
        header: 'Type',
        index: 2,
        format: (x: any) => PRIMER_TYPE_LABELS[x.primerType] || x.primerType,
        path: 'primerType.displayValue',
        type: 'string',
    },
    targets: {
        header: 'Target(s)',
        index: 3,
        format: (x: any) => _.map(x.targets, 'name'),
        path: 'targets.displayValue',
        type: 'array',
    },
    projects: {
        header: 'Project(s)',
        index: 4,
        format: (x: any) => _.map(x.projects, 'name'),
        path: 'projects.displayValue',
        type: 'array',
    },
    wells: {
        format: (x: any) => {
            return _.values(combinedWellLocations(x, { asDict: true, includePlateIds: [route.params.id as string] })).join(', ')
        },
        path: 'wells.displayValue',
        type: 'string',
        index: 5,
    },
    otherLocations: {
        header: 'Other locations',
        format: (x: any) => combinedWellLocations(x, { excludePlateIds: [route.params.id as string] }) as string,
        path: 'otherLocations.displayValue',
        type: 'string',
        index: 6,
    },
}

const rowActions = {
    assign: {
        label: '',
        action: async (data: any) => {
            if (plateLayout.selectedWells.value.length === 0) {
                toast.add({ severity: 'warn', summary: 'No wells selected', detail: 'Please select wells to assign primers to.', life: 3000 })
                return
            } else if (plateLayout.selectedWells.value.length > 1) {
                toast.add({ severity: 'warn', summary: 'Multiple wells selected', detail: 'Please select only one well to assign a primer.', life: 3000 })
                return
            } else if (!_.isEmpty(plateLayout.selectedWells.value[0]?.data.wellContents)) {
                toast.add({ severity: 'warn', summary: 'Well already has contents', detail: 'Please select an empty well to assign a primer.', life: 3000 })
                return
            } else {
                await plateLayout.assignIdToSelectedWells(data.id)
                await reloadAll()
            }
        },
        icon: 'pi pi-fw pi-arrow-right',
        iconPos: 'right',
        tooltip: 'Assign to selected wells',
        disabled: (data: any) => _.some(data?.wellable?.wellContents, (wc: any) => wc?.well?.plate?.id === route.params.id),
    },
}

const frozenRecordIds = computed(() =>
    _.compact(_.flatten(_.map(plateLayout.selectedWells.value, 'selectionTableRecordIds')))
)
</script>
<template>
    <Splitter class="h-full mb-8" :layout="smallerThanLg ? 'vertical' : 'horizontal'">
        <SplitterPanel class="overflow-scroll" :size="60">
            <SmartTable
                :key="tableKey"
                :ref="plateLayout.setSelectionTableRef"
                tableName="view-mixed-preseq-primers"
                :zodSchema="schemas.viewMixedPreseqPrimers.select"
                :canAdd="false"
                :canDelete="false"
                :canEdit="false"
                :canExport="false"
                :where="whereClause"
                :columnDefs="columnDefs"
                :rowActions="rowActions"
                :showColumnFilters="true"
                :rowsPerPageOptions="[10, 25, 50, 100]"
                :sortBy="['wells.displayValue']"
                emptyMessage=""
                :rowStyle="(data: any) => data?.archived ? { textDecoration: 'line-through' } : {}"
                v-model:frozenRecordIds="frozenRecordIds">
            </SmartTable>
        </SplitterPanel>
        <SplitterPanel class="flex justify-center overflow-scroll mt-10" :size="40" :minSize="25">
            <PlateDiagram
                :ref="plateLayout.setPlateDiagramRef"
                v-if="plateWithWellSpecs"
                v-model="plateWithWellSpecs"
                :plateType="plateWithWellSpecs.plateType"
                :sizeX="plateWithWellSpecs.sizeX"
                :sizeY="plateWithWellSpecs.sizeY"
                :showExportButton="true"
                @well-range-selected="plateLayout.wellRangeSelected"
                @well-selection-cleared="plateLayout.wellSelectionCleared"
                @all-wells-selected="plateLayout.selectedAllWells"
                @well-contents-updated="reloadAll"
                @did-click-export-plate-layout="plateLayout.exportPlateLayout">
                <template #header>{{ plateWithWellSpecs.name }}</template>
                <template #button1>
                    <Button
                        class="p-button-secondary"
                        icon="pi pi-trash"
                        v-tooltip="{ value: 'Empty selected wells', showDelay: 500 }"
                        :disabled="_.isEmpty(plateLayout.selectedWells.value)"
                        @click="async () => { await plateLayout.emptySelectedWells(); await reloadAll() }" />
                </template>
            </PlateDiagram>
        </SplitterPanel>
    </Splitter>
</template>
