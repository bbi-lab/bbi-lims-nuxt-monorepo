export interface FormFieldConfig {
    label?: string
    helpText?: string
    // Help text rendered below the field (alias of helpText; QuickForm called it subtext)
    subtext?: string
    inputType?: string
    defaultValue?: string | number | boolean | any[]

    // For date columns: render the DatePicker as date-only or with a time picker.
    // Defaults to 'datetime'. Time is shown/edited in the user's local time zone;
    // values are stored/sent as UTC (a JS Date is a UTC instant serialized via ISO).
    dateType?: 'date' | 'datetime'

    // properties passed to the PrimeVue component as v-bind options
    disabled?: boolean
    readonly?: boolean
    // numeric constraints forwarded to SmartFormInputNumber for number/integer fields
    min?: number
    max?: number
    minFractionDigits?: number
    maxFractionDigits?: number

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
        inputClass?: string
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
