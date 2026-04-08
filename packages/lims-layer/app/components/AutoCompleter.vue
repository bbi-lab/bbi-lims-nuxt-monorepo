<script setup lang="ts">
import _ from 'lodash'

const props = defineProps({
  searchBaseUrl: {type: String, required: true},
  searchFields: {type: Array, default: ['name']},
  valueField: {type: String, default: 'id'},
  displayFields: {type: Array, default: ['name']},
  displayFormat: {type: Function},  // callback function to return formatted string
  searchWithClause: {type: Object},
  searchWhereClause: {type: Object},
  dropdown: {type: Boolean},
  disabled: {type: Boolean},
  hideClearButton: {type: Boolean},
  iftaLabel: {type: String},
  inputId: {type: String},
  placeholderValue: {type: String},
  inputClass: {type: String},
  searchMode: {type: String as PropType<'JsonLogic' | 'simple'>, default: 'JsonLogic'},
})

const modelValue = defineModel()
const modelValueObj = defineModel('obj')
const currentValue = ref()
const suggestions = ref<{code: string | number, label: string, record: any }[]>([])

const emit = defineEmits([
    'update:modelValue',
    'clearedValue',
    'changedValue',
])

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

watch(modelValue, async (newValue, oldValue) => {
    if (newValue && !_.isEqual(newValue, oldValue)) {
        if (_.isObject(newValue)) {
            modelValueObj.value = newValue
        } else if (_.isEmpty(newValue)) {
            modelValueObj.value = null
        }

        modelValue.value = _.isString(newValue) ?  newValue : _.get(newValue, props.valueField)

        if (_.isString(modelValue.value)) {
            const record = await RecordService.getRecord(props.searchBaseUrl, modelValue.value, props.searchWithClause)
            currentValue.value = {code: modelValue.value, label: getDisplayValue(record) }
        }
    } else if (_.isEmpty(newValue)) {
        clearValue()
    }},
    { immediate: true },
)

async function autocompleteSearch(event: any) {
    let whereClause
    if (props.searchMode == 'simple') {
        whereClause = {searchTerm: event.query}
    } else {
        whereClause = props.searchFields.length > 1 ?
            {"or": _.map(props.searchFields, (x) => { return {"startsWith": [{"var": x}, event.query] } })} :
            {"startsWith": [{"var": props.searchFields[0]}, event.query] }

        if (props.searchWhereClause) {
            whereClause = {"and": [whereClause, props.searchWhereClause]}
        }
    }

    const filtered = await RecordService.getRecords(props.searchBaseUrl, props.searchWithClause, whereClause)

    suggestions.value = _.map(filtered, (x) => { return {code: x[props.valueField], label: getDisplayValue(x), record: x }})
}

function clearValue() {
    currentValue.value = null
    modelValue.value = null
    modelValueObj.value = null
}
function clickedClearValue() {
    clearValue()
    emit('clearedValue')
}
function setModelValue() {
    if (_.has(currentValue.value, 'code')) {
        modelValue.value = _.get(currentValue.value, 'code')
        modelValueObj.value = _.get(currentValue.value, 'record')
    } else {
        clearValue()
    }
    emit('changedValue')
}
async function lostFocus() {
    if (!_.has(currentValue.value, 'code')) {
        clearValue()
    }
}
defineExpose({
    clearValue,
})

</script>
<template>
    <component :is="_.isEmpty(iftaLabel) ? 'span' : 'IftaLabel'">
        <AutoComplete
            v-model="currentValue"
            :inputClass="inputClass"
            :id="inputId"
            :suggestions="suggestions"
            optionLabel="label"
            @complete="autocompleteSearch"
            @option-select="setModelValue"
            @blur="lostFocus"
            :placeholder="placeholderValue"
            :dropdown="dropdown"
            :disabled="disabled" />
        <label v-if="!_.isEmpty(iftaLabel)" :for="inputId">{{ iftaLabel }}</label>
    </component>

    <Button v-if="!disabled && !hideClearButton" class="ml-2" icon="pi pi-times" severity="secondary" outlined @click="clickedClearValue" />
</template>
