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
        index: 2,
        path: 'sgRnaPlasmidTargets.displayValue',
    },
    project: {
        header: 'Project',
        format: (data: any) => {
            return _.join(_.uniq(_.compact(_.map(data.sgRnaPlasmidTargets, 'target.project.name'))), ',')
        },
        index: 3,
        path: 'project.displayValue',
    },
    plateWellLocation: {
        header: 'Plate: Well Location',
        format: (data: any) => {
            return _.map(data.wellable?.wellContents || [], (wellContent: any) => {
                const well = wellContent.well
                return `${well.plate.name}: ${wellCoordinateToChar(well.y)}${well.x}`
            }).join(', ')
        },
        path: 'plateWellLocation.displayValue',
        index: 5,
    },
    sgRnaCloningExperiment: {
        header: 'sgRNA Cloning Experiment',
        format: (data: any) => {
            return _.uniq(_.compact(_.flatMap(data.wellable?.wellContents || [], (wellContent: any) => {
                return _.map(wellContent.well?.plate?.sgRnaCloningExperiments, 'name')
            }))).join(', ')
        },
        path: 'sgRnaCloningExperiment.displayValue',
        index: 4,
    },
    benchlingLink: {
        format: 'hyperlink',
        index: 6,
    },
    genewizOrderNumber: {
        header: 'GeneWiz Order Number',
    },
    targetId: { display: false},
    wellContents: { display: false },
    status: {
        type: 'element',
        element: (data: any) => recordStatusTag(data.status),
        // format sets status.displayValue, which the column sorts, searches and exports on
        format: (data: any) => recordStatusLabel(data.status),
        path: 'status.displayValue',
        index: 1,
    },
}
const fieldConfigs: FormFieldConfigs = {
    name: {
        index: 0,
    },
    status: {
        index: 1,
    },
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
    benchlingLink: {
        type: 'hyperlink',
    },
    genewizOrderNumber: {
        label: 'GeneWiz Order Number',
    },
    clonedOn: {
        dateType: 'date',
    },
}
const displayWithClause = {
    sgRnaPlasmidTargets: {
        with: {
            target: {
                columns: {name: true, id: true},
                with: {
                    project: {columns: {name: true}},
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
                :rows-per-page-options="[10, 25, 50, 100]"
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
