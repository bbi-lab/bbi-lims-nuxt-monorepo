<script setup lang="ts">
import _ from 'lodash'
import Papa from 'papaparse'
import { schemas } from '#shared/db/zod/zodSchemas'

const toast = useToast()
const crudTable = useCrudTable()

const rowActions = {
    targets: {
        action: async (data: any) => {
            const result: any[] = await $fetch(`/api/custom/genes/${data.id}/export-targets`)
            if (!_.isEmpty(result)) {
                const csv = Papa.unparse(result, {delimiter: '\t'})
                const blob = new Blob([csv], { type: 'text/tab-separated-values;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `${data.symbol}_targets.tsv`)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            } else {
                toast.add({severity: 'warn', summary: 'No targets found'})
            }
        },
        icon: 'pi pi-fw pi-download',
        iconPos: 'right',
        tooltip: 'Targets',
    },
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
                table-name="genes"
                :zodSchema="schemas.genes.select"
                title="Genes"
                :can-add="false"
                :can-delete="false"
                :selection-mode="'single'"
                :column-defs="columnDefs"
                :row-actions="rowActions"
                :rows-per-page-options="[10, 25, 50, 100]"
                :show-column-filters="true"
                @clicked-record-edit="crudTable.didClickRecordEdit"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/genes"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/genes"
                submitMethod="PUT"
                :zodSchema="schemas.genes.update"
                :can-delete="false"
                :readonly="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
