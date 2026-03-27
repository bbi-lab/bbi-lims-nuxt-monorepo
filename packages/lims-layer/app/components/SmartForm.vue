<script setup lang="ts">
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { computed } from 'vue'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import _ from 'lodash'
import type { z } from 'zod'

const toast = useToast()
const SmartFormInputArray = resolveComponent('SmartFormInputArray')
const SmartFormAutoCompleter = resolveComponent('SmartFormAutoCompleter')
const SmartFormNestedSelect = resolveComponent('SmartFormNestedSelect')

const props = defineProps({
  zodSchema: {
    type: Object as () => z.ZodObject<Record<string, z.ZodTypeAny>>,
    required: true,
  },
  initialValues: {
    type: Object as () => Record<string, unknown>,
    required: true,
  },
  fieldConfigs: {
    type: Object as () => Record<string, FormFieldConfig>,
    required: false,
    default: () => ({}),
  },
  recordIds: {
    type: Array as () => string[],  // for edit forms where we need to know the record ID(s) to include in the API request
    required: false,
    default: () => [],
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

const baseResolver = zodResolver(props.zodSchema)
const resolver = (args: any) => {
    const coerced = _.mapValues(args.values, v => v === '' ? null : v)
    return baseResolver({ ...args, values: coerced })
}

// Extract schema fields for dynamic rendering
const formFields = computed(() => {
    return _.keys(props.zodSchema.shape).map((fieldName) => {
        const fieldDefinition = getFormFieldDefinition(fieldName, props.zodSchema, _.get(props.fieldConfigs, fieldName))

        // Custom components must be converted from string to actual component reference for dynamic rendering
        return {
            id: fieldName,
            name: fieldName,
            component: fieldDefinition.primeVueComponent === 'SmartFormInputArray'
                ? SmartFormInputArray
                : fieldDefinition.primeVueComponent === 'SmartFormAutoCompleter'
                ? SmartFormAutoCompleter
                : fieldDefinition.primeVueComponent === 'SmartFormNestedSelect'
                ? SmartFormNestedSelect
                : fieldDefinition.primeVueComponent,
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
            life: 3000,
        })
        emit('submitSuccess', values)
        console.log('Submitted values:', values)
    }
}

const getErrorMessage = (form: any, fieldName: string) => {
    const errorMsg = _.get(form, `${fieldName}.error.message`)
    const pattern = /, received (null|undefined)$/
    return pattern.test(errorMsg) ? 'Required' : errorMsg
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
                <Message v-if="field.component !== SmartFormInputArray ? $form[field.name]?.invalid : false" severity="error">
                    {{ getErrorMessage($form, field.name) }}
                </Message>
            </div>
        </template>
        <Button type="submit" label="Submit" :disabled="!$form.valid" />
        <div v-if="formDebug" class="flex flex-col my-4 p-4 bg-blue-100 rounded">
            <h3>Debug Info:</h3>
            <div class="m-4">
                <pre class="whitespace-pre-wrap wrap-break-word">initialValues: {{ initialValues }}</pre>
                <hr />
                <pre class="whitespace-pre-wrap wrap-break-word">$form: {{ $form }}</pre>
                <hr />
                <pre class="whitespace-pre-wrap wrap-break-word">zodSchema: {{ zodSchema }}</pre>
                <hr />
                <pre class="whitespace-pre-wrap wrap-break-word">formFields: {{ formFields }}</pre>
            </div>
        </div>
    </Form>
</template>
