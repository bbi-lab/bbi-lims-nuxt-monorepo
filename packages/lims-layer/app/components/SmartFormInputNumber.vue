<script setup lang="ts">
/**
 * SmartFormInputNumber – thin wrapper around PrimeVue InputNumber that integrates
 * correctly with PrimeVue Forms.
 *
 * PrimeVue InputNumber has a known bug (#8474) where it doesn't properly emit
 * change events to the Form component. This wrapper manually registers with the
 * form and syncs value changes, following the same pattern as SmartFormAutoCompleter.
 */

const props = defineProps({
    name: { type: String, required: true },
    modelValue: { type: Number, default: null },
    // Pass-through props for InputNumber
    disabled: { type: Boolean, default: false },
    placeholder: { type: String },
    min: { type: Number },
    max: { type: Number },
    minFractionDigits: { type: Number },
    maxFractionDigits: { type: Number },
    showButtons: { type: Boolean, default: false },
    mode: { type: String },
    locale: { type: String },
    prefix: { type: String },
    suffix: { type: String },
    currency: { type: String },
    step: { type: Number, default: 1 },
})

const emit = defineEmits<{
    'update:modelValue': [value: number | null]
}>()

// Integrate with PrimeVue Forms
const $pcForm = inject('$pcForm') as any
const formField = ref<Record<string, any>>({})

// Local state
const localValue = ref<number | null>(props.modelValue)

// Register with form
watch(
    () => props.name,
    (name) => {
        if ($pcForm && name) {
            formField.value = $pcForm.register(name, { name }) || {}
            // Sync initial value from form state after registration
            const formValue = $pcForm.getFieldState?.(name)?.value
            if (formValue !== undefined && formValue !== null) {
                localValue.value = formValue
            }
        }
    },
    { immediate: true },
)

// Sync modelValue prop → local state
watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue !== localValue.value) {
            localValue.value = newValue
        }
    },
)

// Sync form state → local state (handles form reset, initial values, etc.)
watch(
    () => $pcForm?.getFieldState?.(props.name)?.value,
    (newValue) => {
        const resolved = newValue ?? null
        if (resolved !== localValue.value) {
            localValue.value = resolved
        }
    },
    { immediate: true },
)

function onValueChange(newValue: number | null) {
    localValue.value = newValue
    emit('update:modelValue', newValue)
    notifyFormOfChange(newValue)
}

function notifyFormOfChange(value: number | null) {
    if (!$pcForm) return
    formField.value?.onChange?.({ value })
    nextTick(() => {
        $pcForm.setFieldState?.(props.name, {
            value,
            touched: true,
            dirty: true,
        })
    })
}

function onBlur() {
    formField.value?.onBlur?.()
    $pcForm?.validate?.(props.name)
}
</script>

<template>
    <InputNumber
        :id="props.name"
        :modelValue="localValue"
        :disabled="disabled"
        :placeholder="placeholder"
        :min="min"
        :max="max"
        :minFractionDigits="minFractionDigits"
        :maxFractionDigits="maxFractionDigits"
        :showButtons="showButtons"
        :mode="mode"
        :locale="locale"
        :prefix="prefix"
        :suffix="suffix"
        :currency="currency"
        :step="step"
        @update:modelValue="onValueChange"
        @blur="onBlur"
    />
</template>
