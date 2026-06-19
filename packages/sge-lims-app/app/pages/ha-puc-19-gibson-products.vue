
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
    haCloningExperiment: {
        header: 'HA Cloning Experiment',
        type: 'element',
        element: (data: any) => {
            const href = data.haCloningExperimentId ? `/ha-cloning-experiments?id=${data.haCloningExperimentId}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${data.haCloningExperimentName}</a>` : null
        },
        exportValue: (data: any) => {
            return _.get(data, 'haCloningExperimentName', '')
        },
        index: 1,
    },
    haCloningExperimentId: { display: false },
    haCloningExperimentName: { display: false },
    haPuc19PcrProductId: { display: false },
    haPuc19PcrProductName: { display: false },
    haPcrProductId: { display: false },
    haPcrProductName: { display: false },
    puc19VectorConcentration: {
        header: 'pUC19 Vector Conc. (ng/µL)',
        index: 2,
    },
    puc19VectorAmount: {
        header: 'pUC19 Vector Amount (ng)',
        index: 3,
    },
    quant: {
        header: 'Quant (ng/µL)',
        index: 4,
    },
    haPcrProductLength: {
        header: 'Insert DNA Length (bp)',
        index: 5,
        bodyClass: 'italic font-bold',
    },
    insertDnaMass: {
        header: 'Insert DNA - 2:1 (ng)',
        index: 6,
        format: (data: any) => _.round(data.insertDnaMass, 1),
        exportValue: (data: any) => {
            return _.get(data, 'insertDnaMass.originalValue')
        },
        path: 'insertDnaMass.displayValue',
        bodyClass: 'italic font-bold',
    },
    insertVolume: {
        header: 'Insert volume (µL)',
        index: 6,
        format: (data: any) => data.insertVolume ? _.round(data.insertVolume, 1) : null,
        exportValue: (data: any) => {
            return _.get(data, 'insertVolume.originalValue')
        },
        path: 'insertVolume.displayValue',
        bodyClass: 'italic font-bold',
    },
    vectorVolume: {
        header: 'Vector volume (µL)',
        index: 7,
        format: (data: any) => data.vectorVolume ? _.round(data.vectorVolume, 1) : null,
        exportValue: (data: any) => {
            return _.get(data, 'vectorVolume.originalValue')
        },
        path: 'vectorVolume.displayValue',
        bodyClass: 'italic font-bold',
    },
    totalVolume: {
        header: 'Insert + Vector Volume (µL)',
        index: 7,
        format: (data: any) => data.insertVolume ? _.round(data.totalVolume, 1) : null,
        exportValue: (data: any) => {
            return _.get(data, 'totalVolume.originalValue')
        },
        path: 'totalVolume.displayValue',
        bodyClass: 'italic font-bold',
    },
    totalReactionVolume: {
        header: 'Total Reaction Volume (µL)',
        index: 8,
    },
    twoXNebuilderReagentVolume: {
        header: '2X NEBuilder Reagent Volume (µL)',
        index: 9,
        bodyClass: 'italic font-bold',
        format: (data: any) => data.twoXNebuilderReagentVolume ? _.round(data.twoXNebuilderReagentVolume, 1) : null,
        exportValue: (data: any) => {
            return _.get(data, 'twoXNebuilderReagentVolume.originalValue')
        },
        path: 'twoXNebuilderReagentVolume.displayValue',
    },
    h2oVolume: { display: false },
    h2oVolumeFormatted: {
        header: 'H₂O Volume (µL)',
        index: 10,
        type: 'element',
        element: (data: any) => {
            const bodyClass = data.h2oVolume < 0 ? 'text-red-500 italic font-bold' : 'italic font-bold'
            return _.isNumber(data.h2oVolume) ? `<span class="${bodyClass}">${_.round(data.h2oVolume, 1)}</span>` : ''
        },
        exportValue: (data: any) => {
            return data?.h2oVolume
        },
    },
}
const fieldConfigs: FormFieldConfigs = {
    name: {
        index: 0,
    },
    haPuc19PcrProductId: {
        label: 'HA pUC19 PCR Product',
        autoCompleter: {
            searchBaseUrl: '/api/ha-puc-19-pcr-products',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
        index: 1,
    },
    preppedById: {
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        }
    },
    puc19VectorConcentration: {
        label: 'pUC19 Vector Concentration (ng/µL)',
    },
    puc19VectorAmount: {
        label: 'pUC19 Vector Amount (ng)',
        subtext: 'Vector Size (bp): 2649',
    },
    quant: {
        label: 'Quant (ng/µL)',
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
                table-name="view-ha-puc-19-gibson-products-with-calcs"
                :zodSchema="schemas.haPuc19GibsonProducts.select"
                title="HA pUC19 Gibson products"
                :column-defs="columnDefs"
                :where="whereClauses"
                :can-edit-multiple="true"
                :can-delete="false"
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
                submitUrl="/api/ha-puc-19-gibson-products"
                submitMethod="POST"
                :zodSchema="schemas.haPuc19GibsonProducts.insert"
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
                selectUrl="/api/ha-puc-19-gibson-products"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/ha-puc-19-gibson-products"
                submitMethod="PUT"
                :zodSchema="schemas.haPuc19GibsonProducts.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/ha-puc-19-gibson-products"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/ha-puc-19-gibson-products"
                submitMethod="PUT"
                :zodSchema="schemas.haPuc19GibsonProducts.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
    <Dialog
        v-model:visible="showCalcsInfo"
        header="HA pUC19 Gibson product calculations"
        :modal="true"
        :closable="true"
        :style="{width: '50vw'}"
    >
        <template #closebutton>
            <Button icon="pi pi-times" class="p-button-text" severity="secondary" @click="showCalcsInfo = false" />
        </template>
        <div class="mb-4">
            The following calculations are used for HA pUC19 Gibson products:
        </div>
        <ul class="list-disc list-inside mb-4">
            <li>Insert DNA length = HA PCR product stop position - HA PCR product start position + 1</li>
            <li>Insert DNA mass (ng) = Insert length (bp) / pUC19 Vector length (bp) * Vector amount (ng) * 2 </li>
            <li>Insert volume (µL) = Insert DNA mass (ng) / Quant (ng/µL)</li>
            <li>Vector volume (µL) = pUC19 Vector amount (ng) / pUC19 Vector Concentration (ng/µL)</li>
            <li>Total volume (µL) = Insert volume (µL) + Vector volume (µL)</li>
            <hr></hr>
            <li>2x NEBuilder reagent volume (µL) = Total reaction volume (µL) / 2</li>
            <li>H₂O volume (µL) = 2x NEBuilder reagent volume (µL) - Total volume (µL)</li>
        </ul>
        <div>Precise values are used for calculations, and rounded to 1 decimal place for display.</div>
        <div>For reference, the pUC19 vector length is <i><b>2649</b></i> bp.</div>
    </Dialog>
</template>
