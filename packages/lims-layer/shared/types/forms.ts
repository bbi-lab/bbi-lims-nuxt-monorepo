type FieldFn<T> = (record: Record<string, any>, relatedRecords: Record<string, any>) => T

export interface AutoCompleterConfig {
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
    // string, or a function (data) => class evaluated per option / selected value
    // (data is the {code,label,record} wrapper) — e.g. strike-through archived records
    inputClass?: string | ((data: any) => string)
}

export interface FormFieldConfig {
    // May be a function of (record, relatedRecords) for a dynamic label.
    label?: string | FieldFn<string>
    helpText?: string
    // Help text rendered below the field (alias of helpText; QuickForm called it subtext).
    // May be a function of (record, relatedRecords) for dynamic help text.
    subtext?: string | FieldFn<string>
    inputType?: string

    // Render a clickable external-link button next to the (still-editable) text input when the
    // live value is a valid URL. No effect when unset. (Dates use `dateType`, not `type`.)
    type?: 'hyperlink'
    defaultValue?: string | number | boolean | any[]

    // Field display order (mirrors ColumnDefinition.index for tables): SmartForm and
    // SmartFormInputArray render fields sorted ascending by `index`. Fields without
    // `index` keep their schema (source) order and appear after any indexed fields.
    index?: number

    // Conditional visibility: hide the field when this is false / returns false for the
    // current record. Omit to always show (matches prior behavior).
    display?: boolean | ((record: Record<string, any>) => boolean)

    // Event handlers wired to the field's input component, e.g.
    // { focus: (record, recordOld) => ... }. Each handler is called with the current record.
    events?: Record<string, (record: any, recordOld: any) => any>

    // Force the field to re-mount when this key changes (used as the v-for :key) — e.g. to
    // re-query an autoCompleter after a field it depends on changes.
    dynamicKey?: (record: Record<string, any>) => string

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

    // autoCompleter configuration — static, or a function of the record for dynamic config
    // (e.g. a searchWhereClause derived from another field's value).
    autoCompleter?: AutoCompleterConfig | ((record: Record<string, any>) => AutoCompleterConfig)

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
