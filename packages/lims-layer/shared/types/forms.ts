export interface FormFieldConfig {
    label?: string
    inputType?: string
    defaultValue?: string | number | boolean | any[]

    // properties passed to the PrimeVue component as v-bind options
    disabled?: boolean
    readonly?: boolean

    canAdd?: boolean // for array fields, whether the user can add items
    canDelete?: boolean // for array fields, whether the user can delete items
}
