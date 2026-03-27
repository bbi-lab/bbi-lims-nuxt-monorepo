<script setup lang="ts">
import _ from 'lodash'
import { useActiveElement } from '@vueuse/core'
import moment from 'moment'
import type { FieldDefinitions} from './QuickForm.vue'
import { Icon } from '#components'

const GrommetIconsRevert = h(Icon, { name: 'grommet-icons:revert', class: 'm-1' })

const config = useRuntimeConfig()
const confirmPopup = useConfirm()
const toast = useToast()
const activeElement = useActiveElement()
const { showLoginModal, isLoginModalVisible } = useLayout()
const { loggedIn, fetch } = useUserSession()

const apiBaseUrl = computed(() => `${config.public.apiBase}/${props.tableName}`)
const schemasUrl = computed(() => `${config.public.apiBase}/schemas/${props.tableName}`)

const formSchemPropertiesComputed = computed(() => _.mapValues(formSchema.value?.properties || {}, (x) => x.anyOf ? _.find(x.anyOf, (x) => x.type != 'null') : x))

const props = defineProps({
  recordIds: {type: Array as PropType<Array<string>>, required: true},
  tableName: {type: String, required: true},
  schemaName: {type: String, required: true},
  readOnly: {type: Boolean, default: false},
  withClause: {type: Object},
  fieldDefs: {type: Object as PropType<FieldDefinitions>},   // to override widgets/labels for individual fields
  readonlyValues: {type: Object},                           // to hide fields on form
})
const emit = defineEmits([
    'records-update',
    'cancel'
])
const dataChanged = ref(false)
const formSchema = ref<FormSchema>()
const formElement = ref<HTMLElement | null>(null)
const records = ref<Array<Record<string, any>>>([])
const combinedRecord = ref<Record<string, {val: any, conflictingValueCount?: number, valClearedByUser?: boolean }>>({})
const previousCombinedRecord = ref<Record<string, {val: any, conflictingValueCount?: number, valClearedByUser?: boolean }>>({})
const relatedRecords = ref<Record<string, any>>({})
const inputRefs = ref({})

const clearValue = (key: string) => {
    _.set(combinedRecord.value, [key, 'val'], null)
    _.set(combinedRecord.value, [key, 'valClearedByUser'], true)
}

const revertToConflictingValue = (key: string) => {
    _.set(combinedRecord.value, [key, 'val'], null)
    _.unset(combinedRecord.value, [key, 'valClearedByUser'])
}
const revertNestedSelectToConflictingValue = (key: string) => {
    const nestedSelectRef = inputRefs.value[key]
    nestedSelectRef.parentValue = null
    revertToConflictingValue(key)
}

const inputClasses = computed(() => {
    return _.mapValues(combinedRecord.value, (value, key) => {
        const activeElementInputId = activeElement.value?.getAttribute('id')
        return key != activeElementInputId
            && _.has(combinedRecord.value, [key, 'conflictingValueCount'])
            && _.isNull(value.val)
            && !_.get(combinedRecord.value, [key, 'valClearedByUser'], false)
            ? 'bg-surface-200 dark:bg-gray-800' : ''
    })
})

const placeholders = computed(() => {
    return _.mapValues(combinedRecord.value, (value, key) => {
        const activeElementInputId = activeElement.value?.getAttribute('id')
        return key != activeElementInputId
            && _.has(combinedRecord.value, [key, 'conflictingValueCount'])
            && !_.get(combinedRecord.value, [key, 'valClearedByUser'], false)
            ? `${_.get(combinedRecord.value, [key, 'conflictingValueCount'])} values` : ''
    })
})

const showRevertButton = (key: string) => {
    return _.has(combinedRecord.value, [key, 'conflictingValueCount']) && (!_.isNull(combinedRecord.value[key].val) || _.get(combinedRecord.value, [key, 'valClearedByUser']))
}

const changedToNullCheck = (key: string) => {
    if (_.isNull(combinedRecord.value[key].val)) {
        _.set(combinedRecord.value, [key, 'valClearedByUser'], true)
        dataChanged.value = true
    } else {
        _.unset(combinedRecord.value, [key, 'valClearedByUser'])
    }
}

onMounted(async () => {
    await fetch()
    if (!loggedIn.value) {
        showLoginModal()
    } else {
        await refreshForm()
    }
})

const refreshForm = async function() {
    formSchema.value = await RecordService.getSchema(schemasUrl.value, props.schemaName)
    records.value = await RecordService.getRecordsByIds(apiBaseUrl.value, props.recordIds, props.withClause)

    if (formSchema.value?.properties) {
        // convert date strings to Date objects
        _.forEach(formSchema.value.properties, (value, key) => {
            _.forEach(records.value, (record) => {
                if (record[key] && _.includes(['date', 'date-time'], getFieldType(value, key, props.fieldDefs))) {
                    try {
                        record[key] = moment(record[key]).toDate()
                    } catch (e) {
                        console.error(`Error converting field ${key} to date:`, e)
                    }
                }
            })
        })
    }

    console.log(records)
    combinedRecord.value = _.reduce(records.value, (acc: any, record) => {
        _.forEach(record, (value, key) => {
            if (key == 'id') return  // ignore ids
            if (acc[key] === undefined) {
                _.set(acc, [key, 'val'], value)
            } else if (!_.isEqual(value, _.get(acc, [key, 'val']))) {
                _.set(acc, [key, 'val'], null)
                _.set(acc, [key, 'conflictingValueCount'], _.get(acc, [key, 'conflictingValueCount'], 1) + 1)
            } else {
                _.set(acc, [key, 'val'], value)
            }
        })
        return acc
    }, {})

    nextTick(() => dataChanged.value = false)
}

watch(() => combinedRecord.value, (newValue, oldValue) => {
    const actualOldValue = _.isEqual(newValue, oldValue) ? previousCombinedRecord.value : oldValue
    previousCombinedRecord.value = JSON.parse(JSON.stringify(newValue))

    if (!_.isEqual(newValue, actualOldValue)) {
        dataChanged.value = true
    }
}, { deep: true })

watch(isLoginModalVisible, (newValue, oldValue) => {
    if (oldValue == true && newValue == false && _.isEmpty(combinedRecord.value)) {
        refreshForm()
    }
})

async function saveRecords() {
    if (props.readOnly) return

    const valuesToUpdate = _.mapValues(_.pickBy(combinedRecord.value, (value, key) => {
        return !_.isNull(value.val) || _.get(value, 'valClearedByUser') || !_.has(value, 'conflictingValueCount')
    }), (value, key) => {
        return value.val
    })
    RecordService.updateRecords(apiBaseUrl.value, props.recordIds, valuesToUpdate).then((result: any) => {
        toast.add({ severity: 'success', summary: 'Successful', detail: `${result.length} records updated`, life: 3000 });
        emit('records-update', result)
    }).catch(error => {
        if (formElement.value && _.isArray(error.data?.data)) {
            addErrorsToForm(formElement.value, error.data.data)
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: error.data?.statusMessage, life: 3000 })
        }
    })
}

function cancelEdit(event: MouseEvent) {
    if (dataChanged.value) {
        confirmPopup.require({
            target: event.target as HTMLElement,
            message: 'Unsaved changes',
            icon: 'pi pi-exclamation-triangle',
            rejectProps: {
                label: 'Go back',
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Discard changes',
                severity: 'warn'
            },
            accept: () => { emit('cancel') },
            reject: () => { }
        })
    } else {
        emit('cancel')
    }
}
function isReadOnly(key: string) {
    return props.readOnly ? true : _.has(props.readonlyValues, key) || _.get(props.fieldDefs, [key, 'readOnly'], false)
}
function getLabel(key: string) {
    const label = _.get(props.fieldDefs, [key, 'label'])
    const combinedRecordForLabel = _.mapValues(combinedRecord.value, (value, key) => {
        return _.get(value, 'val')
    })
    if (_.isFunction(label)) {
        return label(combinedRecordForLabel, _.cloneDeep(relatedRecords.value))
    } else if (label) {
        return label
    } else {
        return _.get(props.fieldDefs, [`${key}.*`, 'label'], formatFieldLabel(key))
    }
}
function isArrayInputDisabled(key: string, arrayIndex: number) {
    // disable input if canUpdate is false and any of the records being edited has any id values for the given key
    const hasIds = _.some(records.value, (record) => _.get(record, [key, arrayIndex, 'id']) !== null)
    return isReadOnly(key) || isReadOnly(`${key}.*`) || (!_.get(props.fieldDefs, [`${key}.*`, 'canUpdate']) && hasIds)
}

function hasFixedSize(key: string) {
    const fixedSize = _.get(props.fieldDefs, [key, 'fixedSize'], false)
    if (_.isFunction(fixedSize)) {
        return fixedSize(_.cloneDeep(combinedRecord.value))
    } else {
        return fixedSize
    }
}
</script>
<template>
    <div class="m-2 w-full flex justify-center">
        <Button class="ml-1" v-tooltip="{value: `${dataChanged ? 'Cancel' : 'Close'}`}" severity="info" :icon="`pi ${dataChanged ? 'pi-undo' : 'pi-times'}`" size="small" @click="cancelEdit" />
        <Button v-if="!readOnly" class="ml-1" v-tooltip="{value: 'Save'}" icon="pi pi-save" size="small" :disabled="!dataChanged" @click="saveRecords" />
    </div>
    <div ref="formElement" class="pl-8 pb-24 h-full overflow-y-scroll">
        <slot name="form-element-header" />
        <div v-for="(val, key) in formSchemPropertiesComputed" :key="key" class="mt-5">
            <div class="mb-5" v-if="combinedRecord && key in combinedRecord && _.get(fieldDefs, [key, 'display'])!==false">
                <label v-if="!(getFieldType(val, key, fieldDefs)=='array' && val?.items)" :for="key" class="block font-bold mb-3">{{ getLabel(key) }}</label>
                <template v-if="_.get(fieldDefs, [key, 'component'])=='AutoCompleter'">
                    <div class="flex items-start">
                        <AutoCompleter
                            :input-id="key"
                            :inputClass="inputClasses[key]"
                            v-model="combinedRecord[key].val"
                            v-model:obj="relatedRecords[key]"
                            v-bind="_.omit(_.get(fieldDefs, [key, 'props']), ['defaultValue'])"
                            :placeholderValue="placeholders[key]"
                            :disabled="isReadOnly(key)"
                            @clearedValue="changedToNullCheck(key)"
                            v-on="_.mapValues(_.pickBy(_.get(fieldDefs, [key, 'events'], {}), _.isFunction), (f) => f(combinedRecord[key].val))"
                        />
                        <Button v-if="showRevertButton(key)" v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}" outlined severity="info" class="ml-2" @click="revertToConflictingValue(key)">
                            <template #icon>
                                <GrommetIconsRevert />
                            </template>
                        </Button>
                    </div>
                </template>
                <template v-else-if="_.get(fieldDefs, [key, 'component'])=='NestedSelect'">
                    <div class="flex items-start">
                        <NestedSelect
                            :key="key"
                            :input-id="key"
                            :inputClass="inputClasses[key]"
                            :ref="(el) => _.set(inputRefs, key, el)"
                            v-model="combinedRecord[key].val"
                            v-bind="_.omit(_.get(fieldDefs, [key, 'props']), ['defaultValue'])"
                            :placeholderValue="_.has(combinedRecord, [key, 'conflictingValueCount']) && !_.get(combinedRecord, [key, 'valClearedByUser'], false) ? `${_.get(combinedRecord, [key, 'conflictingValueCount'])} values` : ''"
                            :disabled="isReadOnly(key)"
                            @clearedValue="changedToNullCheck(key)"
                            v-on="_.mapValues(_.pickBy(_.get(fieldDefs, [key, 'events'], {}), _.isFunction), (f) => f(combinedRecord[key].val))"
                        />
                        <Button v-if="showRevertButton(key)" v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}" outlined severity="info" class="ml-2" @click="revertNestedSelectToConflictingValue(key)">
                            <template #icon>
                                <GrommetIconsRevert />
                            </template>
                        </Button>
                    </div>
                </template>
                <template v-else-if="_.get(fieldDefs, [key, 'component'])=='Select'">
                    <Select
                        :id="key"
                        :class="inputClasses[key]"
                        v-model="combinedRecord[key].val"
                        v-bind="_.omit(_.get(fieldDefs, [key, 'props']), ['defaultValue'])"
                        :placeholder="_.has(combinedRecord, [key, 'conflictingValueCount']) ? `${_.get(combinedRecord, [key, 'conflictingValueCount'])} values` : ''"
                        :disabled="isReadOnly(key)"
                        v-on="_.mapValues(_.pickBy(_.get(fieldDefs, [key, 'events'], {}), _.isFunction), (f) => f(combinedRecord[key].val))"
                    />
                </template>
                <template v-else-if="_.get(fieldDefs, [key, 'component'])=='InputNumber'">
                    <div class="flex items-start quickform-input-wrapper">
                        <InputText
                            v-if="_.has(combinedRecord, [key, 'conflictingValueCount']) && !_.get(combinedRecord, [key, 'valClearedByUser'])"
                            :id="key"
                            v-model="combinedRecord[key].val"
                            :class="inputClasses[key]"
                            :disabled="isReadOnly(key)"
                            :placeholder="placeholders[key]"
                            v-on="_.mapValues(_.pickBy(_.get(fieldDefs, [key, 'events'], {}), _.isFunction), (f) => f(combinedRecord[key].val))"
                        />
                        <InputNumber
                            v-else
                            :id="key"
                            :inputId="key"
                            :inputClass="inputClasses[key]"
                            v-model="combinedRecord[key].val"
                            v-bind="_.omit(_.get(fieldDefs, [key, 'props']), ['defaultValue'])"
                            showButtons :disabled="isReadOnly(key)"
                            :placeholder="placeholders[key]"
                            :minFractionDigits="_.get(fieldDefs, [key, 'minFractionDigits'], 0)"
                            :maxFractionDigits="_.get(fieldDefs, [key, 'maxFractionDigits'], 20)"
                            :min="_.get(fieldDefs, [key, 'min'])"
                            :max="_.get(fieldDefs, [key, 'max'])"
                            v-on="_.mapValues(_.pickBy(_.get(fieldDefs, [key, 'events'], {}), _.isFunction), (f) => f(combinedRecord[key].val))"
                        />
                        <Button icon="pi pi-times" class="ml-2" severity="secondary" outlined @click="clearValue(key)" />
                        <Button v-if="showRevertButton(key)" v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}" outlined severity="info" class="ml-2" @click="revertToConflictingValue(key)">
                            <template #icon>
                                <GrommetIconsRevert />
                            </template>
                        </Button>
                    </div>
                </template>
                <template v-else-if="getFieldType(val, key, fieldDefs)=='date'">
                    <div class="flex items-start quickform-input-wrapper">
                        <DatePicker
                            :id="key"
                            class="w-80"
                            :inputClass="inputClasses[key]"
                            v-model.trim="combinedRecord[key].val"
                            showIcon
                            dateFormat="yy-mm-dd"
                            autofocus
                            :placeholder="placeholders[key]"
                            :disabled="isReadOnly(key)"
                            v-on="_.mapValues(_.pickBy(_.get(fieldDefs, [key, 'events'], {}), _.isFunction), (f) => f(combinedRecord[key].val))"
                        />
                        <Button icon="pi pi-times" class="ml-2" severity="secondary" outlined @click="clearValue(key)" />
                        <Button v-if="showRevertButton(key)" v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}" outlined severity="info" class="ml-2" @click="revertToConflictingValue(key)">
                            <template #icon>
                                <GrommetIconsRevert />
                            </template>
                        </Button>
                    </div>
                </template>
                <template v-else-if="getFieldType(val, key, fieldDefs)=='date-time'">
                    <div class="flex items-start quickform-input-wrapper">
                        <DatePicker
                            :id="key"
                            class="w-80"
                            :inputClass="inputClasses[key]"
                            v-model.trim="combinedRecord[key].val"
                            showTime
                            showIcon
                            dateFormat="yy-mm-dd"
                            hourFormat="24"
                            autofocus
                            :disabled="isReadOnly(key)"
                            :placeholder="placeholders[key]"
                            v-on="_.mapValues(_.pickBy(_.get(fieldDefs, [key, 'events'], {}), _.isFunction), (f) => f(combinedRecord[key].val))"
                        />
                        <Button icon="pi pi-times" class="ml-2" severity="secondary" outlined @click="clearValue(key)" />
                        <Button v-if="showRevertButton(key)" v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}" outlined severity="info" class="ml-2" @click="revertToConflictingValue(key)">
                            <template #icon>
                                <GrommetIconsRevert />
                            </template>
                        </Button>
                    </div>
                </template>
                <template v-else-if="val?.enum">
                    <Select
                        :id="key"
                        :class="inputClasses[key]"
                        v-model="combinedRecord[key].val"
                        :options="val.enum"
                        :placeholder="_.has(combinedRecord, [key, 'conflictingValueCount']) ? `${_.get(combinedRecord, [key, 'conflictingValueCount'])} values` : ''"
                        :disabled="isReadOnly(key)"
                    />
                </template>
                <template v-else-if="val?.oneOf">
                    <div class="flex items-start quickform-input-wrapper">
                        <Select
                            :id="key"
                            class="w-80"
                            :inputClass="inputClasses[key]"
                            v-model="combinedRecord[key].val"
                            :options="val.oneOf" optionLabel="title"
                            optionValue="const"
                            :placeholder="placeholders[key]"
                            :disabled="isReadOnly(key)"
                        />
                        <Button icon="pi pi-times" class="ml-2" severity="secondary" outlined @click="clearValue(key)" />
                        <Button v-if="showRevertButton(key)" v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}" outlined severity="info" class="ml-2" @click="revertToConflictingValue(key)">
                            <template #icon>
                                <GrommetIconsRevert />
                            </template>
                        </Button>
                    </div>
                </template>
                <template v-else-if="getFieldType(val, key, fieldDefs)=='boolean'">
                    <Checkbox
                        :id="key"
                        :pt="_.has(combinedRecord, [key, 'conflictingValueCount']) && combinedRecord[key].val == null ? { box: { class: 'bg-surface-200 dark:bg-gray-800' } } : {}"
                        v-model="combinedRecord[key].val"
                        :binary="true"
                        :disabled="isReadOnly(key)"
                        v-on="_.mapValues(_.pickBy(_.get(fieldDefs, [key, 'events'], {}), _.isFunction), (f) => f(combinedRecord[key].val))"
                    />
                    <Button v-if="_.has(combinedRecord, [key, 'conflictingValueCount']) && combinedRecord[key].val != null" v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}" outlined severity="info" class="ml-2" @click="revertToConflictingValue(key)">
                        <template #icon>
                            <GrommetIconsRevert />
                        </template>
                    </Button>
                    <span v-if="_.has(combinedRecord, [key, 'conflictingValueCount']) && combinedRecord[key].val == null" class="pl-3">{{`${_.get(combinedRecord, [key, 'conflictingValueCount'])} values`}}</span>
                </template>
                <template v-else-if="getFieldType(val, key, fieldDefs)=='integer'">
                    <div class="flex items-start quickform-input-wrapper">
                        <InputNumber
                            :id="key"
                            :inputId="key"
                            :inputClass="inputClasses[key]"
                            v-model="combinedRecord[key].val"
                            showButtons
                            :placeholder="placeholders[key]"
                            :disabled="isReadOnly(key)"
                            :minFractionDigits="0"
                            :maxFractionDigits="0"
                            :min="_.get(fieldDefs, [key, 'min'])"
                            :max="_.get(fieldDefs, [key, 'max'])"
                        v-on="_.mapValues(_.pickBy(_.get(fieldDefs, [key, 'events'], {}), _.isFunction), (f) => f(combinedRecord[key].val))"
                        />
                        <Button icon="pi pi-times" class="ml-2" severity="secondary" outlined @click="clearValue(key)" />
                        <Button v-if="showRevertButton(key)" v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}" outlined severity="info" class="ml-2" @click="revertToConflictingValue(key)">
                            <template #icon>
                                <GrommetIconsRevert />
                            </template>
                        </Button>
                    </div>
                </template>
                <template v-else-if="getFieldType(val, key, fieldDefs)=='number'">
                    <div class="flex items-start quickform-input-wrapper">
                        <InputNumber
                            :id="key"
                            :inputId="key"
                            :inputClass="inputClasses[key]"
                            v-model="combinedRecord[key].val"
                            showButtons :disabled="isReadOnly(key)"
                            :placeholder="placeholders[key]"
                            :minFractionDigits="_.get(fieldDefs, [key, 'minFractionDigits'], 0)"
                            :maxFractionDigits="_.get(fieldDefs, [key, 'maxFractionDigits'], 20)"
                        v-on="_.mapValues(_.pickBy(_.get(fieldDefs, [key, 'events'], {}), _.isFunction), (f) => f(combinedRecord[key].val))"
                        />
                        <Button icon="pi pi-times" class="ml-2" severity="secondary" outlined @click="clearValue(key)" />
                        <Button v-if="showRevertButton(key)" v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}" outlined severity="info" class="ml-2" @click="revertToConflictingValue(key)">
                            <template #icon>
                                <GrommetIconsRevert />
                            </template>
                        </Button>
                    </div>
                </template>
                <template v-else-if="getFieldType(val, key, fieldDefs)=='array' && val?.items">
                    <div :id="key">
                        <div class="flex items-start quickform-input-wrapper">
                            <label class="font-bold mb-3 mr-5">{{ getLabel(key) }}</label>
                            <Button v-if="!hasFixedSize(key) && !isReadOnly(key) && !isReadOnly(`${key}.*`) && ((_.has(combinedRecord, [key, 'conflictingValueCount']) && combinedRecord[key].val!=null) || !_.has(combinedRecord, [key, 'conflictingValueCount']))" v-tooltip="{value: 'Add value', showDelay: 1000}" icon="pi pi-plus" class="ml-2" severity="primary" outlined @click="addNewItemToArray(combinedRecord, [key, 'val'], val.items)" />
                            <Button v-if="!isReadOnly(key) && !isReadOnly(`${key}.*`) &&_.has(combinedRecord, [key, 'conflictingValueCount']) && combinedRecord[key].val!=null" v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}" outlined severity="info" class="ml-2" @click="combinedRecord[key].val=null">
                                <template #icon>
                                    <GrommetIconsRevert />
                                </template>
                            </Button>
                            </div>
                        <div class="group">
                            <span v-if="_.has(combinedRecord, [key, 'conflictingValueCount']) && combinedRecord[key].val == null" class="pl-3">{{`${_.get(combinedRecord, [key, 'conflictingValueCount'])} sets of values`}}</span>
                            <span v-else-if="_.isEmpty(combinedRecord[key].val)" class="pl-3">No values</span>

                            <Button v-if="!isReadOnly(key) && !isReadOnly(`${key}.*`) &&_.has(combinedRecord, [key, 'conflictingValueCount']) && combinedRecord[key].val==null" v-tooltip="{value: 'Overwrite values', showDelay: 1000}" icon="pi pi-pencil" class="ml-2" severity="primary" outlined @click="addNewItemToArray(combinedRecord, [key, 'val'], val.items)" />
                        </div>

                        <!-- Iterate over array items -->
                        <div class="mt-2" v-for="(arrayItem, arrayIndex) in combinedRecord[key].val" :key="arrayIndex">
                            <div  class="mb-5" v-if="_.get(fieldDefs, [`${key}.*`, 'component'])=='InputArray'">
                                <InputArray
                                    v-model="combinedRecord[key].val[arrayIndex]"
                                    v-bind=" _.get(fieldDefs, [`${key}.*`, 'props'])"
                                    :disabled="isArrayInputDisabled(key, arrayIndex)"
                                    :canDelete="_.get(fieldDefs, [`${key}.*`, 'canDelete']) || _.isEmpty(_.get(combinedRecord[key].val[arrayIndex], _.get(fieldDefs, [`${key}.*`, 'props', 'variableField'])))"
                                    @did-click-delete="combinedRecord[key].val.splice(arrayIndex, 1)"
                                />
                            </div>
                            <!-- Check that all array item properties are covered by JSON schema -->
                            <div class="mb-5" v-else-if="val.items.properties && arrayItem && _.isEqual(Object.keys(arrayItem).sort(), Object.keys(val.items.properties).sort())">
                                <template v-for="itemKey in Object.keys(arrayItem)" :key="itemKey">
                                    <span class="mr-5" v-if="_.get(val.items.properties, [itemKey, 'oneOf'])">
                                        <Select :id="`${itemKey}_${arrayIndex}`" v-model="combinedRecord[key].val[arrayIndex][itemKey]" :disabled="isArrayInputDisabled(key, arrayIndex)" :options="_.get(val.items.properties, [itemKey, 'oneOf'])" optionLabel="title" optionValue="const" />
                                    </span>
                                    <!-- don't display UUID fields, values should not change -->
                                    <span class="mr-5" v-else-if="_.get(val.items.properties, [itemKey, 'format']) != 'uuid'">
                                        <InputText :id="`${itemKey}_${arrayIndex}`" v-model="combinedRecord[key].val[arrayIndex][itemKey]" :disabled="isArrayInputDisabled(key, arrayIndex)" />
                                    </span>
                                </template>
                                <Button v-if="!hasFixedSize(key) && !isArrayInputDisabled(key, arrayIndex)" class="ml-2" icon="pi pi-times" severity="secondary" outlined @click="combinedRecord[key].val.splice(arrayIndex, 1)" />
                            </div>
                            <div class="mt-2" v-else-if="val.items.type=='string'">
                                <div class="flex items-start quickform-input-wrapper">
                                    <InputText :id="`${key}_${arrayIndex}`" class="w-80" v-model="combinedRecord[key].val[arrayIndex]"  :disabled="isArrayInputDisabled(key, arrayIndex)" />
                                    <Button v-if="!hasFixedSize(key) && !isArrayInputDisabled(key, arrayIndex)" class="ml-2" icon="pi pi-times" severity="secondary" outlined @click="combinedRecord[key].val.splice(arrayIndex, 1)" />
                                </div>
                            </div>
                            <div class="mt-2" v-else-if="val.items.type=='integer'">
                                <div class="flex items-start quickform-input-wrapper">
                                    <InputNumber :id="`${key}_${arrayIndex}`" class="w-80" v-model="combinedRecord[key].val[arrayIndex]"  :disabled="isArrayInputDisabled(key, arrayIndex)" :showButtons="!isArrayInputDisabled(key, arrayIndex)" :minFractionDigits="0" :maxFractionDigits="0" />
                                    <Button v-if="!hasFixedSize(key) && !isArrayInputDisabled(key, arrayIndex)" class="ml-2" icon="pi pi-times" severity="secondary" outlined @click="combinedRecord[key].val.splice(arrayIndex, 1)" />
                                </div>
                            </div>
                            <!-- Array properties not covered by JSON schema -->
                            <template v-else=>
                                <InputText class="w-80" disabled v-model="combinedRecord[key].val[arrayIndex]" />
                            </template>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <!-- <InputText v-if="_.has(combinedRecord[key].val, '__conflictingValues')" :id="key" @focusin="handleFocusIn" @focusout="handleFocusOut" :placeholder="`${combinedRecord[key].val['__conflictingValues']} values`" class="w-80" :disabled="isReadOnly(key)" /> -->
                    <div class="flex items-start quickform-input-wrapper">
                        <InputText
                            :id="key"
                            v-model="combinedRecord[key].val"
                            :class="`w-80 ${inputClasses[key]}`"
                            :disabled="isReadOnly(key)"
                            :placeholder="placeholders[key]"
                            v-bind="_.omit(_.get(fieldDefs, [key, 'props']), ['defaultValue'])"
                            v-on="_.mapValues(_.pickBy(_.get(fieldDefs, [key, 'events'], {}), _.isFunction), (f) => f(combinedRecord[key].val))"
                        />
                        <a v-if="getFieldType(val, key, fieldDefs)=='hyperlink' && (!_.has(combinedRecord, [key, 'conflictingValueCount']) && isValidUrl(combinedRecord[key].val))"
                            :href="combinedRecord[key].val"
                            target="_blank">
                            <Button class="ml-2" icon="pi pi-external-link" variant="text" severity="info" />
                        </a>
                        <Button icon="pi pi-times" class="ml-2" severity="secondary" outlined @click="clearValue(key)" />
                        <Button v-if="showRevertButton(key)" v-tooltip="{value: 'Revert to multiple values', showDelay: 1000}" outlined severity="info" class="ml-2" @click="revertToConflictingValue(key)">
                            <template #icon>
                                <GrommetIconsRevert />
                            </template>
                        </Button>
                    </div>
                </template>
                <div v-if="_.has(fieldDefs, [key, 'subtext'])" class="italic mt-3mb-3">{{ getSubtext(key) }}</div>
            </div>
        </div>
    </div>
    <ConfirmPopup></ConfirmPopup>
</template>
