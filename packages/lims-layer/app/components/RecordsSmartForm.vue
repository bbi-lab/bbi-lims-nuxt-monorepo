<script setup lang="ts">
import _ from 'lodash'
import type { z } from 'zod'

const toast = useToast()

const props = defineProps({
    selectUrl: { type: String, required: false },
    recordIds: { type: Array as () => string[], required: false, default: () => [] },
    submitUrl: { type: String, required: true },
    submitMethod: { type: String as () => 'POST' | 'PUT', required: true },
    zodSchema: {
        type: Object as () => z.ZodObject<Record<string, z.ZodTypeAny>>,
        required: true,
    },
    fieldConfigs: {
        type: Object as () => Record<string, FormFieldConfig>,
        required: false,
        default: () => ({}),
    },
    readonlyValues: {
        type: Object as () => Record<string, unknown>,
        required: false,
        default: () => ({}),
    },
    canDelete: {
        type: Boolean,
        required: false,
        default: false,
    },
    formDebug: {
        type: Boolean,
        required: false,
        default: false,
    },
})

const emit = defineEmits([
    'cancel',
    'record-add',
    'record-update',
    'record-delete',
])

const initialValues = ref<Record<string, unknown>>({})
const loading = ref(true)

async function loadRecord() {
    loading.value = true
    try {
        if (props.selectUrl && props.recordIds.length === 1) {
            const record = await RecordService.getRecord(props.selectUrl, props.recordIds[0])
            initialValues.value = _.pick(record, _.keys(props.zodSchema.shape))
        } else {
            // For new records, set empty initial values from schema keys
            const empty: Record<string, unknown> = {}
            _.keys(props.zodSchema.shape).forEach((key) => { empty[key] = null })
            // Apply readonly values
            initialValues.value = { ...empty, ...props.readonlyValues }
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Failed to load record',
            detail: error?.message || 'Unknown error',
            life: 5000,
        })
    } finally {
        loading.value = false
    }
}

async function onSubmitSuccess(values: Record<string, unknown>) {
    try {
        let result
        if (props.submitMethod === 'PUT') {
            result = await RecordService.updateRecord(props.submitUrl, { id: props.recordIds[0], ...values })
            emit('record-update', result)
        } else {
            result = await RecordService.addRecord(props.submitUrl, values)
            emit('record-add', result)
        }
        toast.add({
            severity: 'success',
            summary: 'Record saved successfully',
            life: 3000,
        })
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Failed to save record',
            detail: error?.message || 'Unknown error',
            life: 5000,
        })
    }
}

async function onDelete() {
    try {
        const result = await RecordService.deleteRecord(props.submitUrl, props.recordIds[0])
        emit('record-delete', result)
        toast.add({
            severity: 'success',
            summary: 'Record deleted successfully',
            life: 3000,
        })
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Failed to delete record',
            detail: error?.message || 'Unknown error',
            life: 5000,
        })
    }
}

function onCancel() {
    emit('cancel')
}

onMounted(() => {
    loadRecord()
})
</script>

<template>
    <ProgressSpinner v-if="loading" />
    <div v-else class="flex flex-col gap-4 m-4">
        <SmartForm
            :zodSchema="zodSchema"
            :initialValues="initialValues"
            :fieldConfigs="fieldConfigs"
            :recordIds="recordIds"
            :formDebug="formDebug"
            @submitSuccess="onSubmitSuccess"
        />
        <div class="flex gap-2">
            <Button label="Cancel" severity="secondary" @click="onCancel" />
            <Button
                v-if="canDelete && recordIds.length > 0"
                label="Delete"
                severity="danger"
                @click="onDelete"
            />
        </div>
    </div>
</template>
