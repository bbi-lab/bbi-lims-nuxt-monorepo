<script setup lang="ts">
import { Icon } from '#components'
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const router = useRouter()
const crudTable = useCrudTable()

async function didAddRecord(event: any) {
    crudTable.tableRef.value.addOrRefreshRecordIds([event.id])
    crudTable.state.showAddForm = false
}

const columnDefs: ColumnDefinitions = {
    startedOn: {
        format: 'date-time',
        index: 2,
    },
    plate: {
        display: false,
    },
    technician: {
        path: 'technician.name',
        index: 3,
    },
    pcrType: {
        display: false,
    },
    transfectTargetId: {
        display: false,
    },
    name: {
        index: 0,
    },
    plateId: {
        display: false,
    },
    notes: {
        display: false,
    },
    pcrTypeLabel: {
        header: 'Type',
        format: (x: any) => {
            return _.get(x, 'pcrTypeRef.label')
        },
        path: 'pcrTypeLabel.displayValue',
        index: 1,
    },
    cycleTarget: {
        header: 'Cycle: target(s)',
        format: (x: any) => {
            return _.map(x.pcrExperimentTargets, (t: any) => {
                return t.transfectTarget ? `${t.transfectTarget?.experiment?.cycle?.name}: ${t.transfectTarget?.target?.name}` : ''}).join('; ')
        },
        path: 'cycleTarget.displayValue',
    },
    gelImagesLink: {
        format: 'hyperlink',
    },
    pcrExperimentTargets: {
        display: false,
    },
    technicianId: { display: false },
}

const rowActions = {
    plate: {
        label: (data: any) => { return `${data.plate ? 1 : 0}`},
        action: (data: any) => {
            const plateType = data.pcrType == 'rna-rt' ? 'rna-rt-storage' : data.pcrType
            router.push({path:`/plate-layout/${plateType}/${data.plate?.id}`})
        },
        iconComponent: h(Icon, { name: 'ph:grid-nine-fill', class: 'm-1' }),
        iconPos: 'right',
        tooltip: 'Layout',
    },
    volume: {
        action: (data: any) => {
            if (['dna-preseq-1', 'rna-preseq-1'].includes(data.pcrType)) {
                router.push({path: `/preseq-1/volume-calcs/${data.id}`})
            } else if (['dna-preseq-2', 'rna-preseq-2'].includes(data.pcrType)) {
                router.push({path: `/preseq-2/volume-calcs/${data.id}`})
            } else if (['dna-preseq-3', 'rna-preseq-3'].includes(data.pcrType)) {
                router.push({path: `/preseq-3/volume-calcs/${data.id}`})
            }
        },
        visible: (data: any) => ['dna-preseq-1', 'rna-preseq-1', 'dna-preseq-2', 'rna-preseq-2', 'dna-preseq-3', 'rna-preseq-3'].includes(data.pcrType),
        tooltip: 'Volume calcs',
        icon: 'pi pi-calculator',
        iconPos: 'right',
    },
}

const addFieldConfigs: FormFieldConfigs = {
    pcrType: {
        autoCompleter: {
            searchBaseUrl: '/api/pcr-types',
            valueField: 'value',
            displayFields: ['label'],
            searchFields: ['label'],
            dropdown: true,
        },
    },
    plateId: {
        // only display with widget for RNA RT experiments, all other PCR experiments have 96-well plates created automatically
        display: (x: any) => {
            return x.pcrType == 'rna-rt'
        },
        label: 'Storage Box',
        autoCompleter: {
            searchBaseUrl: '/api/plates',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
            searchWhereClause: {
                '==': [{'var': 'plateType'}, 'rna-rt-storage'],
            },
        },
    },
    startedOn: {
        inputType: 'date',
    },
    pcrExperimentTargets: {
        label: 'Targets',
        display: (x: any) => {
            return _.includes(['rna-rt','dna-preseq-1'], x.pcrType)
        },
        // NOTE: flat had fixedSize:(r)=>r.pcrType==='dna-preseq-1' (no add/delete for dna-preseq-1).
        // Deferred — function-valued canAdd/canDelete is a separate lims-layer change; static true for now.
        inputArray: {
            canAdd: true,
            canDelete: true,
            fieldConfigs: {
                transfectTargetId: {
                    label: 'Target',
                    autoCompleter: {
                        searchBaseUrl: '/api/transfect-targets',
                        searchFields: ['target.name', 'target.region.gene.symbol', 'target.region.name', 'experiment.cycle.name'],
                        valueField: 'id',
                        displayFormat: (x: any) => {
                            const targetName = x.target?.name ?? `${x.target?.region?.gene?.symbol}:${x.target?.region?.name}`
                            const cycleName = x.experiment?.cycle?.name
                            return cycleName ? `${targetName} (${cycleName})` : targetName
                        },
                        searchWithClause: {
                            target: {columns: {name: true}, with: {region: {columns: {name: true}, with: {gene: {columns: {symbol: true}}}}}},
                            experiment: {columns: {}, with: {cycle: {columns: {name: true}}}},
                        },
                        inputClass: 'w-64',
                    },
                },
            },
        },
    },
}

const editFieldConfigs: FormFieldConfigs = {
    ...addFieldConfigs,
    pcrType: {
        readonly: true,
    },
}

const withClause = {
    plate: {columns: {id: true}},
    technician: {columns: {name: true}},
    pcrTypeRef: {columns: {label: true}},
    pcrExperimentTargets: {
        with: {
            transfectTarget: {
                with: {
                    target: {
                        columns: {
                            name: true
                        },
                    },
                    experiment: {
                        columns: {},
                        with: {
                            cycle: {
                                columns: {
                                    name: true
                                }
                            }
                        }
                    }
                },
            }
        }
    },
}

const formWithClause = {
    plate: {
        columns: {
            id: true,
            name: true,
        },
    },
    pcrExperimentTargets: {
        with: {
            transfectTarget: {
                with: {
                    target: {
                        columns: {
                            name: true
                        },
                    },
                    experiment: {
                        columns: {},
                        with: {
                            cycle: {
                                columns: {
                                    name: true
                                }
                            }
                        }
                    }
                },
            }
        }
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="pcr-experiments"
                :zodSchema="schemas.pcrExperiments.select"
                title="PCR Experiments"
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
                submitUrl="/api/pcr-experiments"
                submitMethod="POST"
                :zodSchema="schemas.pcrExperiments.insert"
                :fieldConfigs="addFieldConfigs"
                :with-clause="formWithClause"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/pcr-experiments"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/pcr-experiments"
                submitMethod="PUT"
                :zodSchema="schemas.pcrExperiments.update"
                :can-delete="true"
                :fieldConfigs="editFieldConfigs"
                :with-clause="formWithClause"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
