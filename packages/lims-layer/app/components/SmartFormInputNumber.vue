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
const isUserEditing = ref(false)
const inputNumberRef = ref<any>(null)

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

// Sync modelValue prop → local state (for use outside PrimeVue Forms, e.g. SmartFormMultiple)
watch(
    () => props.modelValue,
    (newValue) => {
        if (!isUserEditing.value && newValue !== localValue.value) {
            localValue.value = newValue
            notifyFormOfChange(newValue)
        }
    },
)

// Sync form state → local state (handles form reset, initial values, etc.)
watch(
    () => $pcForm?.getFieldState?.(props.name)?.value,
    (newValue) => {
        if (!isUserEditing.value) {
            const resolved = newValue ?? null
            if (resolved !== localValue.value) {
                localValue.value = resolved
            }
        }
    },
    { immediate: true },
)

function onValueChange(newValue: number | null) {
    isUserEditing.value = true
    localValue.value = newValue
    emit('update:modelValue', newValue)
    notifyFormOfChange(newValue)
    nextTick(() => {
        isUserEditing.value = false
    })
}

function notifyFormOfChange(value: number | null) {
    if (!$pcForm) return
    formField.value?.onChange?.({ value })
}

function onBlur() {
    formField.value?.onBlur?.()
    $pcForm?.validate?.(props.name)
}

// Attach native blur listener to the underlying <input> element for reliable
// blur detection on both tab-out and click-out (InputNumber component event is inconsistent)
onMounted(() => {
    const inputEl = inputNumberRef.value?.$el?.querySelector('input')
    if (inputEl) {
        inputEl.addEventListener('blur', onBlur)
    }
})

onBeforeUnmount(() => {
    const inputEl = inputNumberRef.value?.$el?.querySelector('input')
    if (inputEl) {
        inputEl.removeEventListener('blur', onBlur)
    }
})
</script>

<template>
    <InputNumber
        ref="inputNumberRef"
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
    />
</template>
