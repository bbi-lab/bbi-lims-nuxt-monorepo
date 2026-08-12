<script setup lang="ts">
import _ from 'lodash'

// Emitted after a successful import so the parent can refresh its table/plate view.
const emit = defineEmits<{ imported: [] }>()

const toast = useToast()
const visible = ref(false)

const submit = async (data: any[]) => {
    try {
        // remove template sample rows (identified by "Sample row" in the notes field)
        const filteredData = _.filter(data, (item) => !_.includes(_.toLower(item.notes || ''), 'sample row'))
        if (_.isEmpty(filteredData)) {
            toast.add({ severity: 'warn', summary: 'No records found', life: 5000 })
            return
        }
        const response: { insertedCount: number } = await $fetch(`/api/custom/primers/preseq-primer-import`, {
            method: 'POST',
            body: filteredData,
        })
        toast.add({ severity: 'success', summary: 'Success', detail: `Successfully imported ${response.insertedCount} primers.`, life: 5000 })
        visible.value = false
        emit('imported')
    } catch (error: any) {
        const userMessage = _.isArray(error?.data?.data) ? convertErrorDataToUserMessage(error.data.data) : error.statusMessage ?? 'An unexpected error occurred during import. Please try again.'
        toast.add({ severity: 'error', summary: 'Error', detail: userMessage, life: 5000 })
    }
}

const onUpload = (event: any) => {
    try {
        fileToSheet(event.files[0], submit)
    } catch (error) {
        console.error('Error importing PreSeq primers:', error)
    }
}
</script>
<template>
    <Button label="Import" icon="pi pi-file-import" @click="visible = true" />
    <Dialog v-model:visible="visible" modal :closable="false" :style="{ width: '35' }">
        <div class="flex justify-end">
            <Button icon="pi pi-times" class="p-button-rounded p-button-text p-button-plain ml-auto mr-0" @click="visible = false" />
        </div>
        <span class="flex justify-center mt-3 font-bold">Import PreSeq Primers</span>
        <a href="/templates/preseq_primer_import_template.xlsx" download class="flex justify-center mt-3 mb-5 text-primary">Download template</a>
        <FileUpload
            mode="basic"
            accept="application/msexcel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
            class="p-button-info"
            :maxFileSize="1000000"
            :customUpload="true"
            :auto="true"
            @uploader="onUpload"
            chooseLabel="Upload"
            v-tooltip="{value: 'Upload PreSeq primers', showDelay: 500}"
        >
            <template #chooseicon>
                <i class="pi pi-upload"></i>
            </template>
            <template #uploadicon>
                <i class="pi pi-upload"></i>
            </template>
        </FileUpload>
    </Dialog>
</template>
