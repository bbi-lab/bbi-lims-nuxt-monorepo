import _ from 'lodash'
import { z } from 'zod'

interface SchemaItems {
    properties?: Record<string, { default?: any }>;
    type?: string;
    enum?: string[];
    oneOf?: Record<string, SchemaItems>[];
    anyOf?: Record<string, SchemaItems>;
    items?: SchemaItems;
}

interface RecordType {
    [key: string]: any;
}

export const formatFieldLabel =  (val: String) => {
    return _.startCase(val.toString())
        .replace(/(^|\s)(Dna|Rna|Pcr)($|\s)/g, (match) => match.toUpperCase())
        .replace(/(^|\s)Pct($|\s)/g, (match) => '% ').trim()
}

function pushToPath(obj: Object, path: string | string[], item: any) {
    if (_.has(obj, path)) {
        let arr = _.get(obj, path)
        arr.push(item);
    } else {
        _.set(obj, path, [item])
    }
    return obj
}
export const addNewItemToArray = (record: RecordType, key: string | string[], schemaItems: SchemaItems) => {
    if (!_.isArray(_.get(record, key))) _.set(record, key, [])

    if (schemaItems.properties) {
        const newItem: RecordType = {};
        for (const [k, v] of Object.entries(schemaItems.properties)) {
            // default value for foreign key should be set in JSON schema based on props.recordId
            if (v.default) {
                _.set(newItem, k, v.default);
            } else {
                _.set(newItem, k, null);
            }
        }
        pushToPath(record, key, newItem)
    } else if (schemaItems.type == 'string') {
        pushToPath(record, key, '')
    } else if (schemaItems.type == 'integer') {
        pushToPath(record, key, null)
    }
}

export const getFieldType = (val: any, key: string, fieldDefs: Record<string, SchemaItems> | undefined) => {
    const fieldType = _.get(fieldDefs, [key, 'type'])
    if (fieldType) {
        return fieldType
    } else if (_.isArray(val.type) && _.includes(val.type, 'null') && val.type.length == 2) {
        // getting field type for nullable fields
        return _.find(val.type, (x) => x != 'null')
    } else if (val.format=='date-time' || val.anyOf?.[0]?.format=='date-time') {
        return 'date-time'
    } else {
        // no field type defined
        return val.type
    }
}

export const addErrorsToForm = (formElement: HTMLElement, formErrors: Array<{path: string[], message: string}>) => {
    // remove any previous validation errors
    formElement.querySelectorAll('.lims-validation-error').forEach((x) => x.remove())

    // remove red outline from inputs
    formElement.querySelectorAll('.lims-validation-error-input').forEach((x) => {
        x.classList.remove('lims-validation-error-input', 'border-red-500')
    })

    // add error text and styling
    for (const e of formErrors) {
        const elementId = e.path.join('_')
        const element = formElement.querySelector(`#${elementId}`)

        if (!element) {
            console.error(`Element with id ${elementId} not found`)
            continue
        }
        // get input element
        let inputElement
        if (element.tagName == 'INPUT') {
            inputElement = element
        } else {
            inputElement = element.querySelector('input') || element
        }

        if (inputElement) {
            inputElement.classList.add('lims-validation-error-input', '!border-red-500')
            const errorMsg = document.createElement('div')
            errorMsg.setAttribute('class', 'lims-validation-error text-red-500')
            errorMsg.textContent = _.startsWith(e.message, 'Expected ') && _.endsWith(e.message, ', received null') ? 'Required' : e.message

            if (element.parentElement?.classList.contains('quickform-input-wrapper')) {
                element.parentElement?.after(errorMsg)
            } else {
                element.after(errorMsg)
            }
        }
    }
}

export function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch (err) {
    return false
  }
}


export const getFormFieldDefinition = (fieldName: string, zodSchema: z.ZodObject<Record<string, z.ZodTypeAny>>, fieldConfig?: FormFieldConfig) => {
    let primeVueComponent = null
    const vBindObject = {}

    // Traverse Zod schema to find the base type of the field (unwrapping any modifiers like optional, nullable, etc.)
    let zodFieldDef = _.get(zodSchema, `shape.${fieldName}.def`, null)
    while (_.has(zodFieldDef, 'innerType')) {
        zodFieldDef = _.get(zodFieldDef, 'innerType.def', null)
    }
    const zodType = zodFieldDef?.type

    // get additional fieldConfig object if available
    // const fieldConfig = _.get(props.fieldConfigs, fieldName)

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
        primeVueComponent = 'InputArray'
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
