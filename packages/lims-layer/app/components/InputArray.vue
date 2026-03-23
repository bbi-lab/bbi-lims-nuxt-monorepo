<script setup lang="ts">
import _ from 'lodash'
import type { z } from 'zod'

const props = defineProps({
    name: { type: String, required: true },
    itemSchema: {
        type: Object as () => z.ZodObject<Record<string, z.ZodTypeAny>>,
        required: true
    },
    fieldConfigs: {
        type: Object as () => Record<string, FormFieldConfig>,
        required: false,
        default: () => ({}),
    },
    canAdd: { type: Boolean, required: false, default: true },
    canDelete: { type: Boolean, required: false, default: true },
})

// Integrate with PrimeVue Forms by injecting the parent Form instance
// and registering this field, mirroring how BaseEditableHolder works
const $pcForm = inject('$pcForm') as any
const formField = ref<Record<string, any>>({})
const itemErrors = ref<Record<number, Record<string, string>>>({})
const touchedSubFields = ref(new Set<string>())

watch(
    () => props.name,
    (name) => {
        if ($pcForm && name) {
            formField.value = $pcForm.register(name, {
                name,
                validateOnBlur: true,
                resolver: ({ value }: { value: any }) => {
                    const errors: string[] = []
                    const perItem: Record<number, Record<string, string>> = {}

                    if (Array.isArray(value)) {
                        value.forEach((item: any, index: number) => {
                            const result = props.itemSchema.safeParse(item)
                            if (!result.success) {
                                const itemErrs: Record<string, string> = {}
                                perItem[index] = itemErrs
                                for (const issue of result.error.issues) {
                                    const path = issue.path.join('.')
                                    itemErrs[path] = issue.message
                                    errors.push(issue.message)
                                }
                            }
                        })
                    }

                    itemErrors.value = perItem
                    return { errors }
                },
            }) || {}
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
    return _.keys(props.itemSchema.shape).map((fieldName) => {
        const fieldDefinition = getFormFieldDefinition(fieldName, props.itemSchema, _.get(props.fieldConfigs, fieldName))

        return {
            key: fieldName,
            component: fieldDefinition.primeVueComponent,
            label: fieldDefinition.label || _.startCase(fieldName),
            vBindObject: fieldDefinition.vBindObject,
        }
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
    // Update touched keys: remove entries for deleted index, shift higher indices down
    const updated = new Set<string>()
    for (const key of touchedSubFields.value) {
        const [idxStr, ...rest] = key.split('.')
        const idx = Number(idxStr)
        if (idx < index) updated.add(key)
        else if (idx > index) updated.add(`${idx - 1}.${rest.join('.')}`)
    }
    touchedSubFields.value = updated

    items.value.splice(index, 1)
    notifyForm()
    $pcForm?.validate?.(props.name)
}

function notifyForm() {
    formField.value.onChange?.({ value: [...items.value] })
}

function onSubFieldUpdate() {
    notifyForm()
}

function onSubFieldBlur(index: number, key: string) {
    touchedSubFields.value.add(`${index}.${key}`)
    formField.value.onBlur?.()
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <div v-for="(item, index) in items" :key="index" class="flex items-end gap-2 border border-surface rounded p-2">
            <div v-for="sub in subFields" :key="sub.key" class="flex flex-col gap-1">
                <label class="text-sm font-medium">{{ sub.label }}</label>
                <component
                    :is="sub.component"
                    v-model="item[sub.key]"
                    v-bind="sub.vBindObject"
                    @update:modelValue="onSubFieldUpdate"
                    @blur="onSubFieldBlur(index, sub.key)"
                />
                <Message v-if="touchedSubFields.has(`${index}.${sub.key}`) && itemErrors[index]?.[sub.key]" severity="error">
                    {{ itemErrors[index][sub.key] }}
                </Message>
            </div>
            <Button v-if="canDelete" icon="pi pi-trash" severity="danger" text @click="removeItem(index)" />
        </div>
        <Button v-if="canAdd" icon="pi pi-plus" label="Add Item" severity="secondary" outlined @click="addItem" class="w-fit" />
    </div>
</template>
