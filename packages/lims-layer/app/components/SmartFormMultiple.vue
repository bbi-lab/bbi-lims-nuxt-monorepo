<script setup lang="ts">
import _ from 'lodash'
import { useActiveElement } from '@vueuse/core'
import type { z } from 'zod'
import { Icon } from '#components'

const GrommetIconsRevert = h(Icon, { name: 'grommet-icons:revert', class: 'm-1' })

const SmartFormInputArray = resolveComponent('SmartFormInputArray')
const SmartFormAutoCompleter = resolveComponent('SmartFormAutoCompleter')
const SmartFormNestedSelect = resolveComponent('SmartFormNestedSelect')
const SmartFormInputNumber = resolveComponent('SmartFormInputNumber')

const activeElement = useActiveElement()

const props = defineProps({
    zodSchema: {
        type: Object as () => z.ZodObject<Record<string, z.ZodTypeAny>>,
        required: true,
    },
    /**
     * Combined initial values: null for conflicting fields, actual value for non-conflicting.
     */
    initialValues: {
        type: Object as () => Record<string, unknown>,
        required: true,
    },
    fieldConfigs: {
        type: Object as () => Record<string, FormFieldConfig>,
        required: false,
        default: () => ({}),
    },
    /**
     * Map of field name -> number of distinct values across selected records.
     * Only present for fields where values differ.
     */
    conflictingFields: {
        type: Object as () => Record<string, number>,
        required: false,
        default: () => ({}),
    },
    formDebug: {
        type: Boolean,
        required: false,
        default: false,
    },
})

const emit = defineEmits([
    'submitSuccess',
])

// ──────────────────────────────────────────────
// Combined record: mirrors QuickFormMultiple pattern
// Each field is { val, conflictingValueCount?, valClearedByUser? }
// ──────────────────────────────────────────────
const combinedRecord = ref<Record<string, { val: any, conflictingValueCount?: number, valClearedByUser?: boolean }>>({})

// Initialise combinedRecord from props
watchEffect(() => {
    const record: Record<string, { val: any, conflictingValueCount?: number, valClearedByUser?: boolean }> = {}
    for (const key of _.keys(props.zodSchema.shape)) {
        record[key] = {
            val: props.initialValues[key] ?? null,
        }
        if (props.conflictingFields[key]) {
            record[key].conflictingValueCount = props.conflictingFields[key]
        }
    }
    combinedRecord.value = record
})

// ──────────────────────────────────────────────
// Field definitions for dynamic rendering (same as SmartForm)
// ──────────────────────────────────────────────
const formFields = computed(() => {
    return _.keys(props.zodSchema.shape).map((fieldName) => {
        const fieldDefinition = getFormFieldDefinition(fieldName, props.zodSchema, _.get(props.fieldConfigs, fieldName))
        return {
            id: fieldName,
            name: fieldName,
            component: fieldDefinition.primeVueComponent === 'SmartFormInputArray'
                ? SmartFormInputArray
                : fieldDefinition.primeVueComponent === 'SmartFormAutoCompleter'
                ? SmartFormAutoCompleter
                : fieldDefinition.primeVueComponent === 'SmartFormNestedSelect'
                ? SmartFormNestedSelect
                : fieldDefinition.primeVueComponent === 'SmartFormInputNumber'
                ? SmartFormInputNumber
                : fieldDefinition.primeVueComponent,
            label: fieldDefinition.label || _.startCase(fieldName),
            vBindObject: fieldDefinition.vBindObject,
        }
    })
})

// ──────────────────────────────────────────────
// Styling helpers (from QuickFormMultiple)
// ──────────────────────────────────────────────
const inputClasses = computed(() => {
    return _.mapValues(combinedRecord.value, (value, key) => {
        const activeElementInputId = activeElement.value?.getAttribute('id')
        return key !== activeElementInputId
            && _.has(combinedRecord.value, [key, 'conflictingValueCount'])
            && _.isNull(value.val)
            && !_.get(combinedRecord.value, [key, 'valClearedByUser'], false)
            ? 'bg-surface-200 dark:bg-gray-800' : ''
    })
})

const placeholders = computed(() => {
    return _.mapValues(combinedRecord.value, (value, key) => {
        const activeElementInputId = activeElement.value?.getAttribute('id')
        return key !== activeElementInputId
            && _.has(combinedRecord.value, [key, 'conflictingValueCount'])
            && !_.get(combinedRecord.value, [key, 'valClearedByUser'], false)
            ? `${_.get(combinedRecord.value, [key, 'conflictingValueCount'])} values` : ''
    })
})

const showRevertButton = (key: string) => {
    const field = combinedRecord.value[key]
    if (!field) return false
    return _.has(field, 'conflictingValueCount')
        && (!_.isNull(field.val) || _.get(field, 'valClearedByUser'))
}

// ──────────────────────────────────────────────
// Value helpers
// ──────────────────────────────────────────────
const clearValue = (key: string) => {
    _.set(combinedRecord.value, [key, 'val'], null)
    _.set(combinedRecord.value, [key, 'valClearedByUser'], true)
}

const revertToConflictingValue = (key: string) => {
    _.set(combinedRecord.value, [key, 'val'], null)
    _.unset(combinedRecord.value, [key, 'valClearedByUser'])
}

const changedToNullCheck = (key: string) => {
    const field = combinedRecord.value[key]
    if (!field) return
    if (_.isNull(field.val)) {
        _.set(combinedRecord.value, [key, 'valClearedByUser'], true)
    } else {
        _.unset(combinedRecord.value, [key, 'valClearedByUser'])
    }
}

// ──────────────────────────────────────────────
// Submission
// ──────────────────────────────────────────────
function onSubmit() {
    // Build values map: only include fields that were changed
    const valuesToSubmit = _.mapValues(
        _.pickBy(combinedRecord.value, (value) => {
            // Include if: value is non-null, OR user explicitly cleared it, OR not a conflicting field
            return !_.isNull(value.val) || _.get(value, 'valClearedByUser') || !_.has(value, 'conflictingValueCount')
        }),
        (value) => value.val,
    )

    emit('submitSuccess', valuesToSubmit)
}
</script>

<template>
    <div>
        <template v-for="field in formFields" :key="field.name">
            <div v-if="combinedRecord[field.name]" class="flex flex-col gap-2 pb-2">
                <label class="font-semibold" :for="field.id">{{ field.label }}</label>
                <div class="flex items-center gap-2">
                    <component
                        :is="field.component"
                        :id="field.id"
                        v-model="combinedRecord[field.name]!.val"
                        v-bind="field.vBindObject"
                        :placeholder="placeholders[field.name] || (field.vBindObject as any)?.placeholder"
                        :class="inputClasses[field.name]"
                        @update:modelValue="changedToNullCheck(field.name)"
                    />
                    <Button
                        v-if="showRevertButton(field.name)"
                        v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}"
                        outlined
                        severity="info"
                        class="ml-2"
                        @click="revertToConflictingValue(field.name)"
                    >
                        <template #icon>
                            <GrommetIconsRevert />
                        </template>
                    </Button>
                </div>
            </div>
        </template>
        <Button label="Submit" @click="onSubmit" />
        <div v-if="formDebug" class="flex flex-col my-4 p-4 bg-blue-100 rounded">
            <h3>Debug Info:</h3>
            <div class="m-4">
                <pre class="whitespace-pre-wrap wrap-break-word">initialValues: {{ initialValues }}</pre>
                <hr />
                <pre class="whitespace-pre-wrap wrap-break-word">conflictingFields: {{ conflictingFields }}</pre>
                <hr />
                <pre class="whitespace-pre-wrap wrap-break-word">combinedRecord: {{ combinedRecord }}</pre>
                <hr />
                <pre class="whitespace-pre-wrap wrap-break-word">formFields: {{ formFields }}</pre>
            </div>
        </div>
    </div>
</template>
