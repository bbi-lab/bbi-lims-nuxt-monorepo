<script setup lang="ts">
/**
 * SmartFormDatePicker – thin wrapper around PrimeVue DatePicker that integrates
 * correctly with PrimeVue Forms, following the same pattern as SmartFormInputNumber.
 *
 * Fixes two issues with using a raw DatePicker via the Form's `name` wiring:
 *  1. The selected value of an existing record renders blank until the field is
 *     focused. Binding a controlled `:modelValue` synced from the form state makes
 *     it display on mount.
 *  2. Typing an unparseable string produced a confusing "expected date, received
 *     Date" validation error (z.coerce.date() turns it into an Invalid Date).
 *     Invalid dates are normalized to null here so the field simply clears.
 */
defineOptions({ inheritAttrs: false })

const props = defineProps({
    name: { type: String, required: true },
    modelValue: { type: [Date, String, Object], default: null },
    disabled: { type: Boolean, default: false },
})

const emit = defineEmits<{
    'update:modelValue': [value: Date | null]
}>()

function toDateOrNull(v: unknown): Date | null {
    if (v === null || v === undefined || v === '') return null
    const d = v instanceof Date ? v : new Date(v as string)
    return isNaN(d.getTime()) ? null : d
}

// Integrate with PrimeVue Forms
const $pcForm = inject('$pcForm') as any
const formField = ref<Record<string, any>>({})

const localValue = ref<Date | null>(toDateOrNull(props.modelValue))
const isUserEditing = ref(false)
const datePickerRef = ref<any>(null)

// Register with form and seed the initial value from form state
watch(
    () => props.name,
    (name) => {
        if ($pcForm && name) {
            formField.value = $pcForm.register(name, { name }) || {}
            const formValue = $pcForm.getFieldState?.(name)?.value
            if (formValue !== undefined) {
                localValue.value = toDateOrNull(formValue)
            }
        }
    },
    { immediate: true },
)

// Sync modelValue prop → local state (for use outside PrimeVue Forms, e.g. SmartFormMultiple)
watch(
    () => props.modelValue,
    (newValue) => {
        if (!isUserEditing.value) {
            const resolved = toDateOrNull(newValue)
            if (resolved?.getTime() !== localValue.value?.getTime()) {
                localValue.value = resolved
            }
        }
    },
)

// Sync form state → local state (handles form reset, initial values, etc.)
watch(
    () => $pcForm?.getFieldState?.(props.name)?.value,
    (newValue) => {
        if (!isUserEditing.value) {
            localValue.value = toDateOrNull(newValue)
        }
    },
    { immediate: true },
)

function onValueChange(newValue: Date | (Date | null)[] | null | undefined) {
    isUserEditing.value = true
    const resolved = toDateOrNull(Array.isArray(newValue) ? newValue[0] : newValue)
    localValue.value = resolved
    emit('update:modelValue', resolved)
    notifyFormOfChange(resolved)
    nextTick(() => {
        isUserEditing.value = false
    })
}

function notifyFormOfChange(value: Date | null) {
    if (!$pcForm) return
    formField.value?.onChange?.({ value })
}

function onBlur() {
    formField.value?.onBlur?.()
    $pcForm?.validate?.(props.name)
}

// Attach a native blur listener to the underlying <input> for reliable blur
// detection (the DatePicker component blur event is inconsistent with the overlay).
onMounted(() => {
    const inputEl = datePickerRef.value?.$el?.querySelector('input')
    if (inputEl) inputEl.addEventListener('blur', onBlur)
})

onBeforeUnmount(() => {
    const inputEl = datePickerRef.value?.$el?.querySelector('input')
    if (inputEl) inputEl.removeEventListener('blur', onBlur)
})
</script>

<template>
    <DatePicker
        ref="datePickerRef"
        :id="props.name"
        :modelValue="localValue"
        :disabled="disabled"
        v-bind="$attrs"
        @update:modelValue="onValueChange"
    />
</template>
