<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'
import type { Dna, Rna } from '~/server/db/schema/sge/nucleic-acid'

const route = useRoute()
const toast = useToast()
const pelletsCrudTable = useCrudTable()
const dnaCrudTable = useCrudTable()
const rnaCrudTable = useCrudTable()
const showPelletsFromAllDays = ref(false)
const protocol = ref('AllPrep')

const pelletsWhereClause = computed(() => {
    return showPelletsFromAllDays.value ?
        {
            'and':[
                {'==':[{'var': 'dna'}, null]},
                {'==':[{'var': 'rna'}, null]},
            ]
        } :
        {
            'and':[
                {'==':[{'var': 'dna'}, null]},
                {'==':[{'var': 'rna'}, null]},
                {'in':[{'var': 'harvestDay'}, [5, 13]]},
            ]
        }
})
const extractionExperiment = ref()
const showDnaEditDialog = computed(() => {
    return dnaCrudTable.state.showEditForm || dnaCrudTable.state.showMultipleEditForm
})
const showRnaEditDialog = computed(() => {
    return rnaCrudTable.state.showEditForm || rnaCrudTable.state.showMultipleEditForm
})

onMounted(async() => {
    const extractionExperimentId = route.params.id as string
    extractionExperiment.value = await $fetch(`/api/extraction-experiments/${extractionExperimentId}`)
})

const extractFromSelectedPellets = async () => {
    const dnaToAdd = ['AllPrep', 'DNeasy'].includes(protocol.value) ? _.map(pelletsCrudTable.tableRef.value.selectedRecords, (pellet) => {
        return {
            pelletId: pellet.id,
            extractionExperimentId: route.params.id,
            protocol: protocol.value,
        }
    }) : []
    const rnaToAdd =  ['AllPrep', 'RNeasy'].includes(protocol.value) ? _.map(pelletsCrudTable.tableRef.value.selectedRecords, (pellet) => {
        return {
            pelletId: pellet.id,
            extractionExperimentId: route.params.id,
            protocol: protocol.value,
        }
    }) : []
    try {
        const dnaAdded = !_.isEmpty(dnaToAdd) ? await $fetch('/api/dna', { method: 'POST', body: dnaToAdd }) as Dna[] : []
        if (!_.isEmpty(dnaAdded)) {
            toast.add({
                severity: 'success',
                summary: 'DNA added',
                detail: `${_.size(dnaAdded)} DNA records added`,
                life: 3000,
            })
            // add dna to dna table and remove from pellets table
            dnaCrudTable.tableRef.value.addOrRefreshRecordIds(_.map(dnaAdded, 'id'))
            _.forEach(dnaAdded, (x) => {
                pelletsCrudTable.tableRef.value.removeRecordId(x.pelletId)
            })
            pelletsCrudTable.tableRef.value.selectedRecords = []
        } else if (!_.isEmpty(dnaToAdd)) {
            toast.add({
                severity: 'error',
                summary: 'Error adding DNA',
                detail: `Failed to add DNA records`,
                life: 3000,
            })
        }
        const rnaAdded = !_.isEmpty(rnaToAdd) ? await $fetch('/api/rna', { method: 'POST', body: rnaToAdd }) as Rna[] : []
        if (!_.isEmpty(rnaAdded)) {
            toast.add({
                severity: 'success',
                summary: 'RNA added',
                detail: `${_.size(rnaAdded)} RNA records added`,
                life: 3000,
            })
            // add rna to rna table and remove from pellets table
            rnaCrudTable.tableRef.value.addOrRefreshRecordIds(_.map(rnaAdded, 'id'))
            _.forEach(rnaAdded, (x) => {
                pelletsCrudTable.tableRef.value.removeRecordId(x.pelletId)
            })
            pelletsCrudTable.tableRef.value.selectedRecords = []
        } else if (!_.isEmpty(rnaToAdd)) {
            toast.add({
                severity: 'error',
                summary: 'Error adding RNA',
                detail: `Failed to add RNA records`,
                life: 3000,
            })
        }
    } catch (e: any) {
        toast.add({
            severity: 'error',
            summary: 'Error adding nucleic acids',
            detail: e.data?.statusMessage || 'Unknown error',
            life: 3000,
        })
    }
}

const didDeleteMultipleDnaRna = (event: any[]) => {
    pelletsCrudTable.tableRef.value.addOrRefreshRecordIds(_.map(event, 'pelletId'))
}
const pelletsWithClause = Object.freeze({
    transfectTarget: {
        columns: {},
        with: {
            target: {
                columns: {
                    name: true
                },
                with: {
                    region: {
                        columns: {
                            name: true
                        },
                        with: {
                            gene: {
                                columns: {
                                    symbol: true
                                }
                            }
                        }
                    }
                }
            },
            experiment: {
                columns: {
                    id: true,
                    name: true
                },
            }
        }
    },
    dna: {
        columns: {
            id: true
        }
    },
    rna: {
        columns: {
            id: true
        }
    },
})
const pelletsColumnDefs: ColumnDefinitions = {
    name: {
        index: 0,
    },
    transfectTarget: {
        header: 'Target',
        format: (x: any) => { return _.get(x, 'transfectTarget.target.name') || `${_.get(x, 'transfectTarget.target.region.gene.symbol')} : ${_.get(x, 'transfectTarget.target.region.name')}`},
        path: 'transfectTarget.displayValue',
        type: 'string',
        index: 1,
    },
    transfectTargetId: {display: false},
    extractionExperimentId: {display: false},
    harvestedOn: {display: false},
    harvestedBy: {display: false},
    d3Confluency: {display: false},
}

const dnaRnaWithClause = {
    pellet: {
        columns: {
            name: true,
        }
    }
}
const dnaRnaColumnDefs: ColumnDefinitions = {
    name: {
        path: 'pellet.name',
        index: 0,
    },
    protocol: {
        index: 1,
    },
    extractionExperimentId: {
        display: false,
    },
    pelletId: {
        display: false,
    },
    concentration: {
        header: 'Conc (ng/μL)',
    },
    volume: {
        header: 'Vol (μL)',
    },
    yield: {
        header: 'Yield (μg)',
        format: (x: any) => {
            return calculateYield(x.concentration, x.volume) || ''
        },
        path: 'yield.displayValue',
    },
}
const dnaRnaFieldConfigs: FormFieldConfigs = {
    extractionExperimentId: {
        display: false,
    },
    pelletId: {
        label: 'Pellet',
        autoCompleter: {
            searchBaseUrl: '/api/pellets',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name', 'isBackup'],
            displayFormat: (x: any) => x.isBackup ? `${x.name} (backup)` : x.name,
        }
    },
    concentration: {
        label: 'Concentration (ng/μL)',
    },
    volume: {
        label: 'Volume (μL)',
    },
}
</script>
<template>
    <div class="flex flex-col h-full overflow-y-hidden">
        <div class="flex w-full mt-5 ml-5">
            <h4>Extraction experiment: {{ extractionExperiment?.name }} </h4>
        </div>
        <Splitter class="h-full overflow-y-hidden">
            <SplitterPanel :size="50">
                <SmartTable
                    :ref="pelletsCrudTable.setTableRef"
                    table-name="pellets"
                    title="Pellets"
                    :zodSchema="schemas.pellets.select"
                    :column-defs="pelletsColumnDefs"
                    :with-clause="pelletsWithClause"
                    :where="pelletsWhereClause"
                    :can-add="false"
                    :can-delete="false"
                    :can-edit="false"
                    :can-export="false"
                    :hide-settings="true"
                    :rows-per-page-options="[10, 25, 50, 100]"
                >
                    <template #header-buttons>
                        <SelectButton
                            v-model="protocol"
                            :allow-empty="false"
                            class="protocol-select"
                            :options="['AllPrep', 'DNeasy', 'RNeasy']"
                        />
                        <Button
                            iconPos="right"
                            severity="warn"
                            class="flex-none"
                            :label="protocol === 'AllPrep' ? 'Extract DNA+RNA' : (protocol === 'RNeasy' ? 'Extract RNA' : 'Extract DNA')"
                            :disabled="_.isEmpty(pelletsCrudTable.tableRef.value?.selectedRecords)"
                            @click="extractFromSelectedPellets" />
                            <span class="flex items-center space-x-2">
                                <label>Day 5 & 13</label>
                                <ToggleSwitch id="showPelletsFromAllDaysToggle" v-model="showPelletsFromAllDays" />
                                <label for="showPelletsFromAllDaysToggle">
                                    All days
                                </label>
                            </span>
                    </template>
                </SmartTable>
            </SplitterPanel>
            <SplitterPanel :size="25" :minSize="10">
                <SmartTable
                    :ref="dnaCrudTable.setTableRef"
                    table-name="dna"
                    title="DNA"
                    :zodSchema="schemas.dna.select"
                    :where="{'==':[{'var': 'extractionExperimentId'}, route.params.id]}"
                    :with-clause="dnaRnaWithClause"
                    :column-defs="dnaRnaColumnDefs"
                    :can-add="false"
                    :can-delete="true"
                    :can-edit="true"
                    :can-edit-multiple="true"
                    :can-export="false"
                    :hide-settings="true"
                    @clicked-record-edit="dnaCrudTable.didClickRecordEdit"
                    @clicked-multiple-record-edit="dnaCrudTable.didClickMultipleRecordEdit"
                    @did-delete-multiple-records="didDeleteMultipleDnaRna"
                />
            </SplitterPanel>
            <SplitterPanel :size="25" :minSize="10">
                <SmartTable
                    :ref="rnaCrudTable.setTableRef"
                    table-name="rna"
                    title="RNA"
                    :zodSchema="schemas.rna.select"
                    :where="{'==':[{'var': 'extractionExperimentId'}, route.params.id]}"
                    :with-clause="dnaRnaWithClause"
                    :column-defs="dnaRnaColumnDefs"
                    :can-add="false"
                    :can-delete="true"
                    :can-edit="true"
                    :can-edit-multiple="true"
                    :can-export="false"
                    :hide-settings="true"
                    @clicked-record-edit="rnaCrudTable.didClickRecordEdit"
                    @clicked-multiple-record-edit="rnaCrudTable.didClickMultipleRecordEdit"
                    @did-delete-multiple-records="didDeleteMultipleDnaRna"
                />
            </SplitterPanel>
        </Splitter>
        <Dialog v-model:visible="showDnaEditDialog" modal header="Edit DNA" :style="{ width: 'auto' }" :closable="false">
            <RecordsSmartForm
                v-if="dnaCrudTable.state.editingRecordId && dnaCrudTable.state.showEditForm"
                selectUrl="/api/dna"
                :recordIds="[dnaCrudTable.state.editingRecordId]"
                submitUrl="/api/dna"
                submitMethod="PUT"
                :zodSchema="schemas.dna.update"
                :can-delete="true"
                :fieldConfigs="dnaRnaFieldConfigs"
                @cancel="dnaCrudTable.didClickCancelEditForm"
                @record-update="dnaCrudTable.didUpdateRecord"
                @record-delete="dnaCrudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="dnaCrudTable.state.showMultipleEditForm"
                selectUrl="/api/dna"
                :recordIds="dnaCrudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/dna"
                submitMethod="PUT"
                :zodSchema="schemas.dna.update"
                :fieldConfigs="dnaRnaFieldConfigs"
                @cancel="dnaCrudTable.didClickCancelMultipleEditForm"
                @records-update="dnaCrudTable.didUpdateMultipleRecords"
            />
        </Dialog>
        <Dialog v-model:visible="showRnaEditDialog" modal header="Edit RNA" :style="{ width: 'auto' }" :closable="false">
            <RecordsSmartForm
                v-if="rnaCrudTable.state.editingRecordId && rnaCrudTable.state.showEditForm"
                selectUrl="/api/rna"
                :recordIds="[rnaCrudTable.state.editingRecordId]"
                submitUrl="/api/rna"
                submitMethod="PUT"
                :zodSchema="schemas.rna.update"
                :can-delete="true"
                :fieldConfigs="dnaRnaFieldConfigs"
                @cancel="rnaCrudTable.didClickCancelEditForm"
                @record-update="rnaCrudTable.didUpdateRecord"
                @record-delete="rnaCrudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="rnaCrudTable.state.showMultipleEditForm"
                selectUrl="/api/rna"
                :recordIds="rnaCrudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/rna"
                submitMethod="PUT"
                :zodSchema="schemas.rna.update"
                :fieldConfigs="dnaRnaFieldConfigs"
                @cancel="rnaCrudTable.didClickCancelMultipleEditForm"
                @records-update="rnaCrudTable.didUpdateMultipleRecords"
            />
        </Dialog>
    </div>
</template>
<style scoped>
.protocol-select :deep(.p-togglebutton.p-togglebutton-checked::before) {
    background-color: theme('colors.blue.500');
}
.protocol-select :deep(.p-togglebutton.p-togglebutton-checked .p-togglebutton-label) {
    color: theme('colors.white');
}
</style>
