<script setup lang="ts">
import { Icon } from '#components'
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()
const router = useRouter()

const rowActions = {
    plate: {
        label: (data: any) => { return `${data.plateId ? 1 : 0}`},
        action: (data: any) => {
            router.push({path:`/plasmid-experiment/sg-rna/${data.id}`})
        },
        iconComponent: h(Icon, { name: 'ph:grid-nine-fill', class: 'm-1' }),
        iconPos: 'right',
        tooltip: 'Plates',
    }
}

const columnDefs: ColumnDefinitions = {
    technician: {
        path: 'technician.name',
    },
    plateId: {
        display: false,
    },
    name: {
        index: 1,
    },
    notes: {
        display: false
    },
    technicianId: { display: false },
}

const fieldConfigs: FormFieldConfigs = {
    plateId: {
        label: 'Plate',
        autoCompleter: {
            placeholderValue: '(Create a new plate)',
            searchBaseUrl: '/api/plates',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
            searchWhereClause: {
                'and': [
                    {'==': [{'var': 'plateType'}, 'sg-rna-oligo']},
                    {'==': [{'var': 'sgRnaCloningExperiments'}, '']}
                ],
            },
            searchWithClause: {
                sgRnaCloningExperiments: {
                    columns: {
                        id: true,
                    },
                },
            }
        },
    },
}

const withClause = {
    technician: { columns: { name: true } },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="sg-rna-cloning-experiments"
                :zodSchema="schemas.sgRnaCloningExperiments.select"
                title="sgRNA Cloning"
                :row-actions="rowActions"
                :with-clause="withClause"
                :column-defs="columnDefs"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/sg-rna-cloning-experiments"
                submitMethod="POST"
                :zodSchema="schemas.sgRnaCloningExperiments.insert"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/sg-rna-cloning-experiments"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/sg-rna-cloning-experiments"
                submitMethod="PUT"
                :zodSchema="schemas.sgRnaCloningExperiments.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
