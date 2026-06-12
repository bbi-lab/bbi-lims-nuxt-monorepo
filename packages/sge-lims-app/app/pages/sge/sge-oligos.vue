<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()

const columnDefs: ColumnDefinitions = {
    name: { index: 0 },
    target: {
        header: 'Target',
        index: 1,
        path: 'target.name',
    },
    sequence: {
        index: 2,
        bodyClass: 'max-w-64 truncate',
    },
    libraryType: {
        header: 'Library Type',
        index: 3,
    },
    sgeOligoLots: {
        header: 'Twist Lot(s)',
        index: 4,
        format: (data: any) => {
            return _.map(data.sgeOligoLots, (sgeOligoLot: any) => sgeOligoLot.lot?.lotNumber).filter(Boolean)
        },
        path: 'sgeOligoLots.displayValue',
    },
    notes: { index: 5 },
    targetId: { display: false },
}

const fieldConfigs: FormFieldConfigs = {
    name: { index: 0 },
    targetId: {
        label: 'Target',
        autoCompleter: {
            searchBaseUrl: '/api/targets',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
        index: 1,
    },
    sequence: {
        index: 2,
    },
    libraryType: {
        label: 'Library Type',
        index: 3,
    },
    'sgeOligoLots.*': {
        label: 'Twist Lots',
        component: 'InputArray',
        canDelete: true,
        canUpdate: true,
        props: {
            components: [
                {
                    variableField: 'lotId',
                    label: 'Lot',
                    component: 'AutoCompleter',
                    componentProps: {
                        searchBaseUrl: '/api/lots',
                        searchFields: ['lotNumber'],
                        valueField: 'id',
                        displayFields: ['lotNumber'],
                        dropdown: true,
                        searchWithClause: { reagent: true },
                        searchWhereClause: { '==': [{ 'toLower': { 'var': 'reagent.name' } }, 'twist'] },
                    },
                },
            ],
        },
        index: 4,
    },
    notes: { index: 5 },
}

const displayWithClause = {
    target: {
        columns: { id: true, name: true },
    },
    sgeOligoLots: {
        with: {
            lot: {
                columns: { id: true, lotNumber: true },
            },
        },
    },
}

const formWithClause = {
    target: {
        columns: { id: true, name: true },
    },
    sgeOligoLots: {
        with: {
            lot: {
                columns: { id: true, lotNumber: true },
            },
        },
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="sge-oligos"
                :zodSchema="schemas.sgeOligos.select"
                title="SGE Oligos"
                :column-defs="columnDefs"
                :with-clause="displayWithClause"
                :rows-per-page-options="[10, 25, 50, 100]"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/sge-oligos"
                submitMethod="POST"
                :zodSchema="schemas.sgeOligos.insert"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/sge-oligos"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/sge-oligos"
                submitMethod="PUT"
                :zodSchema="schemas.sgeOligos.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :with-clause="formWithClause"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
