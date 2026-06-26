<script setup lang="ts">
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import type { z } from 'zod'
import _ from 'lodash'

// Resolve custom components at setup time — must be in the .vue file for Nuxt's build transform
const smartFormComponents: Record<string, Component | string> = {
    SmartFormInputArray: resolveComponent('SmartFormInputArray'),
    SmartFormAutoCompleter: resolveComponent('SmartFormAutoCompleter'),
    SmartFormNestedSelect: resolveComponent('SmartFormNestedSelect'),
    SmartFormInputNumber: resolveComponent('SmartFormInputNumber'),
    SmartFormDatePicker: resolveComponent('SmartFormDatePicker'),
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
    type: Object as () => FormFieldConfigs,
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
  readOnly: {
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
const dateFieldNames = computed(() => getDateFieldNames(props.zodSchema))
const resolver = (opts: { values: Record<string, any>, names?: string[] }) => {
    const values = coerceDateFields(sanitizeFormValues(opts.values), dateFieldNames.value)
    return zodResolverFn({ ...opts, values })
}

const formFields = computed(() => buildFormFields(props.zodSchema, props.fieldConfigs, smartFormComponents))

const readonlyFields = computed(() => getReadonlyFields(props.zodSchema, props.fieldConfigs))

// ── Record-dependent dynamic field config ────────────────────────────────────
// The live form record is derived from PrimeVue Forms' reactive $form (per-field
// $form[name].value updates live), so these helpers are evaluated IN-TEMPLATE where
// $form is in scope. They are no-ops for fields without the corresponding config.
// relatedRecords holds the full selected objects of autoCompleter fields (keyed by
// the relation name = field name minus a trailing "Id"), fed by @update:relatedRecord.
const relatedRecords = ref<Record<string, any>>({})
const recordOld = ref<Record<string, any>>() // reserved; no consumer reads old values today

const liveRecord = ($form: any) =>
    _.mapValues(_.pickBy($form, (s: any) => _.isObject(s) && 'value' in s), (s: any) => s.value)

const isFieldVisible = ($form: any, f: any) =>
    _.isFunction(f.displayConfig) ? f.displayConfig(liveRecord($form)) !== false : f.displayConfig !== false

const resolveLabel = ($form: any, f: any) =>
    _.isFunction(f.labelConfig) ? f.labelConfig(liveRecord($form), relatedRecords.value) : (f.labelConfig ?? f.label)

const resolveSubtext = ($form: any, f: any) =>
    _.isFunction(f.subtextConfig) ? f.subtextConfig(liveRecord($form), relatedRecords.value)
        : (_.isString(f.subtextConfig) ? f.subtextConfig : f.helpText)

const fieldHandlers = ($form: any, f: any) =>
    _.mapValues(_.pickBy(f.events ?? {}, _.isFunction), (fn: any) => fn(liveRecord($form), recordOld.value))

const fieldKey = ($form: any, f: any) =>
    _.isFunction(f.dynamicKeyFn) ? f.dynamicKeyFn(liveRecord($form)) : f.name

// Resolve a function-valued autoCompleter config against the live record (else no extra binds)
const resolveAutoCompleter = ($form: any, f: any) =>
    f.dynamicAutoCompleter ? f.autoCompleterFn(liveRecord($form)) : {}

const onFormSubmit = (event: FormSubmitEvent<Record<string, unknown>>) => {
    const { values, valid } = event
    if (valid) {
        const filtered = _.omit(values, [...readonlyFields.value])
        emit('submitSuccess', filtered)
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
        <template v-for="field in formFields" :key="fieldKey($form, field)">
            <div v-if="isFieldVisible($form, field)" class="flex flex-col gap-2 pb-3">
                <label class="font-semibold" :for="field.id">{{ resolveLabel($form, field) }}</label>
                <div class="flex items-center gap-2">
                    <component
                        :is="field.component"
                        :id="field.id"
                        :name="field.name"
                        v-bind="field.vBindObject"
                        v-bind="resolveAutoCompleter($form, field)"
                        v-on="fieldHandlers($form, field)"
                        @update:relatedRecord="(r: any) => { relatedRecords[field.name] = r; relatedRecords[field.name.replace(/Id$/, '')] = r }"
                    />
                </div>
                <Message v-if="field.component !== smartFormComponents.SmartFormInputArray ? $form[field.name]?.invalid : false" severity="error">
                    {{ getFormErrorMessage($form, field.name) }}
                </Message>
                <Message v-if="serverErrors[field.name]" severity="error">
                    {{ serverErrors[field.name] }}
                </Message>
                <Message v-if="resolveSubtext($form, field) && !(field.component !== smartFormComponents.SmartFormInputArray ? $form[field.name]?.invalid : false) && !serverErrors[field.name]" severity="secondary" size="small" variant="simple">
                    {{ resolveSubtext($form, field) }}
                </Message>
            </div>
        </template>
        <div class="flex gap-2 pb-8">
            <slot name="form-buttons" />
            <Button v-if="!readOnly" type="submit" label="Submit" :disabled="!$form.valid" />
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
<style scoped>
/* Add any component-specific styles here */
textarea {
    width: 100%;
    min-height: 8rem;
}
</style>
