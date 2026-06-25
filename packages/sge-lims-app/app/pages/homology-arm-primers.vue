<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()
const toast = useToast()
const importDialogVisible = ref(false)

const submitHaPrimers = async (data: any[]) => {
    try {
        const filteredData = _.filter(data, (item) => {
            return !_.includes(_.toLower(item.notes || ''), 'sample row')
        })
        if (_.isEmpty(filteredData)) {
            toast.add({ severity: 'warn', summary: 'No records found', life: 5000 })
            return
        }
        const response: { primers: { id: string }[]; insertedCount: number } = await $fetch('/api/custom/primers/ha-primers/import', {
            method: 'POST',
            body: filteredData,
        })
        crudTable.didAddRecords(response.primers)
        toast.add({ severity: 'success', summary: 'Success', detail: `Successfully imported ${response.insertedCount} Homology Arm Primers.`, life: 5000 })
        importDialogVisible.value = false
    } catch (error: any) {
        const userMessage = _.isArray(error?.data?.data) ? convertErrorDataToUserMessage(error.data.data) : error.statusMessage ?? 'An unexpected error occurred during import. Please try again.'
        toast.add({ severity: 'error', summary: 'Error', detail: userMessage, life: 5000 })
    }
}

const importHaPrimers = (event: any) => {
    try {
        fileToSheet(event.files[0], submitHaPrimers)
    } catch (error) {
        console.error('Error importing Homology Arm Primers:', error)
    }
}

const withClause = Object.freeze({
    targets: {
        with: {
            target: {
                columns: {
                    id: true,
                    name: true,
                }
            },
        }
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
    }
})

const columnDefs: ColumnDefinitions = {
    name: {
        index: 1
    },
    targets: {
        format: (data: any) => {
            return _.map(data.targets, 'target.name')
        },
        path: 'targets.displayValue',
        index: 2,
    },
    wellContents: {
        header: 'Location',
        format: (x: any) => {
            return combinedWellLocations(x) as string
        },
        path: 'wellContents.displayValue',
        type: 'string',
        index: 5,
    },
}

const fieldConfigs: FormFieldConfigs = {
    targets: {
        label: 'Targets',
        inputArray: {
            canDelete: false,
            fieldConfigs: {
                targetId: {
                    label: 'Target',
                    autoCompleter: {
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
                table-name="homology-arm-primers"
                :zodSchema="schemas.homologyArmPrimers.select"
                title="Homology Arm Primers"
                :with-clause="withClause"
                :column-defs="columnDefs"
                :rows-per-page-options="[10, 25, 50, 100]"
                :row-style="(data: any) => {
                    return data?.archived ? {textDecoration: 'line-through'} : {}
                }"
                sort-field="name"
                :sort-order="1"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            >
                <template #header-buttons>
                    <Button
                        v-if="!crudTable.state.showAddForm && !crudTable.state.showEditForm"
                        label="Import"
                        icon="pi pi-file-import"
                        @click="importDialogVisible = true"
                    />
                </template>
            </SmartTable>
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/homology-arm-primers"
                submitMethod="POST"
                :zodSchema="schemas.homologyArmPrimers.insert"
                :fieldConfigs="fieldConfigs"
                :with-clause="withClause"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/homology-arm-primers"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/homology-arm-primers"
                submitMethod="PUT"
                :zodSchema="schemas.homologyArmPrimers.update"
                :fieldConfigs="fieldConfigs"
                :with-clause="withClause"
                :can-delete="true"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
    <Dialog v-model:visible="importDialogVisible" modal :closable="false" :style="{ width: '35rem' }">
        <slot name="closebutton">
            <div class="flex justify-end">
                <Button icon="pi pi-times" class="p-button-rounded p-button-text p-button-plain ml-auto mr-0" @click="importDialogVisible = false" />
            </div>
        </slot>
        <slot name="header">
            <span class="flex justify-center mt-3 font-bold">Import Homology Arm Primers</span>
        </slot>
        <a href="/templates/ha_primer_import_template.xlsx" download class="flex justify-center mt-3 mb-2 text-primary">Download template</a>
        <div class="flex justify-center">
            <FileUpload
                mode="basic"
                accept="application/msexcel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                class="p-button-info"
                :maxFileSize="1000000"
                :customUpload="true"
                :auto="true"
                @uploader="importHaPrimers"
                chooseLabel="Upload"
            >
                <template #chooseicon>
                    <i class="pi pi-upload"></i>
                </template>
            </FileUpload>
        </div>
    </Dialog>
</template>
