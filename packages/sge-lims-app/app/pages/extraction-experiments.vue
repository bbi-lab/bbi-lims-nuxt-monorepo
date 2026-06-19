<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const router = useRouter()
const crudTable = useCrudTable()

const displayWithClause = Object.freeze({
    technician: {columns: {name: true}},
    extractionLotUsage: {columns: {},
        with: {
            lot:  {
                columns: {
                    lotNumber: true
                }
            },
        }
    },
    dna: {columns: {id: true}},
    rna: {columns: {id: true}},
})

const columnDefs: ColumnDefinitions = {
    extractedOn: {
        format: 'date-time'
    },
    technician: {
        path: 'technician.name'
    },
    dna: {
        display: false,
    },
    rna: {
        display: false,
    },
    extractionLotUsage: {
        header: 'Reagents',
        format: (x) => _.join(_.map(_.get(x, 'extractionLotUsage', []), (y) => {
            return  y.lot.lotNumber
        }), ', '),
        path: 'extractionLotUsage.displayValue',
        type: 'string',
    },
}

const rowActions = {
    dna: {
        label: (data: any) => { return `${_.size(data.dna)}`},
        action: (data: any) => {
            router.push({path:'/dna', query: {'extractionExperimentId': data.id}})
        },
        iconComponent: h(Icon, { name: 'mdi:molecule', class: 'm-1' }),
        iconPos: 'right',
        tooltip: 'DNA',
    },
    rna: {
        label: (data: any) => { return `${_.size(data.rna)}`},
        action: (data: any) => {
            router.push({path:'/rna', query: {'extractionExperimentId': data.id}})
        },
        iconComponent: h(Icon, { name: 'mdi:molecule', class: 'm-1' }),
        iconPos: 'right',
        tooltip: 'RNA',
    },
    reagents: {
        label: (data: any) => { return `${data.extractionLotUsage?.length || 0}`},
        action: (data: any) => {
            router.push({path:`/extraction-experiment/${data.id}/lot-usage`})
        },
        iconComponent: h(Icon, { name: 'mdi:beaker-outline', class: 'm-1' }),
        iconPos: 'right',
        tooltip: 'Reagents',
    },
    extraction: {
        label: () => 'Extraction',
        action: (data: any) => {
            router.push({path:`/extraction-experiment/${data.id}/extraction`})
        },
        severity: 'warn',
        icon: 'pi pi-bolt',
        iconPos: 'right',
    },
}

const fieldConfigs: FormFieldConfigs = {
    extractedOn: {
        inputType: 'date'
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="extraction-experiments"
                :zodSchema="schemas.extractionExperiments.select"
                title="Extraction experiments"
                :row-actions="rowActions"
                :with-clause="displayWithClause"
                :column-defs="columnDefs"
                sortField="extractedOn"
                :sortOrder="-1"
                :rowsPerPageOptions="[10, 25, 50, 100]"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/extraction-experiments"
                submitMethod="POST"
                :zodSchema="schemas.extractionExperiments.insert"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/extraction-experiments"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/extraction-experiments"
                submitMethod="PUT"
                :zodSchema="schemas.extractionExperiments.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
