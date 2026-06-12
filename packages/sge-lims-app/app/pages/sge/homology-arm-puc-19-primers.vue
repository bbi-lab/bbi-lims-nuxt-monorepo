<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()
const toast = useToast()
const importDialogVisible = ref(false)

const submitHaPuc19Primers = async (data: any[]) => {
    try {
        const filteredData = _.filter(data, (item) => {
            return !_.includes(_.toLower(item.notes || ''), 'sample row')
        })
        if (_.isEmpty(filteredData)) {
            toast.add({ severity: 'warn', summary: 'No records found', life: 5000 })
            return
        }
        const response: { primers: { id: string }[]; insertedCount: number } = await $fetch('/api/custom/primers/ha-puc19-primers/import', {
            method: 'POST',
            body: filteredData,
        })
        crudTable.didAddRecords(response.primers)
        toast.add({ severity: 'success', summary: 'Success', detail: `Successfully imported ${response.insertedCount} Homology Arm PUC 19 Primers.`, life: 5000 })
        importDialogVisible.value = false
    } catch (error: any) {
        const userMessage = _.isArray(error?.data?.data) ? convertErrorDataToUserMessage(error.data.data) : error.statusMessage ?? 'An unexpected error occurred during import. Please try again.'
        toast.add({ severity: 'error', summary: 'Error', detail: userMessage, life: 5000 })
    }
}

const importHaPuc19Primers = (event: any) => {
    try {
        fileToSheet(event.files[0], submitHaPuc19Primers)
    } catch (error) {
        console.error('Error importing Homology Arm PUC 19 Primers:', error)
    }
}

const withClause = Object.freeze({
    homologyArmPrimer: {
        with: {
            targets: {
                with: {
                    target: {
                        columns: {
                            id: true,
                            name: true,
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
    }
})

const columnDefs: ColumnDefinitions = {
    name: {
        index: 1
    },
    wellContents: {
        header: 'Location',
        format: (x: any) => {
            return combinedWellLocations(x) as string
        },
        path: 'wellContents.displayValue',
        type: 'string',
        index: 4,
    },
    homologyArmPrimerId: { display: false },
    homologyArmPrimer: {
        type: 'element',
        element: (data: any) => {
            return data.homologyArmPrimer?.id
                ? `<span class="${data.homologyArmPrimer?.archived ? 'line-through' : ''}">${data.homologyArmPrimer.name}</span>`
                : ''
        },
        exportValue: (data: any) => data.homologyArmPrimer?.name || '',
        path: 'homologyArmPrimer.name',
        index: 2,
    },
    sequence: {
        index: 3,
    },
}

const fieldConfigs: FormFieldConfigs = {
    homologyArmPrimerId: {
        label: 'Homology Arm Primer',
        subtext: (_data: any, relatedData: any) => {
            const haPrimerSequence = _.has(relatedData, 'homologyArmPrimerId') ? _.get(relatedData, 'homologyArmPrimerId.sequence') : _.get(_data, 'homologyArmPrimer.sequence')
            return `Sequence: ${haPrimerSequence || ''}`
        },
        autoCompleter: {
            searchBaseUrl: '/api/homology-arm-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            inputClass: (data: any) => {
                return data?.record?.archived ? 'line-through' : ''
            },
        },
        index: 0,
    },
    name: {
        index: 2,
    },
}
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :ref="crudTable.setTableRef"
                table-name="homology-arm-puc-19-primers"
                :zodSchema="schemas.homologyArmPuc19Primers.select"
                title="Homology Arm PUC 19 Primers"
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
                submitUrl="/api/homology-arm-puc-19-primers"
                submitMethod="POST"
                :zodSchema="schemas.homologyArmPuc19Primers.insert"
                :fieldConfigs="fieldConfigs"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/homology-arm-puc-19-primers"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/homology-arm-puc-19-primers"
                submitMethod="PUT"
                :zodSchema="schemas.homologyArmPuc19Primers.update"
                :fieldConfigs="fieldConfigs"
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
            <span class="flex justify-center mt-3 font-bold">Import Homology Arm PUC 19 Primers</span>
        </slot>
        <a href="/templates/ha_puc19_primer_import_template.xlsx" download class="flex justify-center mt-3 mb-2 text-primary">Download template</a>
        <div class="flex justify-center">
            <FileUpload
                mode="basic"
                accept="application/msexcel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                class="p-button-info"
                :maxFileSize="1000000"
                :customUpload="true"
                :auto="true"
                @uploader="importHaPuc19Primers"
                chooseLabel="Upload"
            >
                <template #chooseicon>
                    <i class="pi pi-upload"></i>
                </template>
            </FileUpload>
        </div>
    </Dialog>
</template>
