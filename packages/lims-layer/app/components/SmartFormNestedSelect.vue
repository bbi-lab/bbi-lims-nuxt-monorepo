<script setup lang="ts">
import type { JsonLogicAll, JsonLogicFilter, RulesLogic } from 'json-logic-js'
import _ from 'lodash'

const props = defineProps({
  // Field identification for SmartForms integration
  name: { type: String, required: true },

  // Parent AutoCompleter configuration props
  parentSearchBaseUrl: { type: String, required: true },
  parentValueField: { type: String, default: 'id' },
  parentDisplayFields: { type: Array, default: ['name'] },
  parentDisplayOptions: { type: Object },
  parentSearchWithClause: { type: Object },
  parentIftaLabel: { type: String },

  // Child AutoCompleter configuration props
  searchBaseUrl: { type: String, required: true },
  valueField: { type: String, default: 'id' },
  displayFields: { type: Array, default: ['name'] },
  displayFormat: { type: Function },
  searchWithClause: { type: Object },
  searchWhereClause: { type: Object },
  parentKeyField: { type: String, required: true },

  // UI configuration props
  hideClearButton: { type: Boolean },
  inputId: { type: String },
  placeholderValue: { type: String },
  inputClass: { type: String },
  disabled: { type: Boolean, default: false },
})

// Integrate with PrimeVue Forms by injecting the parent Form instance
const $pcForm = inject('$pcForm') as any
const formField = ref<Record<string, any>>({})

// Local state for the NestedSelect component
const parentValue = ref()
const currentValue = ref()
const parentSuggestions = ref<{code: string | number, label: string, record: any }[]>([])
const suggestions = ref<{code: string | number, label: string, record: any }[]>([])
const isUserTyping = ref(false) // Track if user is actively typing
const searchWhereClauseFinal = ref()
const componentKey = ref(0) // Key for force re-rendering components

// Register this field with the form
watch(
  () => props.name,
  (name) => {
    if ($pcForm && name) {
      formField.value = $pcForm.register(name, {
        name,
      }) || {}
    }
  },
  { immediate: true },
)

// Debounce form state changes to avoid clearing during rapid typing
const debouncedFormStateSync = _.debounce(async (newValue) => {
  if (isUserTyping.value) {
    return
  }

  if (newValue && newValue !== getCurrentValueCode()) {
    await setValueFromFormState(newValue)
  } else if ((newValue === null || newValue === undefined || newValue === '') && currentValue.value !== null) {
    clearValue()
  }
}, 50)

// Sync from form state (handles form reset and external value changes)
watch(
  () => $pcForm?.getFieldState?.(props.name)?.value,
  debouncedFormStateSync,
)

// Watch parent value changes and update child filter
watch(parentValue, (newValue, oldValue) => {
  if (!_.isEqual(newValue, oldValue)) {
    // If parent was cleared, reset the child filter
    if (!newValue) {
      searchWhereClauseFinal.value = null
      return
    }

    let filter: RulesLogic
    if (props.parentKeyField.includes('.*.')) {
        // Handle nested parentKeyField (e.g. "userGroupMemberships.*.userGroup.id")
        // TODO: handle multiple levels of nesting if needed
        const [parentArrayField, ...nestedFields] = props.parentKeyField.split('.*.')
        const nestedFieldPath = nestedFields.join('.')
        filter = {"some": [
          {"var": parentArrayField as string},
          {"==": [{"var": nestedFieldPath}, newValue.code]}
        ]}
        console.log('Constructed filter for nested parentKeyField:', filter)
    } else {
        // Simple parentKeyField
        filter = {"==": [{"var": props.parentKeyField}, newValue.code]}
    }
    searchWhereClauseFinal.value = props.searchWhereClause ? {and: [
        filter,
        props.searchWhereClause
    ]} : filter

    // Clear child value when parent changes
    if (currentValue.value) {
        clearValue()
    }
  }
})

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

      // Set parent value based on the record
      const parentVal = _.get(newValue, props.parentKeyField)
      if (parentVal) {
        const parentRecord = await RecordService.getRecord(props.parentSearchBaseUrl, String(parentVal), props.parentSearchWithClause)
        parentValue.value = {
          code: parentVal,
          label: getParentDisplayValue(parentRecord),
          record: parentRecord
        }
      }
    } else if (_.isString(newValue) || _.isNumber(newValue)) {
      // If it's just an ID, fetch the full record
      const record = await RecordService.getRecord(props.searchBaseUrl, String(newValue), props.searchWithClause)
      currentValue.value = {
        code: newValue,
        label: getDisplayValue(record),
        record: record
      }

      // Set parent value based on the fetched record
      const parentVal = _.get(record, props.parentKeyField)
      if (parentVal) {
        const parentRecord = await RecordService.getRecord(props.parentSearchBaseUrl, String(parentVal), props.parentSearchWithClause)
        parentValue.value = {
          code: parentVal,
          label: getParentDisplayValue(parentRecord),
          record: parentRecord
        }
      }
    }
  } catch (error) {
    console.error('Error setting value from form state:', error)
    clearValue()
  }
}

// Display value formatting for child
function getDisplayValue(record: any) {
  if (_.isFunction(props.displayFormat)) {
    return props.displayFormat(record)
  } else {
    const result = []
    for (const field of props.displayFields as string[]) {
      result.push(_.get(record, field))
    }
    return _.join(_.compact(result), ': ')
  }
}

// Display value formatting for parent
function getParentDisplayValue(record: any) {
  const result = []
  for (const field of props.parentDisplayFields as string[]) {
    result.push(_.get(record, field))
  }
  return _.join(_.compact(result), ': ')
}

// Parent autocomplete search function
async function parentAutocompleteSearch(event: any) {
  isUserTyping.value = true

  const whereClause = props.parentDisplayFields.length > 1 ?
    {"or": _.map(props.parentDisplayFields, (x) => { return {"startsWith": [{"var": x}, event.query] } })} :
    {"startsWith": [{"var": props.parentDisplayFields[0]}, event.query] }

  try {
    const filtered = await RecordService.getRecords(props.parentSearchBaseUrl, props.parentSearchWithClause, whereClause)
    parentSuggestions.value = _.map(filtered, (x) => {
      return {
        code: x[props.parentValueField],
        label: getParentDisplayValue(x),
        record: x
      }
    })
  } catch (error) {
    console.error('Error in parent autocomplete search:', error)
    parentSuggestions.value = []
  }
}

// Child autocomplete search function
async function autocompleteSearch(event: any) {
  isUserTyping.value = true

  const whereClause = props.displayFields.length > 1 ?
    {"or": _.map(props.displayFields, (x) => { return {"startsWith": [{"var": x}, event.query] } })} :
    {"startsWith": [{"var": props.displayFields[0]}, event.query] }

  let finalWhereClause = whereClause
  if (searchWhereClauseFinal.value) {
    finalWhereClause = {"and": [whereClause, searchWhereClauseFinal.value]}
  }

  try {
    const filtered = await RecordService.getRecords(props.searchBaseUrl, props.searchWithClause, finalWhereClause)
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
  isUserTyping.value = false
  currentValue.value = null
  notifyFormOfChange(null)
}

// Clear all values including parent
function clearAllValues() {
  // Clear child first, then parent
  currentValue.value = null
  parentValue.value = null
  parentSuggestions.value = []
  suggestions.value = []
  searchWhereClauseFinal.value = null

  // Force re-render of AutoComplete components
  componentKey.value += 1

  // Notify form
  formField.value.onChange?.({ value: null })
}

// Handle parent selection
function setParentValue() {
  isUserTyping.value = false
  // Parent selection clears child value automatically via watcher
}

// Handle child selection
function setModelValue() {
  isUserTyping.value = false

  if (_.has(currentValue.value, 'code')) {
    const selectedValue = _.get(currentValue.value, 'code')
    const selectedRecord = _.get(currentValue.value, 'record')

    // Notify form with the selected value
    notifyFormOfChange(selectedValue)
  } else {
    clearValue()
  }
}

// Handle blur events
async function lostFocus() {
  isUserTyping.value = false
  formField.value.onBlur?.()
}

async function parentLostFocus() {
  isUserTyping.value = false
}

// Handle user input events
function handleInput() {
  isUserTyping.value = true
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

// Initialize component on mount
onMounted(async () => {
  const currentFormValue = $pcForm?.getFieldState?.(props.name)?.value
  if (currentFormValue) {
    await setValueFromFormState(currentFormValue)
  }
})

// Expose methods for external access
defineExpose({
  clearValue,
  clearAllValues,
  parentValue,
})
</script>

<template>
    <div class="outline outline-gray-200 pt-5 pb-5 pl-2 w-96">
        <div class="mb-5">
            <component :is="_.isEmpty(parentIftaLabel) ? 'span' : 'IftaLabel'">
                <AutoComplete
                    :key="`parent-${componentKey}`"
                    v-model="parentValue"
                    :suggestions="parentSuggestions"
                    optionLabel="label"
                    @complete="parentAutocompleteSearch"
                    @option-select="setParentValue"
                    @blur="parentLostFocus"
                    @input="handleInput"
                    :dropdown="true"
                    :disabled="disabled"
                />
                <label v-if="!_.isEmpty(parentIftaLabel)">{{ parentIftaLabel }}</label>
            </component>
        </div>
        <div>
            <AutoComplete
                :key="`child-${componentKey}`"
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
                :dropdown="true"
                :disabled="_.isEmpty(parentValue) || disabled"
                :placeholder="placeholderValue"
            />
            <Button
                v-if="!_.isEmpty(parentValue) && !hideClearButton && !disabled"
                class="ml-2"
                icon="pi pi-times"
                severity="secondary"
                outlined
                @click="clearAllValues"
            />
        </div>
    </div>
</template>
