<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'
import { wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'

const crudTable = useCrudTable()
const route = useRoute()

const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, any>>({})

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const columnDefs: ColumnDefinitions = {
    name: {
        index: 0,
    },
    sgRnaPlasmidTargets: {
        header: 'Targets',
        format: (data: any) => {
            return _.map(data.sgRnaPlasmidTargets, 'target.name')
        },
        index: 1,
        path: 'sgRnaPlasmidTargets.displayValue',
    },
    plateWellLocation: {
        header: 'Plate: Well Location',
        format: (data: any) => {
            const wellContents = data.wellable?.wellContents || []
            if (wellContents.length > 0) {
                const well = wellContents[0].well
                return `${well.plate.name}: ${wellCoordinateToChar(well.y)}${well.x}`
            }
            return ''
        },
        path: 'plateWellLocation.displayValue',
        index: 4,
    },
    sgRnaCloningExperiment: {
        header: 'sgRNA Cloning Experiment',
        format: (data: any) => {
            // each sgRNA plasmid should only be associated with one well and one cloning experiment
            return data.wellable?.wellContents?.[0]?.well.plate?.sgRnaCloningExperiments?.[0]?.name || ''
        },
        path: 'sgRnaCloningExperiment.displayValue',
        index: 2,
    },
    externalLink: {
        format: 'hyperlink',
        index: 3,
    },
    targetId: { display: false},
    wellContents: { display: false },
}
const fieldConfigs: FormFieldConfigs = {
    sgRnaPlasmidTargets: {
        label: 'Targets',
        inputArray: {
            fieldConfigs: {
                targetId: {
                    label: 'Target',
                    autoCompleter: {
                        searchBaseUrl: '/api/targets',
                        searchFields: ['name'],
                        valueField: 'id',
                        displayFields: ['name'],
                        dropdown: true,
                    },
                },
            },
        },
    },
    externalLink: {
        type: 'hyperlink',
    },
}
const displayWithClause = {
    sgRnaPlasmidTargets: {
        with: {
            target: {
                columns: {name: true, id: true},
                with: {
                    region: {
                        columns: {name: true},
                        with: {
                            gene: {columns: {symbol: true}}
                        }
                    }
                }
            }
        }
    },
    wellable: {
        with: {
            wellContents: {
                columns: {id: true, name: true},
                with: {
                    well: {
                        columns: {id: true, name: true, x: true, y: true},
                        with: {
                            plate: {
                                columns: {id: true, name: true},
                                with: {
                                    sgRnaCloningExperiments: {columns: {id: true, name: true}}
                                }
                            }
                        }
                    }
                }
            },
        }
    },
}

const editWithClause = {
    sgRnaPlasmidTargets: {
        with: {
            target: {
                columns: {id: true, name: true},
            }
        }
     },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="sg-rna-plasmids"
                :zodSchema="schemas.sgRnaPlasmids.select"
                title="sgRNA Plasmids"
                :column-defs="columnDefs"
                :with-clause="displayWithClause"
                :where="whereClauses"
                :can-edit-multiple="true"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
                @clicked-multiple-record-edit="crudTable.didClickMultipleRecordEdit"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm || crudTable.state.showMultipleEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/sg-rna-plasmids"
                submitMethod="POST"
                :zodSchema="schemas.sgRnaPlasmids.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/sg-rna-plasmids"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/sg-rna-plasmids"
                submitMethod="PUT"
                :zodSchema="schemas.sgRnaPlasmids.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                :with-clause="editWithClause"
                :can-delete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.showMultipleEditForm"
                selectUrl="/api/sg-rna-plasmids"
                :recordIds="crudTable.state.editingMultipleRecordsIds"
                submitUrl="/api/sg-rna-plasmids"
                submitMethod="PUT"
                :zodSchema="schemas.sgRnaPlasmids.update"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelMultipleEditForm"
                @records-update="crudTable.didUpdateMultipleRecords"
            />
        </SplitterPanel>
    </Splitter>
</template>
