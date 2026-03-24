export interface FormFieldConfig {
    label?: string
    inputType?: string
    defaultValue?: string | number | boolean | any[]

    // properties passed to the PrimeVue component as v-bind options
    disabled?: boolean
    readonly?: boolean

    // inputarray configuration
    inputarray?: {
        canAdd?: boolean
        canDelete?: boolean
    }

    // autocompleter configuration
    autocompleter?: {
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
}
