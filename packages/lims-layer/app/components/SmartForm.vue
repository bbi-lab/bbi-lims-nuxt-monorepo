<script setup lang="ts">
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { computed } from 'vue'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import type { z } from 'zod'

// Resolve custom components at setup time — must be in the .vue file for Nuxt's build transform
const smartFormComponents: Record<string, Component | string> = {
    SmartFormInputArray: resolveComponent('SmartFormInputArray'),
    SmartFormAutoCompleter: resolveComponent('SmartFormAutoCompleter'),
    SmartFormNestedSelect: resolveComponent('SmartFormNestedSelect'),
    SmartFormInputNumber: resolveComponent('SmartFormInputNumber'),
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
  fieldConfigs: {
    type: Object as () => Record<string, FormFieldConfig>,
    required: false,
    default: () => ({}),
  },
  recordIds: {
    type: Array as () => string[],
    required: false,
    default: () => [],
  },
  formDebug: {
    type: Boolean,
    required: false,
    default: false,
  },
  serverErrors: {
    type: Object as () => Record<string, string>,
    required: false,
    default: () => ({}),
  },
})

const emit = defineEmits([
    'submitSuccess',
])

const zodResolverFn = zodResolver(props.zodSchema)
const resolver = (opts: { values: Record<string, any>, names?: string[] }) => {
    return zodResolverFn({ ...opts, values: sanitizeFormValues(opts.values) })
}

const formFields = computed(() => buildFormFields(props.zodSchema, props.fieldConfigs, smartFormComponents))

const onFormSubmit = (event: FormSubmitEvent<Record<string, unknown>>) => {
    const { values, valid } = event
    if (valid) {
        emit('submitSuccess', values)
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
                <div class="flex items-center gap-2">
                    <component
                        :is="field.component"
                        :id="field.id"
                        :name="field.name"
                        v-bind="field.vBindObject"
                    />
                </div>
                <Message v-if="field.component !== smartFormComponents.SmartFormInputArray ? $form[field.name]?.invalid : false" severity="error">
                    {{ getFormErrorMessage($form, field.name) }}
                </Message>
                <Message v-if="serverErrors[field.name]" severity="error">
                    {{ serverErrors[field.name] }}
                </Message>
            </div>
        </template>
        <div class="flex gap-2">
            <slot name="form-buttons" />
            <Button type="submit" label="Submit" :disabled="!$form.valid" />
        </div>
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
