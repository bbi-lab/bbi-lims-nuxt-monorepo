<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()

const columnDefs: ColumnDefinitions = {
    startedUseOn: {
        format: 'date-time'
    },
    endedUseOn: {
        format: 'date-time'
    },
    expiresOn: {
        format: 'date-time'
    },
    lotNumber: {
        index: 0,
    },
    reagent: {
        path: 'reagent.name',
        index: 1,
    },
    inHouse: {
        index: 2,
    },
    status: {
        index: 3,
    },
    concentration: {
        format: ({concentration, reagent}) => { return reagent.soluteUnit && reagent.volumeUnit ? `${concentration || '--'} ${reagent.soluteUnit}/${reagent.volumeUnit}` : ''},
        path: 'concentration.displayValue',
        type: 'string',
        index: 4,
    },
    startingVolume: {
        format: ({startingVolume, reagent}) => { return reagent.volumeUnit ? `${startingVolume || '--'} ${reagent.volumeUnit}` : ''},
        path: 'startingVolume.displayValue',
        type: 'string',
        index: 5,
    },
    remainingVolume: {
        format: ({remainingVolume, reagent}) => { return reagent.volumeUnit ? `${remainingVolume || '--'} ${reagent.volumeUnit}` : ''},
        path: 'remainingVolume.displayValue',
        type: 'string',
        index: 5,
    },
}

const fieldConfigs: FormFieldConfigs = {
    reagentId: {
        label: 'Reagent',
        autoCompleter: {
            searchBaseUrl: '/api/reagents',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
        }
    },
    concentration: {
        label: (_data, relatedData) => {
            if (_.isObject(relatedData?.reagent)) {
                return `Concentration (${_.get(relatedData.reagent, 'soluteUnit')}/${_.get(relatedData.reagent, 'volumeUnit')})`
            } else {
                return 'Concentration'
            }
        }
    },
    startingVolume: {
        label: (_data, relatedData) => {
            if (_.isObject(relatedData?.reagent)) {
                return `Starting Volume (${_.get(relatedData.reagent, 'volumeUnit')})`
            } else {
                return 'Starting Volume'
            }
        }
    },
    remainingVolume: {
        label: (_data, relatedData) => {
            if (_.isObject(relatedData?.reagent)) {
                return `Remaining Volume (${_.get(relatedData.reagent, 'volumeUnit')})`
            } else {
                return 'Remaining Volume'
            }
        }
    }
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="lots"
                :zodSchema="schemas.lots.select"
                title="Lots"
                :column-defs="columnDefs"
                :with-clause="{reagent: true}"
                :can-edit-multiple="true"
                :rows-per-page-options="[10, 25, 50, 100]"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/lots"
                submitMethod="POST"
                :zodSchema="schemas.lots.insert"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/lots"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/lots"
                submitMethod="PUT"
                :zodSchema="schemas.lots.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/lots"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/lots"
                submitMethod="PUT"
                :zodSchema="schemas.lots.update"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
