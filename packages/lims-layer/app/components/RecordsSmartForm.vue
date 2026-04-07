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
    'records-update',
    'record-delete',
])

const isMultiEdit = computed(() => props.recordIds.length > 1)
const initialValues = ref<Record<string, unknown>>({})
const conflictingFields = ref<Record<string, number>>({})
const loading = ref(true)
const serverSideValidationErrors = ref<Record<string, string>>({})

async function loadRecord() {
    loading.value = true
    try {
        if (isMultiEdit.value && props.selectUrl) {
            // Multi-edit: load all records and compute combined values
            const records = await RecordService.getRecordsByIds(props.selectUrl, props.recordIds)
            const schemaKeys = _.keys(props.zodSchema.shape)
            const combined: Record<string, unknown> = {}
            const conflicts: Record<string, number> = {}

            for (const key of schemaKeys) {
                const values = records.map((r: any) => r[key])
                const uniqueValues = _.uniqWith(values, _.isEqual)
                if (uniqueValues.length === 1) {
                    combined[key] = uniqueValues[0]
                } else {
                    combined[key] = null
                    conflicts[key] = uniqueValues.length
                }
            }

            initialValues.value = combined
            conflictingFields.value = conflicts
        } else if (props.selectUrl && props.recordIds.length === 1) {
            const record = await RecordService.getRecord(props.selectUrl!, props.recordIds[0]!, undefined)
            initialValues.value = _.pick(record, _.keys(props.zodSchema.shape))
        } else {
            // For new records, set empty initial values from schema keys
            const empty: Record<string, unknown> = {}
            _.keys(props.zodSchema.shape).forEach((key) => { empty[key] = null })
            // Apply readonly values
            initialValues.value = { ...empty, ...getBlankFormInitialValues(props.zodSchema, props.fieldConfigs), ...props.readonlyValues }
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
    serverSideValidationErrors.value = {}
    try {
        let result
        if (isMultiEdit.value) {
            // SmartFormMultiple already filters to only changed values
            if (_.isEmpty(values)) {
                toast.add({
                    severity: 'warn',
                    summary: 'No changes to save',
                    life: 3000,
                })
                return
            }

            result = await RecordService.updateRecords(props.submitUrl, props.recordIds, values)
            emit('records-update', result)
        } else if (props.submitMethod === 'PUT') {
            result = await RecordService.updateRecord(props.submitUrl, { id: props.recordIds[0], ...values })
            emit('record-update', result)
        } else {
            result = await RecordService.addRecord(props.submitUrl, values)
            emit('record-add', result)
        }
        toast.add({
            severity: 'success',
            summary: isMultiEdit.value
                ? `${props.recordIds.length} records updated successfully`
                : 'Record saved successfully',
            life: 3000,
        })
    } catch (error: any) {
        const fieldErrors = _.isArray(error.data?.data) ? error.data.data as Array<{ path: string[], message: string }> : []
        const mapped: Record<string, string> = {}
        const unmapped: string[] = []

        for (const fe of fieldErrors) {
            const fieldName = fe.path?.join('.')
            if (fieldName && _.has(props.zodSchema.shape, fieldName)) {
                mapped[fieldName] = fe.message
            } else {
                unmapped.push(fe.message || 'Unknown validation error')
            }
        }

        serverSideValidationErrors.value = mapped

        if (unmapped.length > 0) {
            toast.add({
                severity: 'error',
                summary: 'Validation error',
                detail: unmapped.join('; '),
                life: 5000,
            })
        } else if (_.isEmpty(mapped)) {
            toast.add({
                severity: 'error',
                summary: 'Failed to save record',
                detail: error?.data?.statusMessage || error?.message || 'Unknown error',
                life: 5000,
            })
        }
    }
}

async function onDelete() {
    try {
        const result = await RecordService.deleteRecord(props.submitUrl, props.recordIds[0]!)
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
        <SmartFormMultiple
            v-if="isMultiEdit"
            :zodSchema="zodSchema"
            :initialValues="initialValues"
            :fieldConfigs="fieldConfigs"
            :conflictingFields="conflictingFields"
            :formDebug="formDebug"
            :serverErrors="serverSideValidationErrors"
            @submitSuccess="onSubmitSuccess"
        >
            <template #form-buttons>
                <Button label="Cancel" severity="secondary" @click="onCancel" />
            </template>
        </SmartFormMultiple>
        <SmartForm
            v-if="!isMultiEdit"
            :zodSchema="zodSchema"
            :initialValues="initialValues"
            :fieldConfigs="fieldConfigs"
            :recordIds="recordIds"
            :formDebug="formDebug"
            :serverErrors="serverSideValidationErrors"
            @submitSuccess="onSubmitSuccess"
        >
            <template #form-buttons>
                <Button label="Cancel" severity="secondary" @click="onCancel" />
                <Button
                    v-if="canDelete && recordIds.length > 0"
                    label="Delete"
                    severity="danger"
                    @click="onDelete"
                />
            </template>
        </SmartForm>

    </div>
</template>
