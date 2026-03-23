<script setup lang="ts">
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { computed } from 'vue'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import _ from 'lodash'
import type { z } from 'zod'

const toast = useToast()
const InputArray = resolveComponent('InputArray')

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
    type: Object as () => Record<string, FormFieldConfig>,
    required: false,
    default: () => ({}),
  },
  formDebug: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const baseResolver = zodResolver(props.zodSchema)
const resolver = (args: any) => {
    const coerced = _.mapValues(args.values, v => v === '' ? null : v)
    return baseResolver({ ...args, values: coerced })
}

// Extract schema fields for dynamic rendering
const formFields = computed(() => {
    return _.keys(props.zodSchema.shape).map((fieldName) => {
        const fieldDefinition = getFormFieldDefinition(fieldName, props.zodSchema, _.get(props.fieldConfigs, fieldName))

        return {
            id: fieldName,
            name: fieldName,
            component: fieldDefinition.primeVueComponent === 'InputArray' ? InputArray : fieldDefinition.primeVueComponent,
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
                />
                <Message v-if="field.component !== InputArray ? $form[field.name]?.invalid : false" severity="error">
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
