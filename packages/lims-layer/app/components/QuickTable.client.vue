<script setup lang="ts">
import _ from 'lodash'
import { FilterMatchMode } from '@primevue/core/api'
import { RecordService } from '../utils/record'
import Papa from 'papaparse'
import { utils as XlsxUtils, writeFileXLSX } from 'xlsx'
import {v4 as uuidv4} from 'uuid'

const config = useRuntimeConfig()
const { loggedIn } = useUserSession()
const { showLoginModal, isLoginModalVisible } = useLayout()

const apiBaseUrl = computed(() => `${config.public.apiBase}/${props.tableName}`)
const schemasUrl = computed(() => `${config.public.apiBase}/schemas/${props.tableName}`)
const exportFilename = computed(() => `${props.tableName}_${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)}`)

const route = useRoute()
const router = useRouter()
const localStorageKey = `settings::${route.path}`
const dtKey = ref(uuidv4())
const dtId = useId()
const invalidRecordMessages = ref()

const clearRouteQueryParams = async () => {
    await router.push({ path: route.path })
    loadTableData()
}

const refreshFormattedValues = (ids?: string[]) => {
    const formattedColumnDefs = _.pickBy(props.columnDefs, (x) => _.isFunction(x.format))

    // set displayValue for columns with formatting functions
    for (const [k, v] of _.entries(formattedColumnDefs)) {
        const rows = ids ? _.filter(records.value, (x: any) => ids.includes(x.id)) : records.value
        for (const r of rows) {
            // setting displayValue to preserve original while also replacing primative-type values with objects to include originalValue
            _.isObject(r[k]) ? _.set(r, [k, 'displayValue'], v.format(r)) : _.set(r, k, {originalValue: r[k], displayValue: v.format(r)})
        }
    }
}
const loadTableData = async () => {
    console.log('Loading table data for', props.tableName)
    tableSchema.value = props.schemaName ? await RecordService.getSchema(schemasUrl.value, props.schemaName) : null
    records.value = await RecordService.getRecords(apiBaseUrl.value, props.withClause, props.where, props.expandEnums)

    refreshFormattedValues()

    if (props.sortBy) records.value = _.sortBy(records.value, props.sortBy)

    // calculate column definitions from JSON Schema properties and merge with columnDefs from props
    const tableColumnDefinitions =  _.mapValues(
        tableSchema.value?.properties, (v, k) => {
            // anyOf typically indicates a nullable field, but we're only concerned with the non-nullable one
            if (v.anyOf) {
                v = _.find(v.anyOf, (x) => x.type != 'null')
            }
            return {
                header: formatFieldLabel(k),
                format: v.format || 'string',
                type: v.type,
            }
        }
    )
    // merge column definitions inferred from schema with those passed via props
    columnDefinitions.value = _.merge(tableColumnDefinitions, props.columnDefs)

    visibleColumnsOptions.value = _.compact(_.map(columnDefinitions.value, (v, k) => { if (k != 'id' && v.display !== false) return {name: k, code: k}}))

    clientSettings.value = JSON.parse(localStorage.getItem(localStorageKey) || "{}")

    visibleColumns.value = _.get(clientSettings.value, 'columnVisibility', visibleColumnsOptions.value)
    loading.value = false
}

watch(isLoginModalVisible, (newValue, oldValue) => {
    if (oldValue == true && newValue == false) {
        loadTableData()
    }
})


onMounted(async() => {
    if (!loggedIn.value) {
        console.log('User not logged in, showing login modal')
        showLoginModal()
    } else {
        await loadTableData()
    }
})

const toast = useToast()
const props = defineProps({
  tableName: String,
  schemaName: String,
  title: String,
  columnDefs: {type: Object}, // if set, only included columns will be shown
  withClause: {type: Object},
  sortBy: {type: Array as PropType<Array<string>>},
  where: {type: Object},
  canAdd: {type: Boolean, default: true},
  canEdit: {type: Boolean, default: true},
  canEditMultiple: {type: Boolean, default: false},
  canDelete: {type: Boolean, default: true},
  canExport: {type: Boolean, default: true},
  hideSettings: {type: Boolean, default: false},
  rowsPerPageOptions: {type: Array as PropType<Array<number>> },
  selectionMode: {type: String, default: 'multiple'},
  rowActions: {type: Object},
  showColumnFilters: {type: Boolean, default: false},
  selectionDisabled: {type: Boolean, default: false},
  expandEnums: {type: Boolean, default: false},
  emptyMessage: {type: String, default: 'No data'},
  invalidRecords: {type: Object},
})

watch(() => props.invalidRecords, (newValue) => {
    if (newValue) {
        invalidRecordMessages.value = newValue
    }
}, { immediate: true })

watch(() => props.where, (newValue, oldValue) => {
    if (!_.isEqual(newValue, oldValue)) {
        loadTableData()
    }
})
const frozenRecordIds = defineModel<string[]>('frozenRecordIds')

const emit = defineEmits([
    'clicked-record-edit',
    'clicked-multiple-record-edit',
    'clicked-record-add',
    'did-delete-multiple-records',
])

const sortedColumnDefs = computed(() => {
    const savedColumnOrder = _.get(clientSettings.value, 'columnOrder')

    const columnDefsWithPaths = _.map(columnDefinitions.value, (v,k) => {
        const {path, ...rest} = v
        return {key: k, path: path ?? k, ...rest}}
    )
    return _.orderBy(
        columnDefsWithPaths,
        [
        i => _.has(i, 'index') || _.has(savedColumnOrder, i['path']),
        i => _.get(savedColumnOrder, i['path']) || i.index || ''
        ],
        ['desc', 'asc'])
    }
)

interface VisibleColumn {name: string, code: string}
const visibleColumnsOptions: Ref<VisibleColumn[]> = ref([])
const visibleColumns = ref()

interface ColumnDefinition {
    header?: string,
    index?: number,
    format?: string | ((data: any) => string | string[]),
    path?: string,
    type?: string,
    display?: boolean,
    sortable?: boolean,
    element?: string | ((data: any) => string),
    elementSearchText?: (data: any) => string,
    elementClick?: (event: any) => void,
    searchable?: boolean,
    exportable?: boolean,
    exportValue?: (record: any) => string,
    bodyClass?: string,
}
interface SortedColumnDefinition extends ColumnDefinition {
    key: string
}
export interface ColumnDefinitions {[key: string]: ColumnDefinition}
type GlobalFilterField = string | ((data: any) => string)

const paginator = computed(() => !_.isEmpty(props.rowsPerPageOptions))
const rowsPerPage: ComputedRef<number> = computed(() => _.get(props.rowsPerPageOptions, 0) as number)
const records: Ref<any[]> = ref([])
const selectedRecords: Ref<any[]> = ref([])
const tableSchema = ref()
const columnDefinitions: Ref<ColumnDefinitions> = ref({})
const dt = ref()
const clientSettings = ref()
const displayDeleteConfirmation = ref(false)
const loading = ref(true)
const showSettings = ref(false)
const filteringInProgress = ref(false)
const globalFilterFields: Ref<GlobalFilterField[]> = ref([])
const globalSearchTerm = ref(null)
const selectionCount = computed(() => props.selectionMode == 'multiple' ? `${selectedRecords.value?.length || 0} of ${records.value?.length || 0} selected` : `${records.value?.length || 0} records`)
const columnFilterInputs = ref({})
const lastColumnFilterInputKey = ref<string | null>(null)

const filters = ref({global: { value: null, matchMode: FilterMatchMode.CONTAINS } })
// TODO: add support for posititing buttons in any column. For now, 0 or negative index action buttons will be combined into the first column,
// any positive or non-indexed action buttons will be combined into the last column
const rowActionsStart = computed(() => props.rowActions ? _.pickBy(props.rowActions, (value, key) => _.isNumber(value.index) && value.index < 1) : {})
const rowActionsEnd = computed(() => props.rowActions ? _.pickBy(props.rowActions, (value, key) => !_.has(value, 'index') || value.index > 1) : {})

const displayColumnFilters = ref(false)
function toggleColumnFilters() {
    displayColumnFilters.value = !displayColumnFilters.value
}

const frozenRecords = computed(() => {
    if (frozenRecordIds.value) {
        return _.filter(records.value, (x) => (frozenRecordIds.value ?? []).includes(x.id))
    } else {
        return []
    }
})

const nonFrozenRecords = computed(() => {
    if (frozenRecordIds.value) {
        return _.filter(records.value, (x) => !(frozenRecordIds.value ?? []).includes(x.id))
    } else {
        return records.value
    }
})

watch(frozenRecords, (newValue) => {
    nextTick(() => {
        const frozenTbody = document.querySelector(`#${dtId} .p-datatable-scrollable-table > .p-datatable-frozen-tbody`) as HTMLElement
        const datatableContainer = document.querySelector(`#${dtId} .p-datatable-table-container`) as HTMLElement
        const datatableColHeaderRow = document.querySelector(`#${dtId} .p-datatable-scrollable-table > thead.p-datatable-thead`) as HTMLElement

        const frozenTbodyHeight = frozenTbody.getBoundingClientRect().height || 0
        const datatableContainerHeight = datatableContainer.getBoundingClientRect().height || 0

        // if frozen rows take up more than half of the scrollable area, add sticky positioning to keep non-frozen rows scrollable
        if (frozenTbodyHeight && frozenTbodyHeight && frozenTbodyHeight > datatableContainerHeight/2) {
            frozenTbody.setAttribute('style', 'position: sticky; z-index: 10;')
            datatableColHeaderRow.setAttribute('style', 'position: sticky; z-index: 20;')
        }
    })
})

watch(sortedColumnDefs, (newValue, oldValue) => {
  if (newValue != oldValue) {
    globalFilterFields.value = _.map(newValue, (x) => {
        if (_.isFunction(x.format)) {
            return x.format
        } else if (x.element && _.isFunction(x.elementSearchText)) {
            return x.elementSearchText
        } else {
            return x.path ?? x.key
        }
  })

    if (props.showColumnFilters) {
        const filtersEntries = newValue.reduce((acc, colDef) => {
            const key = colDef.path || colDef.key
            if (colDef.searchable !== false) {
                _.set(acc,[key],{ value: null, matchMode: FilterMatchMode.CONTAINS })
            }
            return acc
        }, {})
        filters.value = _.merge({global: { value: null, matchMode: FilterMatchMode.CONTAINS } }, filtersEntries)
    }
  }
})

function formatDate(value: string) {
    const isoDate = value ? new Date(value) : null
    return isoDate?.toLocaleDateString('fr-CA') || ''
}
function didClickEditRecord(event: MouseEvent) {
    emit('clicked-record-edit', event)
}
function didClickEditMultipleRecords(event: MouseEvent) {
    emit('clicked-multiple-record-edit', selectedRecords.value)
}
function didClickDeleteSelectedRecords(event: MouseEvent) {
    RecordService.deleteRecords(apiBaseUrl.value, selectedRecords.value).then((result) => {
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Records deleted', life: 3000 })
        const deletedRecordIds = _.map(result, (x) => x.id)
        records.value = _.reject(records.value, (x) => deletedRecordIds.includes(x.id))
        selectedRecords.value = _.reject(selectedRecords.value, (x) => deletedRecordIds.includes(x.id))
        if (!_.isEmpty(result)) {
            emit('did-delete-multiple-records', result)
        }
    }).catch(error => {
        toast.add({ severity: 'error', summary: 'Error', detail: error.data?.statusMessage, life: 3000 })
    })
    displayDeleteConfirmation.value = false
}
function didClickAddRecord(event: MouseEvent) {
    emit('clicked-record-add', event)
}
function getExportRecords() {
    const recordsToExport = _.isEmpty(selectedRecords.value) ? records.value : selectedRecords.value
    const exportRecords = []
    for (const record of recordsToExport) {
        const exportRecord = {}
        for (const columnDef of _.filter(sortedColumnDefs.value, (x) => x.exportable !== false)) {
            if (_.map(visibleColumns.value, (x) => x.code).includes(columnDef.key)) {
                if (columnDef.exportValue) {
                    _.set(exportRecord, [columnHeader(columnDef)], columnDef.exportValue(record))
                } else if (_.isFunction(columnDef.format)) {
                    _.set(exportRecord, [columnHeader(columnDef)], columnDef.format(record))
                } else if (columnDef.format == 'date-time') {
                    _.set(exportRecord, [columnHeader(columnDef)], formatDate(_.get(record, columnDef.path ?? columnDef.key)))
                } else if (columnDef.type == 'array') {
                    const joined = _.join(_.get(record, columnDef.path ?? columnDef.key), ', ')
                    _.set(exportRecord, [columnHeader(columnDef)], joined)
                } else {
                    _.set(exportRecord, [columnHeader(columnDef)], _.get(record, columnDef.path ?? columnDef.key))
                }
            }
        }
        exportRecords.push(exportRecord)
    }
    return exportRecords
}

function exportCSV() {
    // dt.value.exportCSV()  // default export for PrimeVue DataTable

    const csv = Papa.unparse(getExportRecords())
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${exportFilename.value}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const exportXLSX = function() {
    const exportRecords = getExportRecords()
    const rows = []

    // column headers row
    if (!_.isEmpty(exportRecords)) {
        rows.push(_.keys(exportRecords[0]))
    } else {
        rows.push(_.map(_.filter(sortedColumnDefs.value, (x) => x.exportable !== false), (x) => columnHeader(x)))
    }

    // data rows
    for (const record of exportRecords) {
        rows.push(_.values(record))
    }

    const wb = XlsxUtils.book_new()
    const ws = XlsxUtils.aoa_to_sheet(rows)

    XlsxUtils.book_append_sheet(wb, ws, 'Sheet1')
    writeFileXLSX(wb, `${exportFilename.value}.xlsx`)
}

// const addOrRefreshRecordId = async (recordId: string) => {
//     const currentRecord = await RecordService.getRecord(apiBaseUrl.value, recordId, props.withClause, props.expandEnums)
//     const existingRecordIndex = _.findIndex(records.value, {id: recordId})
//     if (existingRecordIndex!=-1) {
//         records.value[existingRecordIndex] = currentRecord
//     } else if (currentRecord){
//         records.value = _.concat(records.value, currentRecord)
//     }
//     refreshFormattedValues([recordId])
// }

const addOrRefreshRecordIds = async (recordIds: string[]) => {
    const currentRecords = await RecordService.getRecordsByIds(apiBaseUrl.value, recordIds, props.withClause, props.expandEnums)

    const newRecordIds: string[] = []
    for (const recordId of recordIds) {
        const existingRecordIndex = _.findIndex(records.value, {id: recordId})
        if (existingRecordIndex!=-1) {
            records.value[existingRecordIndex] = _.find(currentRecords, {id: recordId})
        } else {
            newRecordIds.push(recordId)
        }
    }
    if (!_.isEmpty(newRecordIds)) {
        records.value = _.concat(records.value, _.filter(currentRecords, (x) => newRecordIds.includes(x.id)))
    }
    refreshFormattedValues(recordIds)
}

const removeRecordId = (recordId: string) => {
    records.value = _.reject(records.value, {id: recordId})
}

function confirmDeleteSelected() {
    displayDeleteConfirmation.value = true
}

function columnHeader(sortedColumnDef: SortedColumnDefinition) {
    return _.get(sortedColumnDef, 'header', _.startCase(sortedColumnDef.key))
}

const exportOptions = ref([
    {
        label: 'XLSX',
        icon: 'pi pi-file-excel',
        command: () => exportXLSX()
    },
    {
        label: 'CSV',
        icon: 'pi pi-file',
        command: () => exportCSV()
    }
])
defineExpose({ addOrRefreshRecordIds, removeRecordId, selectedRecords, records })

function setGlobalSearchTerm() {
    _.set(filters.value, ['global', 'value'], globalSearchTerm.value)
}

function debounceSearch(f: Function, columnDefKey?: string) {
    filteringInProgress.value = true
    lastColumnFilterInputKey.value = columnDefKey || null
    return _.debounce(() => {
        f()
}, 1000)}

function clearSettings() {
    // set column visibility to defaults
    visibleColumns.value = visibleColumnsOptions.value

     // clear saved values
    clientSettings.value = {}
    localStorage.removeItem(localStorageKey)

    // force datatable to refresh
    dtKey.value = uuidv4()
}

function updateColOrder() {
    const newColumnOrder = _.mapValues(_.keyBy(_.map(dt.value.columns, (v, i) => {return {index: i, value: v.props.field || v.props.columnKey}}), 'value'), 'index')
    _.set(clientSettings.value, 'columnOrder', newColumnOrder)
}

function saveSettings() {
    if (visibleColumns.value == visibleColumnsOptions.value) {
        clientSettings.value = {}
        localStorage.removeItem(localStorageKey)
    } else {
        _.set(clientSettings.value, 'columnVisibility', visibleColumns.value)
        localStorage.setItem(localStorageKey, JSON.stringify(clientSettings.value))
    }
    showSettings.value = false
}

function filterByColumnVisibility(columns: SortedColumnDefinition[]): SortedColumnDefinition[] {
    const visibleColumnKeys = _.map(visibleColumns.value, (x) => x.code)
    return _.filter(columns, (x) => x.key == 'id' || _.includes(visibleColumnKeys, x.key))
}
function filteringComplete() {
    filteringInProgress.value = false

    // if filtering by column, focus the last input
    if (lastColumnFilterInputKey.value) {
        const input = _.get(columnFilterInputs.value, lastColumnFilterInputKey.value)
        if (input) input.$el.focus()
    }
}
</script>

<template>
    <DataTable
        :id="dtId"
        :key="dtKey"
        v-model:selection="selectedRecords"
        :value="nonFrozenRecords"
        :frozenValue="frozenRecords"
        dataKey="id"
        :nullSortOrder="-1"
        scrollable
        scrollHeight="flex"
        v-model:filters="filters"
        :selectionMode="selectionMode"
        :metaKeySelection="true"
        :paginator="paginator"
        :reorderableColumns="true"
        @column-reorder="updateColOrder"
        :rows="rowsPerPage"
        :rowsPerPageOptions="props.rowsPerPageOptions"
        :loading="loading"
        :filter-display="displayColumnFilters ? 'row' : undefined"
        :globalFilterFields="globalFilterFields"
        @update:filters="filteringInProgress = true"
        @filter="filteringComplete"
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between">
                <span v-if="props.title && !$slots.title">
                    <span class="text-2xl font-bold m-0">{{ !_.isEmpty(props.where) ? `${props.title} (filtered)` : props.title }}</span>
                    <Button v-if="!_.isEmpty(props.where) && !_.isEmpty(route.query)"
                        text
                        icon="pi pi-filter-slash"
                        severity="info"
                        @click="clearRouteQueryParams"
                        v-tooltip="{value: 'Clear filters'}" />
                </span>
                <span v-if="$slots.title">
                    <slot name="title" />
                </span>
                <Toolbar class="border-0">
                    <template #start>
                        <span class="mr-5">{{ selectionCount }}</span>
                        <Button v-if="props.canAdd" label="Add" icon="pi pi-plus" severity="secondary" class="mr-2" @click="didClickAddRecord" :disabled="!_.isEmpty(selectedRecords)"/>
                        <Button v-if="props.canEditMultiple" label="Edit" icon="pi pi-pencil" severity="secondary" class="mr-2" @click="didClickEditMultipleRecords" :disabled="_.isEmpty(selectedRecords)" />
                        <Button v-if="props.canDelete" label="Delete" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="_.isEmpty(selectedRecords)" />
                    </template>
                    <template #end>
                        <SplitButton v-if="props.canExport" label="Export" class="mr-2" :model="exportOptions" severity="secondary" @click="exportXLSX"></SplitButton>
                        <template v-if="!props.hideSettings">
                            <Button icon="pi pi-cog" :disabled="showSettings" class="mr-2" :severity="_.isEmpty(clientSettings) ? 'secondary' : 'info'" variant="text" @click="showSettings=!showSettings"/>
                            <IftaLabel :class="`mr-2 ${showSettings ? 'visible' : 'invisible'}`">
                                <MultiSelect inputId="visibileColumnsInput" v-model="visibleColumns" :options="visibleColumnsOptions" optionLabel="name" :maxSelectedLabels="0" placeholder="select" />
                                <label for="visibileColumnsInput" v-if="showSettings">Columns</label>
                            </IftaLabel>
                            <Button icon="pi pi-undo" :class="`mr-2 ${showSettings ? 'visible' : 'invisible'}`" severity="secondary" v-tooltip="{value: 'Clear settings'}" @click="clearSettings"/>
                            <Button icon="pi pi-check" :class="`mr-2 ${showSettings ? 'visible' : 'invisible'}`" style="color: green" severity="secondary" v-tooltip="{value: 'Save settings'}" @click="saveSettings" />
                        </template>
                        <ProgressSpinner :class="`size-8 ${filteringInProgress ? 'visible' : 'invisible'}`" />
                    </template>
                </Toolbar>
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="globalSearchTerm" placeholder="Search..." @input="debounceSearch(setGlobalSearchTerm)()"/>
                </IconField>
                <slot name="header-buttons" />
            </div>
        </template>
        <template #empty> {{ props.emptyMessage }} </template>
        <template #loading> Loading </template>

        <Column columnKey="selectBox" :reorderableColumn="false" :class="`w-0 !pl-6 ${selectionDisabled ? 'p-disabled' : ''}`" v-if="selectionMode=='multiple'" :selectionMode="selectionMode" :exportable="false" frozen />
        <Column v-if="!_.isEmpty(invalidRecordMessages)" columnKey="invalidRecordIndicator" :reorderableColumn="true" class="w-0 !pl-6" :exportable="false" frozen>
            <template #body="slotProps">
                <span v-if="invalidRecordMessages[slotProps.data.id]" class="text-red-600">
                    <i class="pi pi-exclamation-circle" v-tooltip="invalidRecordMessages[slotProps.data.id].messages.join(', ')" />
                </span>
            </template>
        </Column>
        <Column columnKey="crudButtons" :reorderableColumn="false" :class="`whitespace-nowrap !pr-0 w-0 ${selectionMode=='multiple' ? '!pl-0' : ''}`" v-if="props.canEdit || props.showColumnFilters" :exportable="false" :showFilterMenu="false" frozen>
            <template v-if="props.showColumnFilters" #header>
                <Button :icon="displayColumnFilters ? 'pi pi-search-minus' : 'pi pi-search-plus'" text rounded severity="info" @click="toggleColumnFilters"/>
            </template>
            <template #body="slotProps">
                <div class="group">
                    <Button v-if="props.canEdit" icon="pi pi-pencil" text rounded @click="didClickEditRecord(slotProps.data)" :disabled="!_.isEmpty(selectedRecords)" />
                    <Button
                        :class="v.class"
                        :key="`${slotProps.data.id}-${k}`"
                        :icon="v.icon" text rounded
                        v-for="(v, k) in rowActionsStart"
                        :severity="v.severity || 'info'"
                        :disabled="_.isFunction(v.disabled) ? v.disabled(slotProps.data) : false"
                        @click="v.action(slotProps.data)" />
                </div>
            </template>
        </Column>
        <template v-for="columnDef of filterByColumnVisibility(sortedColumnDefs)">
            <template v-if="columnDef.display!==false">
                <Column v-if="columnDef.format=='date-time'" :field="columnDef.path" :header="columnHeader(columnDef)" :reorderableColumn="showSettings" :bodyClass="columnDef.bodyClass || '!w-max !max-w-max !min-w-max'" :showFilterMenu="false" :showClearButton="false" :sortable="_.get(columnDef, 'sortable', true)">
                    <template v-if="columnDef.path && _.has(filters, columnDef.path)" #filter="{ filterModel, filterCallback }">
                        <InputText class="w-full m-0 p-1" v-model="filterModel.value" type="text" @input="debounceSearch(filterCallback, columnDef.key)()" :ref="el => _.set(columnFilterInputs, columnDef.key, el)" />
                    </template>
                    <template #body="slotProps">
                        {{ formatDate(slotProps.data[columnDef.key]) }}
                    </template>
                </Column>
                <Column v-else-if="columnDef.type=='boolean' || _.includes(columnDef.type, 'boolean')" :field="columnDef.path" :header="columnHeader(columnDef)" :reorderableColumn="showSettings" :bodyClass="columnDef.bodyClass || '!w-max !max-w-max !min-w-max'" :showFilterMenu="false" :showClearButton="false" :sortable="_.get(columnDef, 'sortable', true)">
                    <template v-if="columnDef.path && _.has(filters, columnDef.path)" #filter="{ filterModel, filterCallback }">
                        <InputText class="w-full m-0 p-1" v-model="filterModel.value" type="text" @input="debounceSearch(filterCallback, columnDef.key)()" :ref="el => _.set(columnFilterInputs, columnDef.key, el)" />
                    </template>
                    <template #body="slotProps">
                        {{ slotProps.data[columnDef.key] ? '✓' : '' }}
                    </template>
                </Column>
                <Column v-else-if="columnDef.format=='hyperlink'" :field="columnDef.path" :header="columnHeader(columnDef)" :reorderableColumn="showSettings" :bodyClass="columnDef.bodyClass || '!w-max !max-w-max !min-w-max'" :showFilterMenu="false" :showClearButton="false" :sortable="_.get(columnDef, 'sortable', true)">
                    <template v-if="columnDef.path && _.has(filters, columnDef.path)" #filter="{ filterModel, filterCallback }">
                        <InputText class="w-full m-0 p-1" v-model="filterModel.value" type="text" @input="debounceSearch(filterCallback, columnDef.key)()" :ref="el => _.set(columnFilterInputs, columnDef.key, el)" />
                    </template>
                    <template #body="slotProps">
                        <a class="text-blue-600 underline visited:text-purple-600 hover:text-blue-800"
                            :href="slotProps.data[columnDef.key]"
                            target="_blank">
                            {{ slotProps.data[columnDef.key] }}
                        </a>
                    </template>
                </Column>
                <Column v-else-if="columnDef.type=='element'" :field="columnDef.path" :header="columnHeader(columnDef)" :reorderableColumn="showSettings" :bodyClass="columnDef.bodyClass" :showFilterMenu="false" :showClearButton="false" :sortable="_.get(columnDef, 'sortable', true)">
                    <template v-if="columnDef.path && _.has(filters, columnDef.path)" #filter="{ filterModel, filterCallback }">
                        <InputText class="w-full m-0 p-1" v-model="filterModel.value" type="text" @input="debounceSearch(filterCallback, columnDef.key)()" :ref="el => _.set(columnFilterInputs, columnDef.key, el)" />
                    </template>
                    <template #body="slotProps">
                        <span v-if="_.isFunction(columnDef.element)" v-html="columnDef.element(slotProps.data)" v-on:click="columnDef.elementClick ? columnDef.elementClick(slotProps.data) : null"></span>
                        <span v-else-if="_.isString(columnDef.element)" v-html="columnDef.element" v-on:click="columnDef.elementClick ? columnDef.elementClick(slotProps.data) : null"></span>
                        <span v-else>err</span>
                    </template>
                </Column>
                <Column v-else-if="columnDef.key!='id'" :field="columnDef.path" :header="columnHeader(columnDef)" :reorderableColumn="showSettings" :bodyClass="columnDef.bodyClass || '!w-max !max-w-max !min-w-max'" :showFilterMenu="false" :showClearButton="false" :sortable="_.get(columnDef, 'sortable', true)">
                    <template v-if="columnDef.path && _.has(filters, columnDef.path)" #filter="{ filterModel, filterCallback }">
                        <InputText class="w-full m-0 p-1" v-model="filterModel.value" type="text" @input="debounceSearch(filterCallback, columnDef.key)()" :ref="el => _.set(columnFilterInputs, columnDef.key, el)" />
                    </template>
                    <template v-if="columnDef.path" #body="slotProps">
                        {{ columnDef.type == 'array' ? _.join(_.get(slotProps.data, columnDef.path), ', ') : _.get(slotProps.data, columnDef.path) }}
                    </template>
                </Column>
            </template>
        </template>
        <Column class="whitespace-nowrap" v-if="rowActionsEnd" columnKey="rowActions" :reorderableColumn="false" frozen alignFrozen="right">
            <template #body="{ data }">
                <div class="flex items-start">
                    <template v-for="(v, k) in rowActionsEnd">
                        <Button
                            v-if="!v.iconComponent"
                            v-tooltip.top="v.tooltip"
                            :class="`mr-1 mb-1 ${_.isFunction(v.visible) && !v.visible(data) ? 'invisible' : ''}`"
                            :icon="v.icon"
                            :iconPos="v.iconPos"
                            :severity="v.severity || 'info'"
                            :label="_.isFunction(v.label) ? v.label(data) : (_.has(v, 'label') ? v.label : _.startCase(_.toString(k)))"
                            :disabled="_.isFunction(v.disabled) ? v.disabled(data) : false"
                            @click="v.action(data)" />
                        <Button
                            v-if="v.iconComponent"
                            v-tooltip.top="v.tooltip"
                            :class="`mr-1 mb-1 ${_.isFunction(v.visible) && !v.visible(data) ? 'invisible' : ''}`"
                            :severity="v.severity || 'info'"
                            :label="_.isFunction(v.label) ? v.label(data) : (_.has(v, 'label') ? v.label : _.startCase(_.toString(k)))"
                            :disabled="_.isFunction(v.disabled) ? v.disabled(data) : false"
                            @click="v.action(data)"
                        >
                            <template #icon>
                                <span :class="`pi pi-fw p-button-icon ${v.iconPos=='right' ? 'p-button-icon-right' : ''} inline-block`">
                                    <component :is="v.iconComponent" />
                                </span>
                            </template>
                        </Button>
                    </template>
                </div>
            </template>
        </Column>
    </DataTable>
    <Dialog header="Confirmation" v-model:visible="displayDeleteConfirmation" :style="{ width: '350px' }" :modal="true">
        <div class="flex items-center justify-center">
            <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
            <span>Are you sure you want to proceed?</span>
        </div>
        <template #footer>
            <Button label="No" icon="pi pi-times" @click="displayDeleteConfirmation=!displayDeleteConfirmation" text severity="secondary" />
            <Button label="Yes" icon="pi pi-check" @click="didClickDeleteSelectedRecords" severity="danger" outlined autofocus />
        </template>
    </Dialog>
</template>

<style>
.p-datatable-header-cell {
    border-bottom-width: 0px;
}
.p-datatable-thead > tr:last-child {
    border-bottom-width: 1px;
}
.p-datatable-frozen-tbody > tr {
    box-shadow: inset 0 0 1px black;
    background-color: var(--p-content-border-color);
    color: var(--p-text-color);
}
.p-datatable-scrollable td.p-datatable-frozen-column {
    background-color: inherit;
}
.p-datatable-table tr {
    box-shadow: 0 0 1px var(--p-text-color);
}
</style>
