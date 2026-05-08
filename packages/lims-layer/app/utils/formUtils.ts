import _ from 'lodash'
import { z } from 'zod'
import type { Component, Ref } from 'vue'
import type { $ZodTypeDef } from "zod/v4/core"

export const formatFieldLabel =  (val: String) => {
    return _.startCase(val.toString())
        .replace(/(^|\s)(Dna|Rna|Pcr)(?=$|\s)/g, (match) => match.toUpperCase())
        .replace(/(^|\s)Pct(?=$|\s)/g, ' %').trim()
}

export function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch (err) {
    return false
  }
}

/**
 * Functions for use with SmartForm and child components such as SmartFormInputArray, which generate forms based on Zod schemas and fieldConfigs
 */
export const getFormFieldDefinition = (fieldName: string, zodSchema: z.ZodObject<Record<string, z.ZodTypeAny>>, fieldConfig?: FormFieldConfig) => {
    let primeVueComponent = null
    const vBindObject = {}

    // Check if this field should use nested select
    if (fieldConfig?.nestedSelect) {
        primeVueComponent = 'SmartFormNestedSelect'
        _.assign(vBindObject, fieldConfig.nestedSelect)

        // set other fieldConfig options as v-bind properties (excluding nestedSelect)
        _.assign(vBindObject, _.omit(fieldConfig, ['label', 'inputType', 'defaultValue', 'nestedSelect']))

        return {
            primeVueComponent,
            label: fieldConfig?.label,
            vBindObject,
        }
    }

    // Check if this field should use autoCompleter
    if (fieldConfig?.autoCompleter) {
        primeVueComponent = 'SmartFormAutoCompleter'
        _.assign(vBindObject, fieldConfig.autoCompleter)

        // set other fieldConfig options as v-bind properties (excluding autoCompleter)
        _.assign(vBindObject, _.omit(fieldConfig, ['label', 'inputType', 'defaultValue', 'autoCompleter']))

        return {
            primeVueComponent,
            label: fieldConfig?.label,
            vBindObject,
        }
    }

    // Traverse Zod schema to find the base type of the field (unwrapping any modifiers like optional, nullable, etc.)
    let zodFieldDef = _.get(zodSchema, `shape.${fieldName}.def`, null)
    while (_.has(zodFieldDef, 'innerType')) {    zodFieldDef = _.get(zodFieldDef, 'innerType.def', null)    }
    const zodType = zodFieldDef?.type

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
        primeVueComponent = 'SmartFormInputNumber'
    } else if (zodType == 'boolean') {
        primeVueComponent = 'Checkbox'
        _.set(vBindObject, 'binary', true) // for boolean fields, we want to use the binary mode of the Checkbox component
    } else if (zodType == 'date') {
        primeVueComponent = 'DatePicker'
    } else if (zodType == 'enum') {
        primeVueComponent = 'Select'
        // Extract enum values from Zod schema, and map them to options for the Select component
        const enumValues = _.get(zodFieldDef, 'entries', [])

        // Re-format entries to pass to PrimeVue Select
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
        primeVueComponent = 'SmartFormInputArray'
        // Pass the element schema so SmartFormInputArray can determine sub-fields
        const itemSchema = _.get(zodSchema, `shape.${fieldName}.def.element`)
        _.set(vBindObject, 'itemSchema', itemSchema)

        _.assign(vBindObject, fieldConfig?.inputArray)
    } else {
        throw new Error(`Could not determine PrimeVue component for "${fieldName}": unrecognized Zod type "${zodType}"`)
    }

    // set other fieldConfig options as v-bind properties
    _.assign(vBindObject, _.omit(fieldConfig, [
        'label',
        'inputType',
        'defaultValue',
        'autoCompleter',
        'inputArray',
        'nestedSelect',
    ]))

    // return full field definition
    return {
        primeVueComponent,
        label: fieldConfig?.label,
        vBindObject,
    }
}

export const getBlankFormInitialValues = (zodSchema: z.ZodObject<Record<string, z.ZodTypeAny>>, fieldConfigs?: Record<string, FormFieldConfig>) => {
    // set initial values to null for all fields in the schema, except for arrays which should be set to empty arrays
    return _.mapValues(zodSchema.shape, (zodObj, fieldName) => {
        let zodObjDef: $ZodTypeDef = zodObj.def
        while (_.has(zodObjDef, 'innerType.def')) {
            zodObjDef = _.get(zodObjDef, 'innerType.def') as $ZodTypeDef
        }
        const defaultValue = fieldConfigs?.[fieldName]?.defaultValue
        if (defaultValue !== undefined) {
            return defaultValue
        }
        return _.get(zodObjDef, 'type') === 'array' ? [] : null
    })
}

// ──────────────────────────────────────────────
// Shared SmartForm / SmartFormMultiple utilities
// ──────────────────────────────────────────────

/**
 * Convert empty-string values to null so Zod required-field
 * validation works correctly (empty strings would otherwise
 * pass string-type checks).
 */
export const sanitizeFormValues = (values: Record<string, any>): Record<string, any> => {
    return _.mapValues(values, (v) => (v === '' ? null : v))
}

/**
 * Returns true if the Zod field at the given name in the schema is wrapped
 * with z.readonly() at any level of its type definition.
 */
export function isZodFieldReadonly(zodSchema: z.ZodObject<Record<string, z.ZodTypeAny>>, fieldName: string): boolean {
    let zodFieldDef: any = _.get(zodSchema, `shape.${fieldName}.def`, null)
    while (zodFieldDef) {
        if (zodFieldDef.type === 'readonly') return true
        if (_.has(zodFieldDef, 'innerType')) {
            zodFieldDef = _.get(zodFieldDef, 'innerType.def', null)
        } else {
            break
        }
    }
    return false
}

/**
 * Build the array of field descriptors used by both SmartForm and
 * SmartFormMultiple for dynamic rendering.
 *
 * @param componentMap - A map of custom component name → resolved component,
 *                       built via resolveComponent() in the calling .vue file's
 *                       <script setup>. Nuxt's build transform only processes
 *                       resolveComponent calls inside .vue files.
 */
export const buildFormFields = (
    zodSchema: z.ZodObject<Record<string, z.ZodTypeAny>>,
    fieldConfigs: Record<string, FormFieldConfig> | undefined,
    componentMap: Record<string, Component | string>,
) => {
    return _.keys(zodSchema.shape).map((fieldName) => {
        const fieldConfig = _.get(fieldConfigs, fieldName)
        const schemaReadonly = isZodFieldReadonly(zodSchema, fieldName)
        const def = getFormFieldDefinition(fieldName, zodSchema, fieldConfig)

        // If the schema marks the field as readonly and no explicit disabled override is
        // provided via fieldConfig, disable the component so it cannot be edited when shown.
        if (schemaReadonly && fieldConfig?.disabled === undefined) {
            _.set(def.vBindObject, 'disabled', true)
        }

        return {
            id: fieldName,
            name: fieldName,
            component: componentMap[def.primeVueComponent] ?? def.primeVueComponent,
            label: def.label || _.startCase(fieldName),
            vBindObject: def.vBindObject,
        }
    })
}

/**
 * Standardise the error message shown beneath a form field.
 * Replaces Zod's ", received null/undefined" suffix with a friendlier "Required".
 */
export const getFormErrorMessage = (form: any, fieldName: string) => {
    const errorMsg = _.get(form, `${fieldName}.error.message`)
    const pattern = /, received (null|undefined)$/
    return pattern.test(errorMsg) ? 'Required' : errorMsg
}

/**
 * Multi-edit state record used by SmartFormMultiple's combinedRecord ref.
 */
export interface CombinedRecordEntry {
    val: any
    conflictingValueCount?: number
    valClearedByUser?: boolean
}

/**
 * Create a PrimeVue Forms–compatible resolver that wraps the Zod schema but
 * makes conflicting (untouched) fields optional so they don't block submission.
 *
 * The resolver reads `combinedRecord` reactively, so wrap the call in `computed`
 * at the call-site so it re-evaluates as combinedRecord changes.
 */
export const createMultiEditResolver = (
    zodSchema: z.ZodObject<Record<string, z.ZodTypeAny>>,
    combinedRecord: Ref<Record<string, CombinedRecordEntry>>,
) => {
    // Returns the resolver function matching PrimeVue's FormResolverOptions → Record<string, any>
    return ({ values: rawValues }: { values: Record<string, any>, names?: string[] }) => {
        const values = sanitizeFormValues(rawValues)
        // Build a modified shape: make conflicting+untouched fields optional
        const shape: Record<string, z.ZodTypeAny> = {}
        for (const [fieldName, zodField] of Object.entries(zodSchema.shape)) {
            const entry = combinedRecord.value[fieldName]
            const isConflictingAndUntouched = entry
                && _.has(entry, 'conflictingValueCount')
                && _.isNull(entry.val)
                && !entry.valClearedByUser
            shape[fieldName] = isConflictingAndUntouched ? zodField.nullable().optional() : zodField
        }

        const modified = z.object(shape)
        const result = modified.safeParse(values)

        if (result.success) return { errors: {} }

        // Map Zod issues → PrimeVue Forms error shape: { errors: { fieldName: [issue, ...] } }
        // Must match the format returned by zodResolver (each field maps to an array of error objects).
        const errors: Record<string, any[]> = {}
        for (const issue of result.error.issues) {
            const path = issue.path.join('.')
            if (path) {
                errors[path] ||= []
                errors[path].push(issue)
            }
        }
        return { errors }
    }
}
