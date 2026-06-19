<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()

const columnDefs: ColumnDefinitions = {
    name: {index: 1},
    sgRnaOligoTargets: {
        header: 'Targets',
        index: 2,
        format: (data: any) => {
            return _.map(data.sgRnaOligoTargets, (sgRnaOligoTarget: any) => {
                return sgRnaOligoTarget.target.name
            })
        },
        path: 'sgRnaOligoTargets.displayValue',
    },
    project: {
        header: 'Project',
        index: 3,
        format: (data: any) => {
            return _.uniq(_.map(data.sgRnaOligoTargets, (sgRnaOligoTarget: any) => {
                return sgRnaOligoTarget.target?.project?.name
            })).join(', ')
        },
        path: 'project.displayValue',
    },
    wellContents: {display: false},
}
const fieldConfigs: FormFieldConfigs = {
    'sgRnaOligoTargets.*': {
        label: 'Targets',
        component: 'InputArray',
        canDelete: true,
        canUpdate: true,
        props: {
            components: [
                {
                    variableField: 'targetId',
                    label: 'Target',
                    component: 'AutoCompleter',
                    componentProps: {
                        searchBaseUrl: '/api/targets',
                        searchFields: ['name'],
                        valueField: 'id',
                        displayFields: ['name'],
                        dropdown: true,
                    },
                },
            ]
        },
    },
}
const displayWithClause = {
    sgRnaOligoTargets: {
        with: {
            target: {
                columns: {
                    name: true,
                },
                with: {
                    project: {
                        columns: {
                            name: true
                        }
                    },
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
                    },
                },
            },
        },
    },
    wellable: {
        with: {
            wellContents: {
                with: {
                    well: {
                        columns: {
                            id: true,
                            x: true,
                            y: true,
                        },
                        with: {
                            plate: {
                                columns: {
                                    id: true,
                                    name: true,
                                    plateType: true,
                                }
                            }
                        }
                    },
                },
            },
        }
    },
}
const formWithClause = {
    sgRnaOligoTargets: {
        with: {
            target: {
                columns: {
                    name: true,
                },
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
                table-name="sg-rna-oligos"
                :zodSchema="schemas.sgRnaOligos.select"
                title="sgRNA Oligos"
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
                submitUrl="/api/sg-rna-oligos"
                submitMethod="POST"
                :zodSchema="schemas.sgRnaOligos.insert"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/sg-rna-oligos"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/sg-rna-oligos"
                submitMethod="PUT"
                :zodSchema="schemas.sgRnaOligos.update"
                :fieldConfigs="fieldConfigs"
                :with-clause="formWithClause"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
            />
        </SplitterPanel>
    </Splitter>
</template>
