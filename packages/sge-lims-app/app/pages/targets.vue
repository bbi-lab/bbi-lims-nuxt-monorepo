<script setup lang="ts">
import { Icon } from '#components'
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'
import { v4 as uuidv4 } from 'uuid'

const router = useRouter()
const route = useRoute()
const crudTable = useCrudTable()

const addRecordValues = ref()
const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, any>>({})

watch(() => route.query, async (newValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const displayWithClause = Object.freeze({
    project: { columns: { id: true, name: true } },
    region: {
        columns: { id: true, name: true },
        with: {
            gene: { columns: { id: true, symbol: true, ncbiAccession: true, chromosome: true } }
        }
    },
    transfectTargets: { with: { pellets: true } },
    sgRnaPlasmidTargets: { with: { target: { columns: { id: true, name: true } } } },
    snvLibPlasmids: { columns: { id: true } },
    amplificationPrimers: { columns: { id: true, name: true, sequence: true, sequenceType: true } },
    preseq2Primers: { columns: { id: true, name: true, sequence: true, sequenceType: true } },
})

const rowActions = {
    sgRnaPlasmids: {
        label: (data: any) => `${_.uniq(_.map(data.sgRnaPlasmidTargets, 'sgRnaPlasmidId')).length || 0} sgRNA`,
        action: (data: any) => {
            router.push({ path: '/sg-rna-plasmids', query: { 'sgRnaPlasmidTargets[].targetId': data.id } })
        },
        tooltip: 'sgRNA',
    },
    snvLibPlasmids: {
        label: (data: any) => `${data.snvLibPlasmids?.length || 0} SNV-lib`,
        action: (data: any) => {
            router.push({ path: '/snv-lib-plasmids', query: { 'targetId': data.id } })
        },
        tooltip: 'SNV-lib',
    },
    pellets: {
        label: (data: any) => `${_.sumBy(data.transfectTargets, (x: any) => x.pellets.length)}`,
        action: (data: any) => {
            router.push({ path: '/pellets', query: { 'transfectTarget.target.id': data.id } })
        },
        iconComponent: h(Icon, { name: 'mdi:dots-triangle', class: 'm-1' }),
        iconPos: 'right',
        tooltip: 'Pellets',
    },
    duplicate: {
        index: -1,
        icon: 'pi pi-copy',
        class: 'invisible group-hover:visible',
        action: async (data: any) => {
            const target: any = await $fetch(`/api/targets/${data.id}`)
            if (!_.isEmpty(target)) {
                const { id, ...fields } = target
                addRecordValues.value = { ...fields, name: `${fields.name}_copy` }
                crudTable.state.showAddForm = true
                crudTable.state.showEditForm = false
            }
        }
    }
}

const columnDefs: ColumnDefinitions = {
    name: { index: 0 },
    regionId: { display: false },
    chromosome: {
        header: 'Chromosome',
        format: (x) => _.has(x, 'region.gene.chromosome') ? `chr${x.region.gene.chromosome}` : '',
        path: 'chromosome.displayValue',
        type: 'string',
        index: 1,
    },
    gene: {
        header: 'Gene',
        format: (x) => `${_.get(x, 'region.gene.symbol')} (${_.get(x, 'region.gene.ncbiAccession')})`,
        path: 'gene.displayValue',
        index: 2,
    },
    region: { header: 'Region', path: 'region.name', index: 3 },
    projectId: { display: false },
    project: { path: 'project.name', index: 4 },
    fixedEdits: {
        format: (x) => _.isArray(x.fixedEdits) ? x.fixedEdits.join(', ') : '',
        path: 'fixedEdits.displayValue',
        type: 'string',
        index: 5,
    },
    transfectTargets: { display: false },
    plasmids: { display: false },
    amplificationPrimers: {
        format: (x) => _.isArray(x.amplificationPrimers) ? _.map(x.amplificationPrimers, (y) => `${_.toUpper(y.sequenceType?.[0])}:${y.sequence}`) : '',
        type: 'element',
        element: (x: any) => {
            const value = _.isArray(x.amplificationPrimers) ? _.join(_.map(x.amplificationPrimers, (y) => `${_.toUpper(y.sequenceType?.[0])}:${y.sequence}`), ', ') : ''
            const href = `/amplification-primers?targetId=${x.id}`
            return value ? `${value}<a href="${href}" class="text-blue-500 hover:underline"><span class="iconify mdi--link-variant" /></a>` : ''
        },
        path: 'amplificationPrimers.displayValue',
        exportValue: (x) => _.isArray(x.amplificationPrimers) ? _.join(_.map(x.amplificationPrimers, (y) => `${_.toUpper(y.sequenceType?.[0])}:${y.sequence}`), ', ') : '',
    },
    preseq2Primers: {
        format: (x) => _.isArray(x.preseq2Primers) ? _.map(x.preseq2Primers, (y) => `${_.toUpper(y.sequenceType?.[0])}:${y.sequence}`) : '',
        type: 'element',
        element: (x: any) => {
            const value = _.isArray(x.preseq2Primers) ? _.join(_.map(x.preseq2Primers, (y) => `${_.toUpper(y.sequenceType?.[0])}:${y.sequence}`), ', ') : ''
            const href = `/preseq-2-primers?targetId=${x.id}`
            return value ? `${value}<a href="${href}" class="text-blue-500 hover:underline"><span class="iconify mdi--link-variant" /></a>` : ''
        },
        path: 'preseq2Primers.displayValue',
        exportValue: (x) => _.isArray(x.preseq2Primers) ? _.join(_.map(x.preseq2Primers, (y) => `${_.toUpper(y.sequenceType?.[0])}:${y.sequence}`), ', ') : '',
    },
    linearizationPrimers: { display: false },
    homologyArmPrimers: { display: false },
    preseq1PrimerTargets: { display: false },
    sgRnaPlasmidTargets: { display: false },
    snvLibPlasmids: { display: false },
    sequence: { bodyClass: 'break-all min-w-64' },
}

const fieldConfigs: FormFieldConfigs = {
    regionId: {
        label: 'Region',
        autoCompleter: {
            searchBaseUrl: '/api/regions',
            searchFields: ['name', 'gene.symbol'],
            valueField: 'id',
            displayFormat: (x: any) => `${x.gene.symbol}: ${x.name}`,
            searchWithClause: { gene: { columns: { symbol: true } } },
        },
    },
    projectId: {
        label: 'Project',
        autoCompleter: {
            searchBaseUrl: '/api/projects',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    'fixedEdits.*': { canUpdate: true },
    'skipPositions.*': { canUpdate: true },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="targets"
                :zodSchema="schemas.targets.select"
                title="Targets"
                :row-actions="rowActions"
                :where="whereClauses"
                :column-defs="columnDefs"
                :with-clause="displayWithClause"
                :rows-per-page-options="[10, 25, 50, 100]"
                :show-column-filters="true"
                :can-edit-multiple="true"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/targets"
                submitMethod="POST"
                :zodSchema="schemas.targets.insert"
                :readonlyValues="readonlyValues"
                :fieldConfigs="fieldConfigs"
                :initialValues="addRecordValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/targets"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/targets"
                submitMethod="PUT"
                :zodSchema="schemas.targets.update"
                :readonlyValues="readonlyValues"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/targets"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/targets"
                submitMethod="PUT"
                :zodSchema="schemas.targets.update"
                :readonlyValues="readonlyValues"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
