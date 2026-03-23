<script setup lang="ts">
import _ from 'lodash'
import type { z } from 'zod'

const props = defineProps({
    name: { type: String, required: true },
    itemSchema: { type: Object as () => z.ZodObject<Record<string, z.ZodTypeAny>>, required: true },
    fieldState: { type: Object, required: false }, // Optional prop to receive state from parent form
    canAdd: { type: Boolean, required: false, default: true },
    canDelete: { type: Boolean, required: false, default: true },
})

// Integrate with PrimeVue Forms by injecting the parent Form instance
// and registering this field, mirroring how BaseEditableHolder works
const $pcForm = inject('$pcForm') as any
const formField = ref<Record<string, any>>({})

watch(
    () => props.name,
    (name) => {
        if ($pcForm && name) {
            formField.value = $pcForm.register(name, { name }) || {}
        }
    },
    { immediate: true },
)

// Internal array of items
const items = ref<Record<string, any>[]>([])

// Sync from form state (handles form reset)
watch(
    () => $pcForm?.getFieldState?.(props.name)?.value,
    (newValue) => {
        if (Array.isArray(newValue) && newValue !== items.value) {
            items.value = newValue.map((item: any) => ({ ...item }))
        } else if (newValue === null || newValue === undefined) {
            items.value = []
        }
    },
)

// Determine sub-fields from the item schema (ZodObject)
const subFields = computed(() => {
    if (!props.itemSchema?.shape) return []

    return Object.entries(props.itemSchema.shape).map(([key, fieldSchema]: [string, any]) => {
        // Traverse to find base type (unwrap optional, nullable, etc.)
        let def = fieldSchema.def ?? null
        while (def?.innerType) {
            def = def.innerType?.def ?? null
        }
        const zodType = def?.type

        let component = 'InputText'
        const vBindObject: Record<string, any> = {}

        if (zodType === 'number' || zodType === 'bigint') {
            component = 'InputNumber'
        } else if (zodType === 'boolean') {
            component = 'Checkbox'
            vBindObject.binary = true
        } else if (zodType === 'date') {
            component = 'DatePicker'
        }

        return { key, component, label: _.startCase(key), vBindObject }
    })
})

function createEmptyItem() {
    const item: Record<string, any> = {}
    subFields.value.forEach(f => { item[f.key] = null })
    return item
}

function addItem() {
    items.value.push(createEmptyItem())
    notifyForm()
}

function removeItem(index: number) {
    items.value.splice(index, 1)
    notifyForm()
}

function notifyForm() {
    formField.value.onChange?.({ value: [...items.value] })
}

function onSubFieldUpdate() {
    notifyForm()
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <div v-for="(item, index) in items" :key="index" class="flex items-end gap-2 border border-surface rounded p-2">
            <div v-for="sub in subFields" :key="sub.key" class="flex flex-col gap-1">
                <label class="text-sm font-medium">{{ sub.label }}</label>
                <component
                    :is="sub.component"
                    :name="`${name}.${index}.${sub.key}`"
                    v-model="item[sub.key]"
                    v-bind="sub.vBindObject"
                    @update:modelValue="onSubFieldUpdate"
                />
                <Message v-if="_.get(fieldState, `${index}.${sub.key}.invalid`)" severity="error">
                    {{ _.get(fieldState, `${index}.${sub.key}.error.message`) }}
                </Message>
            </div>
            <Button v-if="canDelete" icon="pi pi-trash" severity="danger" text @click="removeItem(index)" />
        </div>
        <Button v-if="canAdd" icon="pi pi-plus" label="Add Item" severity="secondary" outlined @click="addItem" class="w-fit" />
    </div>
</template>
