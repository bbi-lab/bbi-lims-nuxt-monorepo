<script setup lang="ts">
import { Icon } from '#components'
import _ from 'lodash'
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '#shared/db/zod/zodSchemas'

const router = useRouter()
const crudTable = useCrudTable()
const route = useRoute()
const whereClauses = ref()
const readonlyValues = ref({})
const tableKey = ref()

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

function getPelletCount(targets: any) {
    if (_.isArray(targets)) {
        return _.reduce(targets, (sum, {pellets}) => {
            return sum + (pellets?.length || 0)
        }, 0)
    } else {
        return 0
    }
}

const editWithClause = Object.freeze({transfectTargets: {with: {target:  true}}})
const displayWithClause = Object.freeze({
    cycle: {columns: {name: true}},
    technician: {columns: {name: true}},
    transfectLotUsage: {columns: {},
        with: {
            lot:  {
                columns: {
                    lotNumber: true
                }
            },
        }
    },
    transfectTargets:{
        columns: {
            transfectionCount: true,
        },
        with: {
            target:  {
                columns: {
                    name: true,

                },
                with: {
                    region:{
                        columns: {name: true},
                        with: {
                            gene: {
                                columns: {symbol: true}
                            }
                        }
                    },
                }
            },
            pellets: {
                columns: {
                    id: true
                }
            }
        }
    },
})

const columnDefs: ColumnDefinitions = {
    cycleId: {
        header: 'Cycle',
        index: 1,
        path: 'cycle.name',
    },
    startedOn: {
        format: 'date-time',
        index: 3,
    },
    currentDay: {
        header: 'Current day #',
        format: (x) => {
            const days = moment().diff(moment(x.startedOn), 'days')
            return days ? `Day ${days > 17 ? '17+' : days}` : ''
        },
        path: 'currentDay.displayValue',
        type: 'string',
        index: 3,
    },
    replicateCount: {
        header: 'Number of replicates',
        index: 4,
    },
    transfectionCount: {
        display: false,
    },
    transfectionsPerReplicate: {
        header: 'Transfections per replicate',
        format: (x) => {
            const transfectionCounts = _.map(x.transfectTargets, 'transfectionCount')
            const minTransfectionsPerReplicate = _.min(transfectionCounts)
            const maxTransfectionsPerReplicate = _.max(transfectionCounts)
            return minTransfectionsPerReplicate == maxTransfectionsPerReplicate ? minTransfectionsPerReplicate : `${minTransfectionsPerReplicate} - ${maxTransfectionsPerReplicate}`
        },
        path: 'transfectionsPerReplicate.displayValue',
        index: 5,
    },
    // negativeControlCount: {
    //     header: 'Negative control',
    //     format: (x) => {
    //         return x.negativeControl ? '1' : '0'
    //     },
    //     path: 'negativeControlCount.displayValue',
    //     type: 'string',
    //     index: 6,
    // },
    // negativeControl: {
    //     display: false,
    // },
    totalTransfections: {
        header: 'Total transfections',
        format: (x) => {
            const transfectionCountsWithNegControl = _.map(x.transfectTargets, (target) => { return target.transfectionCount + (target.negativeControl ? 1 : 0) })
            const minTransfectionsPerReplicate = _.min(transfectionCountsWithNegControl)
            const maxTransfectionsPerReplicate = _.max(transfectionCountsWithNegControl)
            if (!minTransfectionsPerReplicate) {
                return ''
            } else {
                return minTransfectionsPerReplicate == maxTransfectionsPerReplicate ?
                    _.toString(minTransfectionsPerReplicate * x.replicateCount) :
                    `${minTransfectionsPerReplicate * x.replicateCount} - ${maxTransfectionsPerReplicate * x.replicateCount}`
            }
        },
        path: 'totalTransfections.displayValue',
        index: 7,
    },
    transfectTargets: {
        header: 'Targets',
        format: (x) => _.join(_.map(_.get(x, 'transfectTargets', []), (y) => {
            return  y.target?.name || `${y.target?.region?.gene?.symbol}: ${y.target?.region?.name}`
        }), ', '),
        path: 'transfectTargets.displayValue',
        type: 'string',
        index: 8,
    },
    transfectLotUsage: {
        header: 'Reagents',
        format: (x) => _.join(_.map(_.get(x, 'transfectLotUsage', []), (y) => {
            return  y.lot.lotNumber
        }), ', '),
        path: 'transfectLotUsage.displayValue',
        type: 'string',
        index: 9,
    },
    technician: {
        path: 'technician.name',
    },
}

const rowActions = {
    targets: {
        label: (data: any) => { return `${data.transfectTargets?.length || 0}`},
        action: (data: any) => {
            router.push({path:`/transfect-experiment/${data.id}/targets`})
        },
        icon: 'pi pi-fw pi-bullseye',
        iconPos: 'right',
        tooltip: 'Targets',
    },
    pellets: {
        label: (data: any) => { return `${getPelletCount(data.transfectTargets)}`},
        action: (data: any) => {
            router.push({path:'/pellets', query: {'transfectTarget.experiment.id': data.id}})
        },
        iconComponent: h(Icon, { name: 'mdi:dots-triangle', class: 'm-1' }),
        iconPos: 'right',
        tooltip: 'Pellets',
    },
    reagents: {
        label: (data: any) => { return `${data.transfectLotUsage?.length || 0}`},
        action: (data: any) => {
            router.push({path:`/transfect-experiment/${data.id}/lot-usage`})
        },
        iconComponent: h(Icon, { name: 'mdi:beaker-outline', class: 'm-1' }),
        iconPos: 'right',
        tooltip: 'Reagents',
    },
    harvest: {
        label: () => 'Harvest',
        action: (data: any) => {
            router.push({path:`/transfect-experiment/${data.id}/harvest`})
        },
        severity: 'warn',
        icon: 'pi pi-bolt',
        iconPos: 'right',
    },
}

const fieldConfigs: FormFieldConfigs = {
    cycleId: {
        label: 'Cycle',
        autoCompleter: {
            searchBaseUrl: '/api/cycles',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        }
    },
    replicateCount: {
        label: 'Number of replicates',
        min: 1,
        max: 9,
    },
    'transfectTargets.*': {
        label: 'Targets',
        component: 'InputArray',
        canDelete: false,
        canUpdate: false,
        props: {
            components: [
                {
                    variableField: 'targetId',
                    label: 'Target',
                    component: 'AutoCompleter',
                    componentProps: {
                        searchBaseUrl: '/api/targets',
                        searchFields: ['region.gene.symbol', 'region.name', 'name'],
                        valueField: 'id',
                        inputClass: 'w-64',
                        displayFormat: (x: any) => {
                            return x.name ?? `${x.region?.gene?.symbol}: ${x.region?.name}`
                        },
                        searchWithClause: {region: {columns: {name: true}, with: {gene: {columns: {symbol:true}}}}},
                    },
                },
                {
                    variableField: 'transfectionCount',
                    component: 'InputNumber',
                    label: 'transfections per replicate',
                    componentProps:{
                        inputClass: 'w-40',
                        defaultValue: 3,
                        showButtons: true,
                        allowEmpty: false,
                        min: 1,
                    },
                },
                {
                    variableField: 'negativeControl',
                    component: 'Checkbox',
                    label: 'NC',
                },
            ]
        }
    },
    startedOn: {
        dateType: 'date',
    },
}

</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="transfect-experiments"
                :zodSchema="schemas.transfectExperiments.select"
                title="Transfection experiments"
                :row-actions="rowActions"
                :with-clause="displayWithClause"
                :column-defs="columnDefs"
                :where="whereClauses?.[0]"
                sortField="cycle.name"
                :sortOrder="-1"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
         <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/transfect-experiments"
                submitMethod="POST"
                :zodSchema="schemas.transfectExperiments.insert"
                :fieldConfigs="{...fieldConfigs, 'transfectTargets.*': {display: false}}"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/transfect-experiments"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/transfect-experiments"
                submitMethod="PUT"
                :zodSchema="schemas.transfectExperiments.update"
                :with-clause="editWithClause"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :can-delete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
