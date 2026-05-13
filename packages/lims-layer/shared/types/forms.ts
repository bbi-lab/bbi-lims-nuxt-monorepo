export interface FormFieldConfig {
    label?: string
    inputType?: string
    defaultValue?: string | number | boolean | any[]

    // properties passed to the PrimeVue component as v-bind options
    disabled?: boolean
    readonly?: boolean

    // inputArray configuration
    inputArray?: {
        canAdd?: boolean
        canDelete?: boolean
        fieldConfigs?: FormFieldConfigs
    }

    // autoCompleter configuration
    autoCompleter?: {
        searchBaseUrl: string
        searchFields?: string[]
        valueField?: string
        displayFields?: string[]
        displayFormat?: Function
        searchWithClause?: Object
        searchWhereClause?: Object
        searchMode?: 'JsonLogic' | 'simple'
        dropdown?: boolean
        hideClearButton?: boolean
        placeholderValue?: string
    }

    // nestedSelect configuration
    nestedSelect?: {
        parentSearchBaseUrl: string
        parentValueField?: string
        parentDisplayFields?: string[]
        parentDisplayOptions?: Object
        parentSearchWithClause?: Object
        parentIftaLabel?: string
        searchBaseUrl: string
        valueField?: string
        displayFields?: string[]
        displayFormat?: Function
        searchWithClause?: Object
        searchWhereClause?: Object
        parentKeyField: string
        hideClearButton?: boolean
        placeholderValue?: string
        inputClass?: string
    }
}

export type FormFieldConfigs = { [key: string]: FormFieldConfig }
