<script setup lang="ts">
import _ from 'lodash'

const props = defineProps({
  // Field identification for SmartForms integration
  name: { type: String, required: true },

  // AutoCompleter configuration props (same as original)
  searchBaseUrl: { type: String, required: true },
  searchFields: { type: Array, default: ['name'] },
  valueField: { type: String, default: 'id' },
  displayFields: { type: Array, default: ['name'] },
  displayFormat: { type: Function }, // callback function to return formatted string
  searchWithClause: { type: Object },
  searchWhereClause: { type: Object },
  searchMode: { type: String as PropType<'JsonLogic' | 'simple'>, default: 'JsonLogic' },

  // UI configuration props (same as original)
  dropdown: { type: Boolean },
  disabled: { type: Boolean },
  hideClearButton: { type: Boolean },
  iftaLabel: { type: String },
  inputId: { type: String },
  placeholderValue: { type: String },
  inputClass: { type: String },
})

// Integrate with PrimeVue Forms by injecting the parent Form instance
const $pcForm = inject('$pcForm') as any
const formField = ref<Record<string, any>>({})

// Local state for the AutoComplete component
const currentValue = ref()
const suggestions = ref<{code: string | number, label: string, record: any }[]>([])
const isUserTyping = ref(false) // Track if user is actively typing

// Register this field with the form
watch(
  () => props.name,
  (name) => {
    if ($pcForm && name) {
      formField.value = $pcForm.register(name, {
        name,
        // validateOnBlur: true,
        // resolver: ({ value }: { value: any }) => {
        //   // Simple validation - just check if value exists when required
        //   // Additional validation can be added here if needed
        //   const errors: string[] = []
        //   return { errors }
        // },
      }) || {}
    }
  },
  { immediate: true },
)

// Debounce form state changes to avoid clearing during rapid typing
const debouncedFormStateSync = _.debounce(async (newValue) => {
  // Don't clear value if user is actively typing
  if (isUserTyping.value) {
    return
  }

  if (newValue && newValue !== getCurrentValueCode()) {
    await setValueFromFormState(newValue)
  } else if (newValue === null || newValue === undefined || newValue === '') {
    clearValue()
  }
}, 50)

// Sync from form state (handles form reset and external value changes)
watch(
  () => $pcForm?.getFieldState?.(props.name)?.value,
  debouncedFormStateSync,
)

// Helper function to get the current value's code
function getCurrentValueCode() {
  return _.has(currentValue.value, 'code') ? _.get(currentValue.value, 'code') : null
}

// Set the current value based on form state
async function setValueFromFormState(newValue: any) {
  try {
    if (_.isObject(newValue)) {
      // If it's already an object with record data, use it directly
      currentValue.value = {
        code: _.get(newValue, props.valueField),
        label: getDisplayValue(newValue),
        record: newValue
      }
    } else if (_.isString(newValue) || _.isNumber(newValue)) {
      // If it's just an ID, fetch the full record
      const record = await RecordService.getRecord(props.searchBaseUrl, String(newValue), props.searchWithClause)
      currentValue.value = {
        code: newValue,
        label: getDisplayValue(record),
        record: record
      }
    }
  } catch (error) {
    console.error('Error setting value from form state:', error)
    clearValue()
  }
}

// Display value formatting (same as original)
function getDisplayValue(record: any) {
  const result = []

  if (_.isFunction(props.displayFormat)) {
    return props.displayFormat(record)
  } else {
    for (const field of props.displayFields as string[]) {
      result.push(_.get(record, field))
    }
    return _.join(_.compact(result), ': ')
  }
}

// Autocomplete search function (same as original)
async function autocompleteSearch(event: any) {
  isUserTyping.value = true // User is actively typing

  let whereClause
  if (props.searchMode == 'simple') {
    whereClause = { searchTerm: event.query }
  } else {
    whereClause = props.searchFields.length > 1 ?
      { "or": _.map(props.searchFields, (x) => { return { "startsWith": [{ "var": x }, event.query] } }) } :
      { "startsWith": [{ "var": props.searchFields[0] }, event.query] }

    if (props.searchWhereClause) {
      whereClause = { "and": [whereClause, props.searchWhereClause] }
    }
  }

  try {
    const filtered = await RecordService.getRecords(props.searchBaseUrl, props.searchWithClause, whereClause)
    suggestions.value = _.map(filtered, (x) => {
      return {
        code: x[props.valueField],
        label: getDisplayValue(x),
        record: x
      }
    })
  } catch (error) {
    console.error('Error in autocomplete search:', error)
    suggestions.value = []
  }
}

// Clear value function
function clearValue() {
  isUserTyping.value = false // Reset typing flag
  currentValue.value = null
  notifyFormOfChange(null)
}

// Clear button click handler
function clickedClearValue() {
  clearValue()
//   emit('clearedValue')
}

// Handle user input (when they start typing)
function handleInput() {
  isUserTyping.value = true
}

// Handle focus - prepare for typing
function handleFocus() {
  isUserTyping.value = true
}

// Handle keydown - catch typing immediately
function handleKeydown(event: KeyboardEvent) {
  // Set typing flag immediately on any key that could change the input
  if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete') {
    isUserTyping.value = true
  }
}

// Handle option selection
function setModelValue() {
  isUserTyping.value = false // User finished typing by making a selection

  if (_.has(currentValue.value, 'code')) {
    const selectedValue = _.get(currentValue.value, 'code')
    const selectedRecord = _.get(currentValue.value, 'record')

    // Notify form with the selected value (can be just the ID or the full record based on needs)
    notifyFormOfChange(selectedValue)

    // Emit events for backward compatibility
    // emit('changedValue', { value: selectedValue, record: selectedRecord })
  } else {
    clearValue()
  }
}

// Handle blur event
async function lostFocus() {
  isUserTyping.value = false // User finished typing by losing focus

  if (!_.has(currentValue.value, 'code')) {
    clearValue()
  }
  formField.value.onBlur?.()
}

// Notify form of value changes and trigger validation
function notifyFormOfChange(value: any) {
  formField.value.onChange?.({ value })

  // Trigger form validation update
  nextTick(() => {
    $pcForm?.validate?.(props.name)
    $pcForm?.setFieldState?.(props.name, {
      value,
      touched: true,
      dirty: true
    })
  })
}

// Emit definitions for backward compatibility
// const emit = defineEmits([
//   'clearedValue',
//   'changedValue',
// ])

// Expose methods for external access
defineExpose({
  clearValue,
})
</script>

<template>
    <div class="flex flex-row gap-2">
        <component :is="_.isEmpty(iftaLabel) ? 'span' : 'IftaLabel'">
            <AutoComplete
                :name="name"
                v-model="currentValue"
                :inputClass="inputClass"
                :id="inputId"
                :suggestions="suggestions"
                optionLabel="label"
                @complete="autocompleteSearch"
                @option-select="setModelValue"
                @blur="lostFocus"
                @input="handleInput"
                @focus="handleFocus"
                @keydown="handleKeydown"
                :placeholder="placeholderValue"
                :dropdown="dropdown"
                :disabled="disabled"
            />
            <label v-if="!_.isEmpty(iftaLabel)" :for="inputId">{{ iftaLabel }}</label>
        </component>

        <Button
            v-if="!disabled && !hideClearButton"
            class="ml-2"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="clickedClearValue"
        />
    </div>
</template>
