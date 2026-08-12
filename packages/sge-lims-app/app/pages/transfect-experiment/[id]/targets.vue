<script setup lang="ts">
import { schemas } from '#shared/db/zod/zodSchemas'
import _ from 'lodash'

const crudTable = useCrudTable()
const route = useRoute()

const tableTitle = ref<string>()
const rowActions = {}

onMounted(async() => {
    if (route.params.id) {
        const experiment = await $fetch(`/api/transfect-experiments/${route.params.id}`, { query: { with: JSON.stringify({cycle: {columns: {name: true}}}) } }) as { cycle: { name: string } }
        tableTitle.value = `${experiment.cycle.name}: targets`
    } else {
        tableTitle.value = 'Transfection experiment targets'
    }
})

const columnDefs: ColumnDefinitions = {
    target: {
        format: (x: any) => { return x.target?.name || `${x.target?.region?.gene?.symbol}: ${x.target?.region?.name}` },
        path: 'target.displayValue',
        type: 'string',
        index: 0,
    },
    replicateCount: {
        header: 'Number of replicates',
        format: (x: any) => { return x.experiment.replicateCount || '' },
        path: 'replicateCount.displayValue',
        index: 1,
    },
    transfectionCount: {
        header: 'Transfections per replicate',
        index: 2,
    },
    negativeControl: {
        header: 'Negative control',
        type: 'boolean',
        index: 3,
    },
    totalTransfections: {
        header: 'Total transfections',
        format: (x: any) => {
            return (x.experiment.replicateCount && x.transfectionCount) ?
                (x.experiment.replicateCount * x.transfectionCount + (x.negativeControl ? 1 : 0)) :
                ''
        },
        index: 4,
        path: 'totalTransfections.displayValue',
    },
    experimentId: {
        display: false,
    },
    targetId: {
        display: false,
    },
    snvLib: {
        header: 'SNV library',
        format: (x: any) => { return x.snvLib?.name },
        path: 'snvLib.displayValue',
        index: 5,
    },
    snvLibraryConc: {
        header: 'SNV library conc. (ng/μL)',
        index: 6,
    },
    snvLibraryQuantity: {
        header: 'SNV library quantity (μg)',
        index: 7,
    },
    snvLibraryToQuantityVol: {
        header: 'Vol. of SNVlib to quantity (μL)',
        format: (x: any) => {
            return x.snvLibraryConc ? _.round((x.snvLibraryQuantity * 1000) / x.snvLibraryConc, 1).toFixed(1) : ''
        },
        path: 'snvLibraryToQuantityVol.displayValue',
        index: 8,
    },
    sgRna: {
        header: 'sgRNA',
        format: (x: any) => { return x.sgRna?.name },
        path: 'sgRna.displayValue',
        index: 9,
    },
    sgRnaConc: {
        header: 'Current sgRNA conc. (ng/μL)',
        index: 10,
    },
    sgRnaQuantity: {
        header: 'sgRNA quantity (μg)',
        index: 11,
    },
    sgRnaToQuantityVol: {
        header: 'Vol. of sgRNA to quantity (μL)',
        format: (x: any) => {
            return x.sgRnaConc ? _.round((x.sgRnaQuantity * 1000) / x.sgRnaConc, 1).toFixed(1) : ''
        },
        path: 'sgRnaToQuantityVol.displayValue',
        index: 12,
    },
    sgRnaNegControl: {
        header: 'sgRNA negative control',
        index: 13,
    },
    hprt1SgRnaConc: {
        header: 'HPRT1 sgRNA conc. (ng/μL)',
        index: 14,
    },
    hprt1SgRnaToQuantityVol: {
        header: 'Vol. of HPRT1 sgRNA to quantity (μL)',
        format: (x: any) => {
            return x.hprt1SgRnaConc ? _.round((x.sgRnaQuantity * 1000) / x.hprt1SgRnaConc, 1).toFixed(1) : ''
        },
        path: 'hprt1SgRnaToQuantityVol.displayValue',
        index: 15,
    },
    xfectBuffer: {
        header: 'Xfect Buffer (μL)',
        index: 16,
    },
    xfectPolymerPerTransfect: {
        header: 'Xfect polymer (μL) per transfection',
        index: 17,
    },
    snvLibNeeded: {
        header: 'SNV library needed (μL)',
        format: (x: any) => {
            if (x.experiment.replicateCount && x.transfectionCount && x.snvLibraryConc && x.transfectionCount && x.snvLibraryQuantity) {
                const totalTransfections = x.experiment.replicateCount * x.transfectionCount + (x.negativeControl ? 1 : 0)
                return _.round((x.snvLibraryQuantity * 1000) / x.snvLibraryConc * totalTransfections, 1).toFixed(1)
            } else {
                return ''
            }
        },
        path: 'snvLibNeeded.displayValue',
        index: 18,
    },
    sgRnaNeeded: {
        header: 'sgRNA needed (μL)',
        format: (x: any) => {
            if (x.experiment.replicateCount && x.transfectionCount && x.sgRnaConc && x.transfectionCount && x.sgRnaQuantity) {
                const totalTransfections = x.experiment.replicateCount * x.transfectionCount
                return _.round((x.sgRnaQuantity * 1000) / x.sgRnaConc * totalTransfections, 1).toFixed(1)
            } else {
                return ''
            }
        },
        path: 'sgRnaNeeded.displayValue',
        index: 19,
    },
    notes: {
        index: 20,
        header: 'Notes',
    },
    snvLibPlasmidId: {
        display: false,
    },
    sgRnaPlasmidId: {
        display: false,
    },
}

// Generate field configs from column defs to avoid repeating ourselves
const editFormFieldConfigs: FormFieldConfigs = _.mapValues(columnDefs, (v: any, k) => {
    return {
        display: v.display ?? true,
        label: v.header || k,
        index: v.index,
    }
})
// Include an AutoCompleter widget for adding new targets
editFormFieldConfigs['targetId'] = {
    label: 'Target',
    autoCompleter: {
        searchBaseUrl: '/api/targets',
        searchFields: ['region.gene.symbol', 'region.name', 'name'],
        valueField: 'id',
        displayFormat: (x: any) => {
            return x.name ?? `${x.region?.gene?.symbol}: ${x.region?.name}`
        },
        searchWithClause: {region: {columns: {name: true}, with: {gene: {columns: {symbol:true}}}}},
    },
    readonly: true,
    index: 0,
}
editFormFieldConfigs['transfectionCount'] = {
    label: 'Transfections per replicate',
    index: 1,
}
editFormFieldConfigs['snvLibPlasmidId'] = {
    label: 'SNV library',
    autoCompleter: (record: any) => ({
        searchBaseUrl: '/api/snv-lib-plasmids',
        searchFields: ['name'],
        valueField: 'id',
        displayFields: ['name'],
        dropdown: true,
        searchWhereClause: {"==" : [ {"var":"targetId"}, record.targetId] },
    }),
    dynamicKey: (record: any) => {
        return record.targetId ? `snvLibPlasmidId-${record.targetId}` : 'snvLibPlasmidId'
    },
    display: (record: any) => {
        return !!record.targetId
    },
    index: 5,
}
editFormFieldConfigs['sgRnaPlasmidId'] = {
    label: 'sgRNA',
    autoCompleter: (record: any) => ({
        searchBaseUrl: '/api/sg-rna-plasmids',
        searchFields: ['name'],
        valueField: 'id',
        displayFields: ['name'],
        dropdown: true,
        searchWithClause: {sgRnaPlasmidTargets: true},
        searchWhereClause: {"some": [{"var": "sgRnaPlasmidTargets"}, {"==": [{"var": "targetId"}, record.targetId]}]},
    }),
    dynamicKey: (record: any) => {
        return record.targetId ? `sgRnaPlasmidId-${record.targetId}` : 'sgRnaPlasmidId'
    },
    display: (record: any) => {
        return !!record.targetId
    },
    index: 8,
}

const addFormFieldConfigs = _.cloneDeep(editFormFieldConfigs)
_.set(addFormFieldConfigs, 'targetId.readonly', false)

const readonlyValues = {experimentId: route.params.id}

const displayWithClause = {
    target: {
        columns: {name: true},
        with: {
            region: {
                columns: {name: true},
                with: {
                    gene: {
                        columns: {symbol: true}
                    }
                }
            }
        }
    },
    experiment: {
        columns: {cycle: true, replicateCount: true},
    },
    snvLib: true,
    sgRna: true,
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="transfect-targets"
                :zodSchema="schemas.transfectTargets.select"
                :title="tableTitle"
                :row-actions="rowActions"
                :column-defs="columnDefs"
                :where="{'==':[{'var': 'experimentId'}, route.params.id]}"
                :with-clause="displayWithClause"
                :rows-per-page-options="[10, 25, 50, 100]"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/transfect-targets"
                submitMethod="POST"
                :zodSchema="schemas.transfectTargets.insert"
                :fieldConfigs="addFormFieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/transfect-targets"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/transfect-targets"
                submitMethod="PUT"
                :zodSchema="schemas.transfectTargets.update"
                :can-delete="true"
                :fieldConfigs="editFormFieldConfigs"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
