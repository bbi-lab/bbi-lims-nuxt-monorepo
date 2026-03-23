<script setup lang="ts">
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { computed } from 'vue'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import _ from 'lodash'
import type { z } from 'zod'

const toast = useToast()
const InputArray = resolveComponent('InputArray')

export interface FieldConfig {
    label?: string
    inputType?: string
}

const props = defineProps({
  zodSchema: {
    type: Object as () => z.ZodObject<Record<string, z.ZodTypeAny>>,
    required: true,
  },
  initialValues: {
    type: Object as () => Record<string, unknown>,
    required: true,
  },
  submitUrl: {
    type: String,
    required: true,
  },
  requestType: {
    type: String as () => 'POST' | 'PUT' | 'PATCH',
    required: false,
    default: 'POST',
  },
  fieldConfigs: {
    type: Object as () => Record<string, FieldConfig>,
    required: false,
    default: () => ({}),
  },
  formDebug: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const resolver = zodResolver(props.zodSchema)

const getFieldDefinition = (fieldName: string) => {
    let primeVueComponent = null
    const vBindObject = {}
    const zodSchema = props.zodSchema

    // Traverse Zod schema to find the base type of the field (unwrapping any modifiers like optional, nullable, etc.)
    let zodFieldDef = _.get(zodSchema, `shape.${fieldName}.def`, null)
    while (_.has(zodFieldDef, 'innerType')) {
        zodFieldDef = _.get(zodFieldDef, 'innerType.def', null)
    }
    const zodType = zodFieldDef?.type

    // get additional fieldConfig object if available
    const fieldConfig = _.get(props.fieldConfigs, fieldName)

    // determine PrimeVue component based on Zod type and fieldConfig
    if (zodType == 'string') {
        const inputType = fieldConfig?.inputType
        if (inputType === 'password') {
            primeVueComponent = 'Password'
        } else if (inputType === 'textarea') {
            primeVueComponent = 'Textarea'
        } else {
            primeVueComponent = 'InputText'
        }
    } else if (zodType == 'number' || zodType === 'bigint') {
        primeVueComponent = 'InputNumber'
    } else if (zodType == 'boolean') {
        primeVueComponent = 'Checkbox'
        _.set(vBindObject, 'binary', true) // for boolean fields, we want to use the binary mode of the Checkbox component
    } else if (zodType == 'date') {
        primeVueComponent = 'DatePicker'
    } else if (zodType == 'enum') {
        primeVueComponent = 'Dropdown'
        // Extract enum values from Zod schema, and map them to options for the Dropdown component
        const enumValues = _.get(zodFieldDef, 'entries', [])

        // Re-format entries to pass to PrimeVue Dropdown
        const options = _.map(enumValues, (value, key) => ({
            name: key,
            code: value,
        }))
        _.assign(vBindObject, {
            options,
            optionLabel: 'name',
            optionValue: 'code',
            placeholder: 'Select an option',
        })
    } else if (zodType == 'array') {
        primeVueComponent = InputArray
        // Pass the element schema so InputArray can determine sub-fields
        const itemSchema = _.get(zodSchema, `shape.${fieldName}.def.element`)
        _.set(vBindObject, 'itemSchema', itemSchema)
    } else {
        throw new Error(`Could not determine PrimeVue component for "${fieldName}": unrecognized Zod type "${zodType}"`)
    }

    // return full field definition
    return {
        primeVueComponent,
        label: fieldConfig?.label,
        vBindObject,
    }
}

// Extract schema fields for dynamic rendering
const formFields = computed(() => {
    return _.keys(props.zodSchema.shape).map((fieldName) => {
        const fieldDefinition = getFieldDefinition(fieldName)

        return {
            id: fieldName,
            name: fieldName,
            component: fieldDefinition.primeVueComponent,
            label: fieldDefinition.label || _.startCase(fieldName),
            vBindObject: fieldDefinition.vBindObject,
        }
    })
})

const onFormSubmit = (event: FormSubmitEvent<Record<string, unknown>>) => {
    const { values, valid } = event
    if (valid) {
        toast.add({
            severity: 'success',
            summary: 'Form Submitted',
            detail: `Your form has been submitted to ${props.submitUrl} using ${props.requestType}.`,
            life: 3000,
        })
        console.log('Submitted values:', values)
    }
}
</script>

<template>
    <Form
        v-slot="$form"
        :initialValues="initialValues"
        :resolver="resolver"
        :validateOnValueUpdate="false"
        :validateOnBlur="true"
        @submit="onFormSubmit"
        >
        <template v-for="field in formFields" :key="field.name">
            <div class="flex flex-col gap-2 pb-2">
                <label class="font-semibold" :for="field.id">{{ field.label }}</label>
                <component
                    :is="field.component"
                    :id="field.id"
                    :name="field.name"
                    v-bind="field.vBindObject"
                    :fieldState="field.component === InputArray ? $form[field.name] : undefined"
                />
                <Message v-if="$form[field.name]?.invalid" severity="error">
                    {{ _.get($form, `${field.name}.error.message`) }}
                </Message>
            </div>
        </template>
        <Button type="submit" label="Submit" :disabled="!$form.valid" />
        <div v-if="formDebug" class="mb-4 p-4 bg-gray-100 rounded">
            <h3>Debug Info:</h3>
            <pre>initialValues: {{ JSON.stringify(initialValues, null, 2) }}</pre>
            <hr />
            <pre>$form: {{ JSON.stringify($form, null, 2) }}</pre>
            <hr />
            <pre>zodSchema: {{ JSON.stringify(zodSchema, null, 2) }}</pre>
            <hr />
            <pre>formFields: {{ JSON.stringify(formFields, null, 2) }}</pre>
        </div>
    </Form>
</template>
