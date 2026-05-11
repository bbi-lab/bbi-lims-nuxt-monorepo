<script setup lang="ts">
import _ from 'lodash'
// import Papa from 'papaparse'
import { schemas } from '../../shared/db/zod/zodSchemas'
import { v4 as uuidv4 } from 'uuid'

// const config = useRuntimeConfig()
// const toast = useToast()
const crudTable = useCrudTable()
const route = useRoute()

const whereClauses = ref()
const readonlyValues = ref<Record<string, unknown>>({})
const tableKey = ref(uuidv4())

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const rowActions = {
    // targets: {
    //     action: async (data: any) => {
    //         const result: any[] = await $fetch(`${config.public.apiBase}/custom/genes/${data.id}/export-targets`)
    //         if (!_.isEmpty(result)) {
    //             const csv = Papa.unparse(result, {delimiter: '\t'})
    //             const blob = new Blob([csv], { type: 'text/tab-separated-values;charset=utf-8;' })
    //             const url = URL.createObjectURL(blob)
    //             const link = document.createElement('a')
    //             link.href = url
    //             link.setAttribute('download', `${data.symbol}_targets.tsv`)
    //             document.body.appendChild(link)
    //             link.click()
    //             document.body.removeChild(link)
    //         } else {
    //             toast.add({severity: 'warn', summary: 'No targets found'})
    //         }
    //     },
    //     icon: 'pi pi-fw pi-download',
    //     iconPos: 'right',
    //     tooltip: 'Targets',
    // },
}
const columnDefs: ColumnDefinitions = {
    ncbiAccession: {
        header: 'NCBI accession'
    },
    ncbiGeneId: {
        header: 'NCBI Gene ID'
    },
    startPosition: {
        header: 'Start'
    },
    endPosition: {
        header: 'End'
    },
    regions: { display: false },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                :key="tableKey"
                tableName="genes"
                :zodSchema="schemas.genes.select"
                title="Genes"
                :where="whereClauses"
                :canAdd="false"
                :canDelete="false"
                selectionMode="single"
                :columnDefs="columnDefs"
                :rowActions="rowActions"
                :rowsPerPageOptions="[10, 25, 50, 100]"
                :showColumnFilters="true"
                @clickedRecordEdit="crudTable.didClickRecordEdit"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/genes"
                :recordIds="[crudTable.state.editingRecordId]"
                :zodSchema="schemas.genes.update"
                :readOnly="true"
                :canDelete="false"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
