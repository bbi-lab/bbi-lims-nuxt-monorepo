
<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()
const route = useRoute()
const {user} = useUserSession()

const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, any>>({})
const showCalcsInfo = ref(false)

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const columnDefs: ColumnDefinitions = {
    name: {
        index: 0,
    },
    snvLibCloningExperiment: {
        header: 'SNVlib Cloning Experiment',
        type: 'element',
        element: (data: any) => {
            const href = data.snvLibCloningExperimentId ? `/snv-lib-cloning-experiments?id=${data.snvLibCloningExperimentId}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${data.snvLibCloningExperimentName}</a>` : null
        },
        exportValue: (data: any) => {
            return _.get(data, 'snvLibCloningExperimentName', '')
        },
        index: 2,
    },
    snvLibCloningExperimentId: { display: false },
    snvLibCloningExperimentName: { display: false },
    ampProductId: { display: false },
    linProductId: { display: false },
    linProductVectorAmount: {
        header: 'LIN Product Vector Amount (ng)',
        index: 4,
    },
    quant: {
        header: 'Quant (ng/µL)',
        index: 5,
    },
    gibsonOn: {
        index: 6,
    },
    gibsonByName: {
        header: 'Gibson By',
        index: 7,
    },
    cleanedOn: {
        index: 8,
    },
    cleanedByName: {
        header: 'Cleaned By',
        index: 9,
    },
    transformedOn: {
        index: 10,
    },
    transformedByName: {
        header: 'Transformed By',
        index: 11,
    },
    preppedOn: {
        index: 12,
    },
    preppedByName: {
        header: 'Prepped By',
        index: 13,
    },
    plasmidsaurusChecked: {
        header: 'Plasmidsaurus Checked',
        index: 14,
    },
    ngsChecked: {
        header: 'NGS Checked',
        index: 15,
    },
    passedQc: {
        header: 'Passed QC',
        index: 16,
    },
    benchlingLink: {
        format: 'hyperlink',
        index: 17,
    },
    notes: {
        index: 18,
    },
    ampProductName: {
        header: 'AMP Product Name',
        bodyClass: 'italic font-bold',
    },
    ampProductSize: {
        header: 'AMP Product Size (bp)',
        bodyClass: 'italic font-bold',
    },
    ampProductConcentration: {
        header: 'AMP Product Conc. (ng/µL)',
        bodyClass: 'italic font-bold',
    },
    linProductName: {
        header: 'LIN Product Name',
        bodyClass: 'italic font-bold',
    },
    linProductConcentration: {
        header: 'LIN Product Conc. (ng/µL)',
        bodyClass: 'italic font-bold',
    },
    linProductSize: {
        header: 'LIN Product Size (bp)',
        bodyClass: 'italic font-bold',
    },
    ampProductVectorAmount: {
        header: 'AMP Product Vector Amount (ng)',
        bodyClass: 'italic font-bold',
        format: (data: any) => {
            return data.ampProductVectorAmount ? _.round(data.ampProductVectorAmount, 1) : null
        },
        exportValue: (data: any) => {
            return _.get(data, 'ampProductVectorAmount')
        },
        path: 'ampProductVectorAmount.displayValue',
    },
    ampVolume: {
        header: 'AMP Volume (µL)',
        bodyClass: 'italic font-bold',
        format: (data: any) => {
            return data.ampVolume ? _.round(data.ampVolume, 1) : null
        },
        exportValue: (data: any) => {
            return _.get(data, 'ampVolume.originalValue')
        },
        path: 'ampVolume.displayValue',
    },
    linVolume: {
        header: 'LIN Volume (µL)',
        bodyClass: 'italic font-bold',
        format: (data: any) => {
            return data.linVolume ? _.round(data.linVolume, 1) : null
        },
        exportValue: (data: any) => {
            return _.get(data, 'linVolume.originalValue')
        },
        path: 'linVolume.displayValue',
    },
    totalVolume: {
        header: 'Total Volume (µL)',
        bodyClass: 'italic font-bold',
        format: (data: any) => {
            return data.totalVolume ? _.round(data.totalVolume, 1) : null
        },
        exportValue: (data: any) => {
            return _.get(data, 'totalVolume.originalValue')
        },
        path: 'totalVolume.displayValue',
    },
    totalReactionVolume: {
        header: 'Total Reaction Volume (µL)',
    },
    twoXNebuilderReagentVolume: {
        header: '2x NEBuilder Reagent Volume (µL)',
        bodyClass: 'italic font-bold',
        format: (data: any) => {
            return data.twoXNebuilderReagentVolume ? _.round(data.twoXNebuilderReagentVolume, 1) : null
        },
        exportValue: (data: any) => {
            return _.get(data, 'twoXNebuilderReagentVolume.originalValue')
        },
        path: 'twoXNebuilderReagentVolume.displayValue',
    },
    ncWaterVolume: { display: false },
    ncWaterVolumeFormatted: {
        header: 'NC Water Volume (µL)',
        type: 'element',
        element: (data: any) => {
            const bodyClass = data.ncWaterVolume < 0 ? 'text-red-500 italic font-bold' : 'italic font-bold'
            return _.isNumber(data.ncWaterVolume) ? `<span class="${bodyClass}">${_.round(data.ncWaterVolume, 1)}</span>` : ''
        },
        exportValue: (data: any) => {
            return data?.ncWaterVolume
        },
    },
    h2oVolume: { display: false },
    h2oVolumeFormatted: {
        header: 'H₂O Volume (µL)',
        type: 'element',
        element: (data: any) => {
            const bodyClass = data.h2oVolume < 0 ? 'text-red-500 italic font-bold' : 'italic font-bold'
            return _.isNumber(data.h2oVolume) ? `<span class="${bodyClass}">${_.round(data.h2oVolume, 1)}</span>` : ''
        },
        exportValue: (data: any) => {
            return data?.h2oVolume
        },
    },
    gibsonById: { display: false },
    cleanedById: { display: false },
    transformedById: { display: false },
    preppedById: { display: false },
    status: {
        type: 'element',
        element: (data: any) => recordStatusTag(data.status),
        // format sets status.displayValue, which the column sorts, searches and exports on
        format: (data: any) => recordStatusLabel(data.status),
        path: 'status.displayValue',
        index: 1,
    },
}
const fieldConfigs: FormFieldConfigs = {
    name: {
        index: 0,
    },
    status: {
        index: 1,
    },
    snvLibCloningExperimentId: {
        label: 'SNVlib Cloning Experiment',
        autoCompleter: {
            searchBaseUrl: '/api/snv-lib-cloning-experiments',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
        index: 2,
    },
    linProductVectorAmount: {
        label: 'LIN Product Vector Amount (ng)',
        index: 3,
    },
    gibsonById: {
        label: 'Gibson By',
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    transformedById: {
        label: 'Transformed By',
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    cleanedById: {
        label: 'Cleaned By',
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    preppedById: {
        label: 'Prepped By',
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    quant: {
        label: 'Quant (ng/µL)',
    },
    ngsChecked: {
        label: 'NGS Checked',
    },
    passedQc: {
        label: 'Passed QC',
    },
    totalReactionVolume: {
        label: 'Total Reaction Volume (µL)',
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="view-snv-lib-gibson-products"
                :zodSchema="schemas.snvLibGibsonProducts.select"
                title="SNVlib Gibson products"
                :column-defs="columnDefs"
                :where="whereClauses"
                :can-edit-multiple="true"
                :can-delete="false"
                :rows-per-page-options="[10, 25, 50, 100]"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
            >
                <template #header-buttons>
                    <Button
                        icon="pi pi-info-circle"
                        severity="info"
                        label="Calcs"
                        @click="showCalcsInfo = true"
                    />
                </template>
            </SmartTable>
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/snv-lib-gibson-products"
                submitMethod="POST"
                :zodSchema="schemas.snvLibGibsonProducts.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :initialValues="{
                    preppedOn: new Date(),
                    preppedById: _.get(user, 'id'),
                    puc19VectorAmount: 50,
                }"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/snv-lib-gibson-products"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/snv-lib-gibson-products"
                submitMethod="PUT"
                :zodSchema="schemas.snvLibGibsonProducts.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/snv-lib-gibson-products"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/snv-lib-gibson-products"
                submitMethod="PUT"
                :zodSchema="schemas.snvLibGibsonProducts.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
    <Dialog
        v-model:visible="showCalcsInfo"
        header="SNVlib Gibson product calculations"
        :modal="true"
        :closable="true"
        :style="{width: '50vw'}"
    >
        <template #closebutton>
            <Button icon="pi pi-times" class="p-button-text" severity="secondary" @click="showCalcsInfo = false" />
        </template>
        <div class="mb-4">
            The following calculations are used for SNVlib Gibson products:
        </div>
        <ul class="list-disc list-inside mb-4">
            <li>AMP product size (bp) = AMP product stop position - AMP product start position + 1</li>
            <li>LIN product size (bp) = HA PCR product size (bp) + pUC19 vector size (bp) - AMP product size (bp)</li>
            <li>AMP product vector amount (ng) = 7 * AMP product size (bp) / LIN product size (bp) * LIN product vector amount (ng)</li>
            <li>AMP volume (µL) = AMP product vector amount (ng) / AMP product concentration (ng/µL)</li>
            <li>LIN volume (µL) = LIN product vector amount (ng) / LIN product concentration (ng/µL)</li>
            <li>Total volume (µL) = AMP volume (µL) + LIN volume (µL)</li>
            <hr></hr>
            <li>2x NEBuilder reagent volume  (µL) = Total reaction volume (µL) / 2</li>
            <li>NC water volume (µL) = 2x NEbuilder reagent volume  (µL) - LIN volume (µL)</li>
            <li>H₂O volume (µL) = 2x NEBuilder reagent volume  (µL) - Total volume (µL)</li>
        </ul>
        <div>Precise values are used for calculations, and rounded to 1 decimal place for display.</div>
        <div>For reference, the pUC19 vector size is <i><b>2649</b></i> bp.</div>
        <div>AMP product concentration: AMP product quant </div>
        <div>LIN product concentration: LIN product quant </div>
    </Dialog>
</template>
