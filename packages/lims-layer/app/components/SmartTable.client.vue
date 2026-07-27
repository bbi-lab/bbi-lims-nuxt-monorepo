<script setup lang="ts">
import _ from 'lodash'
import { FilterMatchMode } from '@primevue/core/api'
import Papa from 'papaparse'
import { utils as XlsxUtils, writeFileXLSX } from 'xlsx'
import { v4 as uuidv4 } from 'uuid'
import type { z } from 'zod'

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps({
    tableName: String,
    zodSchema: {
        type: Object as () => z.ZodObject<Record<string, z.ZodTypeAny>>,
        required: false,
    },
    title: String,
    columnDefs: { type: Object as () => ColumnDefinitions },
    withClause: { type: Object },
    sortBy: { type: Array as PropType<Array<string>> },
    where: { type: Object },
    canAdd: { type: Boolean, default: true },
    canEdit: { type: Boolean, default: true },
    canEditMultiple: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: true },
    canExport: { type: Boolean, default: true },
    hideSettings: { type: Boolean, default: false },
    rowsPerPageOptions: { type: Array as PropType<Array<number>> },
    selectionMode: { type: String, default: 'multiple' },
    rowActions: { type: Object },
    showColumnFilters: { type: Boolean, default: false },
    selectionDisabled: { type: Boolean, default: false },
    emptyMessage: { type: String, default: 'No data' },
    /** Opt into server-side pagination/sorting/filtering. When true, only one page of
     *  rows is fetched at a time (via where/order/limit/offset) and the global search
     *  bar + column filters are pushed to the server. Requires the record type's list
     *  endpoint to support the `flat` query param (SQL view path). Default false keeps
     *  the original client-side behavior. */
    lazy: { type: Boolean, default: false },
    invalidRecords: { type: Object },
    /** Override the localStorage key used to persist column settings. Defaults
     *  to the current route path. Set this when multiple SmartTable instances
     *  appear on the same page so they don't share settings. */
    settingsKey: { type: String },
})

// ── Setup ──────────────────────────────────────────────────────────────────
const config = useRuntimeConfig()
const { loggedIn } = useUserSession()
const { showLoginModal, isLoginModalVisible } = useLayout()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const frozenRecordIds = defineModel<string[]>('frozenRecordIds')

const emit = defineEmits([
    'clicked-record-edit',
    'clicked-multiple-record-edit',
    'clicked-record-add',
    'did-delete-multiple-records',
])

const apiBaseUrl = computed(() => `${config.public.apiBase}/${props.tableName}`)
const exportFilename = computed(() => `${props.tableName}_${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)}`)
const localStorageKey = computed(() => `settings::${props.settingsKey ?? route.path}`)

// ── Column definitions (computed — no recompute on every data fetch) ───────

/** Unwrap nullable/optional/readonly Zod wrappers and return the column
 *  meta we care about: the primitive type name and any string format. */
function resolveZodColumnMeta(field: z.ZodTypeAny): { type: string, format: string } {
    let def: any = (field as any).def
    // Unwrap nullable, optional, readonly, default, catch wrappers
    while (def && ['nullable', 'optional', 'readonly', 'default', 'catch'].includes(def.type)) {
        def = def.innerType?.def ?? null
    }
    if (!def) return { type: 'string', format: 'string' }

    const zodType: string = def.type ?? 'string'
    if (zodType === 'boolean') return { type: 'boolean', format: 'string' }
    if (zodType === 'number' || zodType === 'int') return { type: 'number', format: 'string' }
    if (zodType === 'array') return { type: 'array', format: 'string' }
    if (zodType === 'date') return { type: 'date', format: 'date-time' }
    if (zodType === 'string') {
        const isDateTime = def.format === 'date-time'
            || (def.checks as any[] | undefined)?.some((c: any) => c.kind === 'datetime' || c.kind === 'iso_datetime')
        if (isDateTime) return { type: 'string', format: 'date-time' }
    }
    return { type: zodType, format: 'string' }
}

/** Columns derived purely from the Zod schema shape. Recomputes only when
 *  zodSchema prop changes. */
const schemaColumnDefs = computed<ColumnDefinitions>(() => {
    const schema = props.zodSchema
    if (!schema) return {}
    return _.mapValues(schema.shape, (field, k) => {
        const { type, format } = resolveZodColumnMeta(field)
        return {
            header: formatFieldLabel(k),
            format,
            type,
        }
    })
})

/** Final merged column definitions: schema-derived columns overridden by
 *  any explicit columnDefs prop entries. */
const columnDefinitions = computed<ColumnDefinitions>(() =>
    _.merge({}, schemaColumnDefs.value, props.columnDefs)
)

/** All non-id, non-hidden columns available to the visibility picker. */
const visibleColumnsOptions = computed<VisibleColumn[]>(() =>
    _.compact(_.map(columnDefinitions.value, (v, k) => {
        if (k != 'id' && v.display !== false) return { name: k, code: k }
    }))
)

const sortedColumnDefs = computed<SortedColumnDefinition[]>(() => {
    const savedColumnOrder = _.get(clientSettings.value, 'columnOrder')
    const columnDefsWithPaths = _.map(columnDefinitions.value, (v, k) => {
        const { path, ...rest } = v
        return { key: k, path: path ?? k, ...rest }
    })
    return _.orderBy(
        columnDefsWithPaths,
        [
            i => _.has(i, 'index') || _.has(savedColumnOrder, i['path']),
            i => _.get(savedColumnOrder, i['path']) || i.index || '',
        ],
        ['desc', 'asc'])
})

// ── State ──────────────────────────────────────────────────────────────────
const dtKey = ref(uuidv4())
const dtId = useId()
const dt = ref()
const invalidRecordMessages = ref()
const records: Ref<any[] | undefined> = ref([])
const selectedRecords: Ref<any[]> = ref([])
const clientSettings = ref<Record<string, any>>({})
const visibleColumns = ref<VisibleColumn[]>([])
const displayDeleteConfirmation = ref(false)
const loading = ref(false)
const showSettings = ref(false)
const filteringInProgress = ref(false)
const globalFilterFields: Ref<GlobalFilterField[]> = ref([])
const globalSearchTerm = ref(null)
const columnFilterInputs = ref({})
const lastColumnFilterInputKey = ref<string | null>(null)
const displayColumnFilters = ref(false)
const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } })

const filteredRecordCount = ref<number | null>(null)
const displayedCount = computed(() => props.lazy
    ? totalRecords.value
    : (filteredRecordCount.value ?? records.value?.length ?? 0))
const selectionCount = computed(() =>
    props.selectionMode == 'multiple'
        ? `${selectedRecords.value?.length || 0} of ${displayedCount.value} selected`
        : `${displayedCount.value} records`
)
function onFilter(event: any) {
    filteredRecordCount.value = event.filteredValue?.length ?? null
}
watch(records, () => { filteredRecordCount.value = null })
const paginator = computed(() => !_.isEmpty(props.rowsPerPageOptions))
const rowsPerPage: ComputedRef<number> = computed(() => _.get(props.rowsPerPageOptions, 0) as number)
const rowActionsStart = computed(() => props.rowActions ? _.pickBy(props.rowActions, (v) => _.isNumber(v.index) && v.index < 1) : {})
const rowActionsEnd = computed(() => props.rowActions ? _.pickBy(props.rowActions, (v) => !_.has(v, 'index') || v.index > 1) : {})

// ── Data loading ───────────────────────────────────────────────────────────
const refreshFormattedValues = (ids?: string[]) => {
    const formattedColumnDefs = _.pickBy(props.columnDefs, (x) => _.isFunction(x.format))
    for (const [k, v] of _.entries(formattedColumnDefs)) {
        const rows = ids ? _.filter(records.value, (x: any) => ids.includes(x.id)) : records.value
        for (const r of rows || []) {
            _.isObject(r[k]) ? _.set(r, [k, 'displayValue'], (v.format as Function)(r)) : _.set(r, k, { originalValue: r[k], displayValue: (v.format as Function)(r) })
        }
    }
}

const loadTableData = async () => {
    loading.value = true
    try {
        records.value = await RecordService.getRecords(apiBaseUrl.value, props.withClause, props.where)
        refreshFormattedValues()
        if (props.sortBy) records.value = _.sortBy(records.value, props.sortBy)
        clientSettings.value = JSON.parse(localStorage.getItem(localStorageKey.value) || '{}')
        visibleColumns.value = _.get(clientSettings.value, 'columnVisibility', visibleColumnsOptions.value)
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Failed to load data', detail: err?.message ?? String(err), life: 5000 })
    } finally {
        loading.value = false
    }
}

// ── Lazy (server-side) loading ───────────────────────────────────────────────
// Only active when props.lazy is true. Fetches a single page at a time and pushes
// the global search + column filters to the server as a JSON Logic `where`.
const totalRecords = ref(0)
const lazyFirst = ref(0)
const lazyRows = ref(0)
const lazySortField = ref<string | undefined>(undefined)
const lazySortOrder = ref(1)
// Signature of the where clause used for the last count() — lets us skip the (expensive)
// recount on pure page/sort changes and only recount when the filter actually changes.
let lastCountWhere: string | undefined

/** A column can be pushed to the server as a flat filterable/sortable field only when it
 *  isn't a relation path (dot), a format function, or a custom element render — those all
 *  filter/sort on a value the server can't reproduce from a single column. */
function isServerPushable(c: any): boolean {
    const field = c.path ?? c.key
    return !_.isFunction(c.format) && !c.element && !_.includes(field, '.')
}
/** Columns eligible to participate in the global search. */
function isGlobalSearchColumn(c: any): boolean {
    return c.key !== 'id' && c.display !== false && c.searchable !== false
}
/** Flat fields pushed to the server for the global search. */
const serverFilterFields = computed<string[]>(() =>
    _.uniq(_.compact(_.map(sortedColumnDefs.value, (c) =>
        (isGlobalSearchColumn(c) && isServerPushable(c)) ? (c.path ?? c.key) : null)))
)
/** Search-eligible columns that CAN'T be pushed to the server (relation/formatted/element). */
const lazySearchExclusions = computed<any[]>(() =>
    props.lazy ? _.filter(sortedColumnDefs.value, (c) => isGlobalSearchColumn(c) && !isServerPushable(c)) : []
)
/** In lazy mode the global search only covers server-pushable columns, so hide it entirely
 *  when any search column is excluded — a partial search returns confusing results. */
const showGlobalSearch = computed(() => !props.lazy || lazySearchExclusions.value.length === 0)

/** Recursively collects dotted (relation-path) `{"var": "a.b"}` field names from a JSON
 *  Logic tree, e.g. the `props.where` prop. */
function collectDottedVars(logic: any): string[] {
    const found = new Set<string>()
    const walk = (node: any) => {
        if (_.isArray(node)) { _.forEach(node, walk); return }
        if (!_.isPlainObject(node)) return
        if (_.isString((node as any).var) && _.includes((node as any).var, '.')) found.add((node as any).var)
        _.forEach(node, walk)
    }
    walk(logic)
    return [...found]
}
/** In lazy mode, `props.where` is pushed through the flat SQL view path (jsonLogicToSql),
 *  which resolves a var to a single column on the view and can't traverse relations — a
 *  dotted var there fails to translate. This works fine when lazy=false: the relational
 *  query builder (jsonLogicToFilter) natively supports dotted relation paths. */
const lazyWhereRelationPaths = computed<string[]>(() =>
    props.lazy ? collectDottedVars(normalizeWhere(props.where)) : [])

/** props.where may be undefined, a single-element array (queryParamsToJsonLogic), or an object. */
function normalizeWhere(where: any): any {
    if (_.isNil(where)) return undefined
    if (_.isArray(where)) return where.length === 1 ? where[0] : { and: where }
    return where
}

/** Single source of truth mapping a PrimeVue `FilterMatchMode` to the JSON Logic clause the
 *  server understands (see jsonLogicToSql). Used to translate row-mode column filters for
 *  lazy loading; client-side filtering is done by PrimeVue itself. Match modes absent here
 *  (e.g. ENDS_WITH, BETWEEN, DATE_*) have no server mapping yet and are ignored in lazy mode
 *  — add them alongside their server operator when advanced (Tier 2) filtering lands. */
const MATCH_MODE_TO_JSONLOGIC: Record<string, (field: string, value: any) => any> = {
    [FilterMatchMode.CONTAINS]:                 (f, v) => ({ contains: [{ var: f }, String(v)] }),
    [FilterMatchMode.STARTS_WITH]:              (f, v) => ({ startsWith: [{ var: f }, String(v)] }),
    [FilterMatchMode.NOT_CONTAINS]:             (f, v) => ({ '!': { contains: [{ var: f }, String(v)] } }),
    [FilterMatchMode.EQUALS]:                   (f, v) => ({ '==': [{ var: f }, v] }),
    [FilterMatchMode.NOT_EQUALS]:               (f, v) => ({ '!=': [{ var: f }, v] }),
    [FilterMatchMode.LESS_THAN]:                (f, v) => ({ '<': [{ var: f }, v] }),
    [FilterMatchMode.LESS_THAN_OR_EQUAL_TO]:    (f, v) => ({ '<=': [{ var: f }, v] }),
    [FilterMatchMode.GREATER_THAN]:             (f, v) => ({ '>': [{ var: f }, v] }),
    [FilterMatchMode.GREATER_THAN_OR_EQUAL_TO]: (f, v) => ({ '>=': [{ var: f }, v] }),
}

/** Translate one column's row-mode filter model (`{ value, matchMode }`) into a JSON Logic
 *  clause for lazy (server-side) filtering. Returns null when the filter is empty or its
 *  match mode has no server mapping (PrimeVue still applies it client-side). */
function columnFilterToJsonLogic(field: string, model: any): any {
    const value = _.get(model, 'value')
    if (value === null || value === undefined || value === '') return null
    const matchMode = _.get(model, 'matchMode') || FilterMatchMode.CONTAINS
    const build = MATCH_MODE_TO_JSONLOGIC[matchMode]
    if (!build) {
        if (import.meta.dev) console.warn(`[SmartTable] no server-side mapping for filter match mode "${matchMode}" on "${field}"; this column filter is ignored in lazy mode.`)
        return null
    }
    return build(field, value)
}

/** Combine page-level where + global search + column filters into one JSON Logic clause. */
function buildLazyWhere(): any {
    const conditions: any[] = []

    const base = normalizeWhere(props.where)
    if (base) conditions.push(base)

    const term = _.isString(globalSearchTerm.value) ? globalSearchTerm.value.trim() : ''
    if (term) {
        const ors = _.map(serverFilterFields.value, (f) => ({ contains: [{ var: f }, term] }))
        if (ors.length) conditions.push(ors.length === 1 ? ors[0] : { or: ors })
    }

    for (const [key, model] of _.entries(filters.value)) {
        if (key === 'global' || _.includes(key, '.')) continue
        const clause = columnFilterToJsonLogic(key, model)
        if (clause) conditions.push(clause)
    }

    if (conditions.length === 0) return undefined
    return conditions.length === 1 ? conditions[0] : { and: conditions }
}

const loadLazyData = async () => {
    // Prevent the fetch entirely rather than send an unresolvable where: the server would
    // either drop the clause (returning too many rows) or 400 on /count — both confusing.
    // The dev-time console.warn (see watcher below) names the offending field(s).
    if (lazyWhereRelationPaths.value.length) {
        records.value = []
        totalRecords.value = 0
        filteringInProgress.value = false
        toast.add({
            severity: 'error',
            summary: 'Failed to load data',
            detail: `This table's "where" filter uses relation field(s) not supported in lazy mode: ${lazyWhereRelationPaths.value.join(', ')}.`,
            life: 5000,
        })
        return
    }
    loading.value = true
    try {
        const where = buildLazyWhere()
        const order = lazySortField.value
            ? { [lazySortField.value]: lazySortOrder.value === -1 ? 'desc' : 'asc' }
            : (props.sortBy && props.sortBy.length ? { [props.sortBy[0]!]: 'asc' } : undefined)

        const page = await RecordService.getRecordsPage(apiBaseUrl.value, {
            where,
            order,
            limit: lazyRows.value || rowsPerPage.value,
            offset: lazyFirst.value,
            flat: true,
        })
        records.value = page ?? []
        refreshFormattedValues()

        const whereSig = JSON.stringify(where ?? null)
        if (whereSig !== lastCountWhere) {
            totalRecords.value = await RecordService.getCount(apiBaseUrl.value, where)
            lastCountWhere = whereSig
        }
        // NB: client settings are intentionally NOT re-read here. Re-assigning
        // clientSettings recomputes sortedColumnDefs, whose watcher rebuilds `filters`
        // (resetting all column-filter values) — which would wipe the filter the user
        // just typed. Settings are loaded once on mount instead.
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Failed to load data', detail: err?.message ?? String(err), life: 5000 })
    } finally {
        loading.value = false
        // In lazy mode the reload *is* the filtering, so the search/filter spinner
        // (filteringInProgress, set by debounceSearch) is cleared here. The DataTable's
        // @filter event that normally resets it doesn't fire for the global search.
        filteringInProgress.value = false
    }
}
const scheduleLazyLoad = _.debounce(() => { loadLazyData() }, 250)
/** Force a reload that also refreshes the count (used after add/edit/delete mutations). */
function reloadLazyWithCount() {
    lastCountWhere = undefined
    loadLazyData()
}

/** DataTable props applied only in lazy mode — kept out of the client-side path entirely. */
const lazyBindings = computed(() => props.lazy
    ? {
        lazy: true,
        totalRecords: totalRecords.value,
        first: lazyFirst.value,
        sortField: lazySortField.value,
        sortOrder: lazySortOrder.value,
    }
    : {})

function onPage(event: any) {
    if (!props.lazy) return
    lazyFirst.value = event.first
    lazyRows.value = event.rows
    scheduleLazyLoad()
}
function onSort(event: any) {
    if (!props.lazy) return
    lazySortField.value = event.sortField || undefined
    lazySortOrder.value = event.sortOrder || 1
    lazyFirst.value = 0
    scheduleLazyLoad()
}

// Reload (from page 1) only when the effective where actually changes — this ignores
// the initial column-filter setup (all null) and other no-op filter events, avoiding a
// redundant second fetch on mount. lastCountWhere holds the currently-loaded where sig.
function applyFilterChange() {
    if (!props.lazy) return
    const sig = JSON.stringify(buildLazyWhere() ?? null)
    if (sig === lastCountWhere) {
        // No effective change (e.g. typed then cleared back) — no reload will run,
        // so clear the search spinner here instead of leaving it spinning.
        filteringInProgress.value = false
        return
    }
    lazyFirst.value = 0
    scheduleLazyLoad()
}
watch(globalSearchTerm, applyFilterChange)
watch(filters, applyFilterChange, { deep: true })

// ── Frozen rows ────────────────────────────────────────────────────────────
const frozenRecords = computed(() =>
    frozenRecordIds.value
        ? _.filter(records.value, (x) => (frozenRecordIds.value ?? []).includes(x.id))
        : []
)
const nonFrozenRecords = computed(() =>
    frozenRecordIds.value
        ? _.filter(records.value, (x) => !(frozenRecordIds.value ?? []).includes(x.id))
        : records.value
)

// ── Watchers ───────────────────────────────────────────────────────────────
watch(isLoginModalVisible, (newValue, oldValue) => {
    if (oldValue == true && newValue == false) props.lazy ? loadLazyData() : loadTableData()
})

watch(() => props.invalidRecords, (newValue) => {
    if (newValue) invalidRecordMessages.value = newValue
}, { immediate: true })

watch(() => props.where, (newValue, oldValue) => {
    if (_.isEqual(newValue, oldValue)) return
    if (props.lazy) applyFilterChange()
    else loadTableData()
})

if (import.meta.dev) {
    watch(lazyWhereRelationPaths, (paths) => {
        if (paths.length) {
            console.warn(
                `[SmartTable] the "where" prop uses relation field(s) not supported in lazy mode `
                + `(the server-side query has no relation traversal): ${paths.join(', ')}. `
                + `These rows are blocked from loading — use a flat field in "where", or set lazy=false `
                + `for tables that need relation filters.`
            )
        }
    }, { immediate: true })
}

// Keep visibleColumns in sync when the available options change (e.g. zodSchema prop swapped)
watch(visibleColumnsOptions, (newOptions) => {
    const savedVisibility = _.get(clientSettings.value, 'columnVisibility')
    visibleColumns.value = savedVisibility ?? newOptions
})

watch(frozenRecords, () => {
    nextTick(() => {
        const frozenTbody = document.querySelector(`#${dtId} .p-datatable-scrollable-table > .p-datatable-frozen-tbody`) as HTMLElement
        const datatableContainer = document.querySelector(`#${dtId} .p-datatable-table-container`) as HTMLElement
        const datatableColHeaderRow = document.querySelector(`#${dtId} .p-datatable-scrollable-table > thead.p-datatable-thead`) as HTMLElement

        const frozenTbodyHeight = frozenTbody.getBoundingClientRect().height || 0
        const datatableContainerHeight = datatableContainer.getBoundingClientRect().height || 0

        if (frozenTbodyHeight && frozenTbodyHeight > datatableContainerHeight / 2) {
            frozenTbody.setAttribute('style', 'position: sticky; z-index: 10;')
            datatableColHeaderRow.setAttribute('style', 'position: sticky; z-index: 20;')
        }
    })
})

watch(sortedColumnDefs, (newValue, oldValue) => {
    if (newValue != oldValue) {
        globalFilterFields.value = _.map(newValue, (x) => {
            if (_.isFunction(x.format)) return x.format
            if (x.element && _.isFunction(x.elementSearchText)) return x.elementSearchText
            return x.path ?? x.key
        }) as GlobalFilterField[]

        if (props.showColumnFilters) {
            const filtersEntries = newValue.reduce((acc, colDef) => {
                const key = colDef.path || colDef.key
                if (colDef.searchable !== false) {
                    _.set(acc, [key], { value: null, matchMode: defaultColumnMatchMode(colDef) })
                }
                return acc
            }, {})
            filters.value = _.merge({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } }, filtersEntries)
        }
    }
})

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
    if (!loggedIn.value) {
        showLoginModal()
    } else if (props.lazy) {
        clientSettings.value = JSON.parse(localStorage.getItem(localStorageKey.value) || '{}')
        visibleColumns.value = _.get(clientSettings.value, 'columnVisibility', visibleColumnsOptions.value)
        if (import.meta.dev) {
            const excluded = _.filter(sortedColumnDefs.value, (c) => c.key !== 'id' && c.display !== false && !isServerPushable(c))
            if (excluded.length) {
                console.warn(
                    `[SmartTable] lazy mode can only push flat view/table columns to the server. `
                    + `These columns use a relation path, format function, or custom element and are therefore `
                    + `excluded from server-side sorting and filtering`
                    + `${lazySearchExclusions.value.length ? ' (and the global search is hidden)' : ''}: `
                    + `${_.map(excluded, (c) => c.key).join(', ')}. Point them at a flat column to make them searchable/sortable.`
                )
            }
        }
        lazyRows.value = rowsPerPage.value
        lazySortField.value = props.sortBy?.[0]
        await loadLazyData()
    } else {
        await loadTableData()
    }
})

// ── Event handlers ─────────────────────────────────────────────────────────
const clearRouteQueryParams = async () => {
    await router.push({ path: route.path })
    loadTableData()
}

// ── Truncatable cell expansion ─────────────────────────────────────────────
const expandedCells = ref<Set<string>>(new Set())
const overflowingCells = ref<Set<string>>(new Set())

function toggleExpandedCell(rowId: string, colKey: string) {
    const key = `${rowId}-${colKey}`
    const next = new Set(expandedCells.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    expandedCells.value = next
}

function checkCellOverflow(el: Element | null, rowId: string, colKey: string) {
    if (!el) return
    nextTick(() => {
        const key = `${rowId}-${colKey}`
        const isOverflowing = (el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth
        if (isOverflowing !== overflowingCells.value.has(key)) {
            const next = new Set(overflowingCells.value)
            if (isOverflowing) next.add(key)
            else next.delete(key)
            overflowingCells.value = next
        }
    })
}

function getCellValue(columnDef: SortedColumnDefinition, data: any): string {
    if (columnDef.path) {
        const val = _.get(data, columnDef.path)
        if (columnDef.type === 'array' || Array.isArray(val)) {
            return _.join(_.filter(val, v => v === null || typeof v !== 'object'), ', ')
        }
        return val
    }
    return data[columnDef.key]
}

function toggleColumnFilters() {
    displayColumnFilters.value = !displayColumnFilters.value
}

function formatDate(value: string | Date | null | undefined) {
    if (!value) return ''
    const d = value instanceof Date ? value : new Date(value)
    return d.toLocaleDateString('fr-CA') // YYYY-MM-DD
}

function formatDateTime(value: string | Date | null | undefined) {
    if (!value) return ''
    const d = value instanceof Date ? value : new Date(value)
    const date = d.toLocaleDateString('fr-CA') // YYYY-MM-DD
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${date} ${time}`
}

function didClickEditRecord(event: MouseEvent) {
    emit('clicked-record-edit', event)
}
function didClickEditMultipleRecords() {
    emit('clicked-multiple-record-edit', selectedRecords.value)
}
function didClickAddRecord() {
    emit('clicked-record-add')
}
function confirmDeleteSelected() {
    displayDeleteConfirmation.value = true
}
function didClickDeleteSelectedRecords() {
    RecordService.deleteRecords(apiBaseUrl.value, selectedRecords.value).then((result) => {
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Records deleted', life: 3000 })
        const deletedRecordIds = _.map(result, (x) => x.id)
        records.value = _.reject(records.value, (x) => deletedRecordIds.includes(x.id))
        selectedRecords.value = _.reject(selectedRecords.value, (x) => deletedRecordIds.includes(x.id))
        if (!_.isEmpty(result)) emit('did-delete-multiple-records', result)
        if (props.lazy) reloadLazyWithCount()
    }).catch(error => {
        toast.add({ severity: 'error', summary: 'Error', detail: error.data?.statusMessage, life: 3000 })
    })
    displayDeleteConfirmation.value = false
}

function setGlobalSearchTerm() {
    _.set(filters.value, ['global', 'value'], globalSearchTerm.value)
}

function debounceSearch(f: Function, columnDefKey?: string) {
    filteringInProgress.value = true
    lastColumnFilterInputKey.value = columnDefKey || null
    return _.debounce(() => { f() }, 1000)
}

function filteringComplete(event?: any) {
    filteringInProgress.value = false
    onFilter(event)
    if (lastColumnFilterInputKey.value) {
        const input = _.get(columnFilterInputs.value, lastColumnFilterInputKey.value)
        if (input) input.$el.focus()
    }
}

/** The match mode a column filters by: explicit `filterMatchMode`, else EQUALS for select
 *  columns (an exact-value dropdown), else CONTAINS (substring text search). */
function defaultColumnMatchMode(columnDef: SortedColumnDefinition): string {
    if (columnDef.filterMatchMode) return columnDef.filterMatchMode
    if (columnDef.filterType === 'select') return FilterMatchMode.EQUALS
    return FilterMatchMode.CONTAINS
}

/** Distinct field values → select options, for client-side select columns that don't
 *  declare explicit `filterOptions`. Empty in lazy mode: only one page is loaded, so the
 *  distinct set would be incomplete — those columns must supply explicit `filterOptions`. */
const derivedFilterOptions = computed<Record<string, { label: string, value: any }[]>>(() => {
    if (props.lazy) return {}
    const out: Record<string, { label: string, value: any }[]> = {}
    for (const col of sortedColumnDefs.value) {
        if (col.filterType !== 'select' || col.filterOptions) continue
        const field = col.path ?? col.key
        const values = _.uniq(_.flatMap(records.value ?? [], (r) => {
            const v = _.get(r, field)
            return _.isArray(v) ? v : [v]
        }))
        const clean = _.sortBy(_.reject(values, (v) => v === null || v === undefined || v === ''))
        _.set(out, [col.key], _.map(clean, (v) => ({ label: String(v), value: v })))
    }
    return out
})

/** Resolved dropdown options for a select-filter column: explicit (normalized to
 *  `{ label, value }`) if given, otherwise the values auto-derived from the loaded data. */
function filterSelectOptions(columnDef: SortedColumnDefinition): { label: string, value: any }[] {
    if (columnDef.filterOptions) {
        return _.map(columnDef.filterOptions, (o) => _.isObject(o) ? o : { label: String(o), value: o })
    }
    return _.get(derivedFilterOptions.value, columnDef.key, [])
}

/** Apply a select-filter change. Clears the last-typed-input key first so filteringComplete
 *  doesn't yank focus back to a text input in another column after a dropdown selection. */
function onColumnFilterSelectChange(filterCallback: Function) {
    lastColumnFilterInputKey.value = null
    filterCallback()
}

function columnHeader(sortedColumnDef: SortedColumnDefinition) {
    return _.get(sortedColumnDef, 'header', _.startCase(sortedColumnDef.key))
}

function filterByColumnVisibility(columns: SortedColumnDefinition[]): SortedColumnDefinition[] {
    const visibleColumnKeys = _.map(visibleColumns.value, (x) => x.code)
    return _.filter(columns, (x) => x.key == 'id' || _.includes(visibleColumnKeys, x.key))
}

// ── Settings ───────────────────────────────────────────────────────────────
function updateColOrder() {
    const newColumnOrder = _.mapValues(
        _.keyBy(_.map(dt.value.columns, (v, i) => ({ index: i, value: v.props.field || v.props.columnKey })), 'value'),
        'index'
    )
    _.set(clientSettings.value, 'columnOrder', newColumnOrder)
}

function saveSettings() {
    if (_.isEqual(visibleColumns.value, visibleColumnsOptions.value)) {
        clientSettings.value = {}
        localStorage.removeItem(localStorageKey.value)
    } else {
        _.set(clientSettings.value, 'columnVisibility', visibleColumns.value)
        localStorage.setItem(localStorageKey.value, JSON.stringify(clientSettings.value))
    }
    showSettings.value = false
}

function clearSettings() {
    visibleColumns.value = visibleColumnsOptions.value
    clientSettings.value = {}
    localStorage.removeItem(localStorageKey.value)
    dtKey.value = uuidv4()
}

// ── Export ─────────────────────────────────────────────────────────────────
function getExportRecords() {
    const recordsToExport = _.isEmpty(selectedRecords.value) ? records.value : selectedRecords.value
    const exportRecords = []
    for (const record of recordsToExport || []) {
        const exportRecord = {}
        for (const columnDef of _.filter(sortedColumnDefs.value, (x) => x.exportable !== false)) {
            if (_.map(visibleColumns.value, (x) => x.code).includes(columnDef.key)) {
                const header = columnHeader(columnDef)
                if (columnDef.exportValue) {
                    _.set(exportRecord, [header], columnDef.exportValue(record))
                } else if (_.isFunction(columnDef.format)) {
                    _.set(exportRecord, [header], columnDef.format(record))
                } else if (columnDef.format == 'date-time') {
                    _.set(exportRecord, [header], formatDateTime(_.get(record, columnDef.path ?? columnDef.key)))
                } else if (columnDef.type == 'array') {
                    _.set(exportRecord, [header], _.join(_.filter(_.get(record, columnDef.path ?? columnDef.key), v => v === null || typeof v !== 'object'), ', '))
                } else {
                    _.set(exportRecord, [header], _.get(record, columnDef.path ?? columnDef.key))
                }
            }
        }
        exportRecords.push(exportRecord)
    }
    return exportRecords
}

function exportCSV() {
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

function exportXLSX() {
    const exportRecords = getExportRecords()
    const rows: any[] = []
    if (!_.isEmpty(exportRecords)) {
        rows.push(_.keys(exportRecords[0]))
    } else {
        rows.push(_.map(_.filter(sortedColumnDefs.value, (x) => x.exportable !== false), (x) => columnHeader(x)))
    }
    for (const record of exportRecords) rows.push(_.values(record))

    const wb = XlsxUtils.book_new()
    const ws = XlsxUtils.aoa_to_sheet(rows)
    XlsxUtils.book_append_sheet(wb, ws, 'Sheet1')
    writeFileXLSX(wb, `${exportFilename.value}.xlsx`)
}

const exportOptions = [
    { label: 'XLSX', icon: 'pi pi-file-excel', command: () => exportXLSX() },
    { label: 'CSV', icon: 'pi pi-file', command: () => exportCSV() },
]

// ── Exposed API (used by crudTable composable) ─────────────────────────────
const addOrRefreshRecordIds = async (recordIds: string[]) => {
    if (props.lazy) {
        reloadLazyWithCount()
        return
    }
    let currentRecords
    if (recordIds.length == 1) {
        const record = await RecordService.getRecord(apiBaseUrl.value, recordIds[0]!, props.withClause)
        currentRecords = record ? [record] : []
    } else {
        currentRecords = await RecordService.getRecordsByIds(apiBaseUrl.value, recordIds, props.withClause)
    }

    const newRecordIds: string[] = []
    for (const recordId of recordIds) {
        const existingRecordIndex = _.findIndex(records.value, { id: recordId })
        if (records.value && existingRecordIndex != -1) {
            records.value[existingRecordIndex] = _.find(currentRecords, { id: recordId })
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
    if (props.lazy) {
        reloadLazyWithCount()
        return
    }
    records.value = _.reject(records.value, { id: recordId })
}

defineExpose({ addOrRefreshRecordIds, removeRecordId, selectedRecords, records })
</script>

<template>
    <DataTable
        ref="dt"
        :id="dtId"
        :key="dtKey"
        v-bind="lazyBindings"
        @page="onPage"
        @sort="onSort"
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
                        <Button v-if="props.canAdd" label="Add" icon="pi pi-plus" severity="secondary" class="mr-2" @click="didClickAddRecord" :disabled="!_.isEmpty(selectedRecords)" />
                        <Button v-if="props.canEditMultiple" label="Edit" icon="pi pi-pencil" severity="secondary" class="mr-2" @click="didClickEditMultipleRecords" :disabled="_.isEmpty(selectedRecords)" />
                        <Button v-if="props.canDelete" label="Delete" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="_.isEmpty(selectedRecords)" />
                    </template>
                    <template #end>
                        <SplitButton v-if="props.canExport" label="Export" class="mr-2" :model="exportOptions" severity="secondary" @click="exportXLSX"></SplitButton>
                        <template v-if="!props.hideSettings">
                            <Button label="Columns" class="mr-2" :icon="`pi ${_.isEmpty(clientSettings) ? 'pi-eye' : 'pi-eye-slash'}`" :severity="`${_.isEmpty(clientSettings) ? 'secondary' : 'warn'}`" @click="showSettings = !showSettings" />
                            <IftaLabel :class="`min-w-44 mr-2 ${showSettings ? 'visible' : 'invisible'}`">
                                <MultiSelect class="w-full" inputId="visibileColumnsInput" v-model="visibleColumns" :options="visibleColumnsOptions" optionLabel="name" :maxSelectedLabels="0" placeholder="select" />
                                <label for="visibileColumnsInput" v-if="showSettings">Columns</label>
                            </IftaLabel>
                            <Button icon="pi pi-undo" :class="`mr-2 ${showSettings ? 'visible' : 'invisible'}`" severity="secondary" v-tooltip="{value: 'Clear settings'}" @click="clearSettings" />
                            <Button icon="pi pi-check" :class="`mr-2 ${showSettings ? 'visible' : 'invisible'}`" style="color: green" severity="secondary" v-tooltip="{value: 'Save settings'}" @click="saveSettings" />
                        </template>
                        <ProgressSpinner :class="`max-w-12 max-h-12 ${loading || filteringInProgress ? 'visible' : 'invisible'}`" strokeWidth="4" />
                    </template>
                </Toolbar>
                <IconField v-if="showGlobalSearch">
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="globalSearchTerm" placeholder="Search..." @input="debounceSearch(setGlobalSearchTerm)()" />
                </IconField>
                <slot name="header-buttons" />
            </div>
        </template>
        <template #empty> {{ props.emptyMessage }} </template>
        <template #loading> Loading </template>

        <Column columnKey="selectBox" :reorderableColumn="false" :class="`w-0 pl-6! ${selectionDisabled ? 'p-disabled' : ''}`" v-if="selectionMode == 'multiple'" :selectionMode="selectionMode" :exportable="false" frozen />
        <Column v-if="!_.isEmpty(invalidRecordMessages)" columnKey="invalidRecordIndicator" :reorderableColumn="true" class="w-0 pl-6!" :exportable="false" frozen>
            <template #body="slotProps">
                <span v-if="invalidRecordMessages[slotProps.data.id]" class="text-red-600">
                    <i class="pi pi-exclamation-circle" v-tooltip="invalidRecordMessages[slotProps.data.id].messages.join(', ')" />
                </span>
            </template>
        </Column>
        <Column columnKey="crudButtons" :reorderableColumn="false" :class="`whitespace-nowrap pr-0! w-0 ${selectionMode == 'multiple' ? 'pl-0!' : ''}`" v-if="props.canEdit || props.showColumnFilters" :exportable="false" :showFilterMenu="false" frozen>
            <template v-if="props.showColumnFilters" #header>
                <Button :icon="displayColumnFilters ? 'pi pi-search-minus' : 'pi pi-search-plus'" text rounded severity="info" @click="toggleColumnFilters" />
            </template>
            <template #body="slotProps">
                <div class="group flex items-center">
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
            <template v-if="columnDef.display !== false">
                <Column v-if="columnDef.format == 'date-time'" :field="columnDef.path" :header="columnHeader(columnDef)" :reorderableColumn="showSettings" :bodyClass="columnDef.bodyClass || '!w-max !max-w-max !min-w-max'" :showFilterMenu="columnDef.advancedFilter === true" :showClearButton="false" :dataType="columnDef.dataType" :filterMatchModeOptions="columnDef.filterMatchModeOptions" :sortable="props.lazy && !isServerPushable(columnDef) ? false : _.get(columnDef, 'sortable', true)">
                    <template v-if="columnDef.path && _.has(filters, columnDef.path) && (!props.lazy || isServerPushable(columnDef))" #filter="{ filterModel, filterCallback }">
                        <SmartTableColumnFilter :column-def="columnDef" :filter-model="filterModel" :filter-callback="filterCallback" :options="filterSelectOptions(columnDef)" :debounce-search="debounceSearch" :register-input="(el: any) => _.set(columnFilterInputs, columnDef.key, el)" :on-select-change="() => onColumnFilterSelectChange(filterCallback)" />
                    </template>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data[columnDef.key]) }}
                    </template>
                </Column>
                <Column v-else-if="columnDef.format == 'date'" :field="columnDef.path" :header="columnHeader(columnDef)" :reorderableColumn="showSettings" :bodyClass="columnDef.bodyClass || '!w-max !max-w-max !min-w-max'" :showFilterMenu="columnDef.advancedFilter === true" :showClearButton="false" :dataType="columnDef.dataType" :filterMatchModeOptions="columnDef.filterMatchModeOptions" :sortable="props.lazy && !isServerPushable(columnDef) ? false : _.get(columnDef, 'sortable', true)">
                    <template v-if="columnDef.path && _.has(filters, columnDef.path) && (!props.lazy || isServerPushable(columnDef))" #filter="{ filterModel, filterCallback }">
                        <SmartTableColumnFilter :column-def="columnDef" :filter-model="filterModel" :filter-callback="filterCallback" :options="filterSelectOptions(columnDef)" :debounce-search="debounceSearch" :register-input="(el: any) => _.set(columnFilterInputs, columnDef.key, el)" :on-select-change="() => onColumnFilterSelectChange(filterCallback)" />
                    </template>
                    <template #body="slotProps">
                        {{ formatDate(slotProps.data[columnDef.key]) }}
                    </template>
                </Column>
                <Column v-else-if="columnDef.type == 'boolean' || _.includes(columnDef.type, 'boolean')" :field="columnDef.path" :header="columnHeader(columnDef)" :reorderableColumn="showSettings" :bodyClass="columnDef.bodyClass || '!w-max !max-w-max !min-w-max'" :showFilterMenu="columnDef.advancedFilter === true" :showClearButton="false" :dataType="columnDef.dataType" :filterMatchModeOptions="columnDef.filterMatchModeOptions" :sortable="props.lazy && !isServerPushable(columnDef) ? false : _.get(columnDef, 'sortable', true)">
                    <template v-if="columnDef.path && _.has(filters, columnDef.path) && (!props.lazy || isServerPushable(columnDef))" #filter="{ filterModel, filterCallback }">
                        <SmartTableColumnFilter :column-def="columnDef" :filter-model="filterModel" :filter-callback="filterCallback" :options="filterSelectOptions(columnDef)" :debounce-search="debounceSearch" :register-input="(el: any) => _.set(columnFilterInputs, columnDef.key, el)" :on-select-change="() => onColumnFilterSelectChange(filterCallback)" />
                    </template>
                    <template #body="slotProps">
                        {{ slotProps.data[columnDef.key] ? '✓' : '' }}
                    </template>
                </Column>
                <Column v-else-if="columnDef.format == 'hyperlink'" :field="columnDef.path" :header="columnHeader(columnDef)" :reorderableColumn="showSettings" :bodyClass="columnDef.bodyClass || '!w-max !max-w-max !min-w-max'" :showFilterMenu="columnDef.advancedFilter === true" :showClearButton="false" :dataType="columnDef.dataType" :filterMatchModeOptions="columnDef.filterMatchModeOptions" :sortable="props.lazy && !isServerPushable(columnDef) ? false : _.get(columnDef, 'sortable', true)">
                    <template v-if="columnDef.path && _.has(filters, columnDef.path) && (!props.lazy || isServerPushable(columnDef))" #filter="{ filterModel, filterCallback }">
                        <SmartTableColumnFilter :column-def="columnDef" :filter-model="filterModel" :filter-callback="filterCallback" :options="filterSelectOptions(columnDef)" :debounce-search="debounceSearch" :register-input="(el: any) => _.set(columnFilterInputs, columnDef.key, el)" :on-select-change="() => onColumnFilterSelectChange(filterCallback)" />
                    </template>
                    <template #body="slotProps">
                        <a class="text-blue-600 underline visited:text-purple-600 hover:text-blue-800"
                            :href="slotProps.data[columnDef.key]"
                            target="_blank">
                            {{ slotProps.data[columnDef.key] }}
                        </a>
                    </template>
                </Column>
                <Column v-else-if="columnDef.type == 'element'" :field="columnDef.path" :header="columnHeader(columnDef)" :reorderableColumn="showSettings" :bodyClass="columnDef.bodyClass" :showFilterMenu="columnDef.advancedFilter === true" :showClearButton="false" :dataType="columnDef.dataType" :filterMatchModeOptions="columnDef.filterMatchModeOptions" :sortable="props.lazy && !isServerPushable(columnDef) ? false : _.get(columnDef, 'sortable', true)">
                    <template v-if="columnDef.path && _.has(filters, columnDef.path) && (!props.lazy || isServerPushable(columnDef))" #filter="{ filterModel, filterCallback }">
                        <SmartTableColumnFilter :column-def="columnDef" :filter-model="filterModel" :filter-callback="filterCallback" :options="filterSelectOptions(columnDef)" :debounce-search="debounceSearch" :register-input="(el: any) => _.set(columnFilterInputs, columnDef.key, el)" :on-select-change="() => onColumnFilterSelectChange(filterCallback)" />
                    </template>
                    <template #body="slotProps">
                        <span v-if="_.isFunction(columnDef.element)" v-html="columnDef.element(slotProps.data)" v-on:click="columnDef.elementClick ? columnDef.elementClick(slotProps.data) : null"></span>
                        <span v-else-if="_.isString(columnDef.element)" v-html="columnDef.element" v-on:click="columnDef.elementClick ? columnDef.elementClick(slotProps.data) : null"></span>
                        <span v-else>err</span>
                    </template>
                </Column>
                <Column v-else-if="columnDef.key != 'id'" :field="columnDef.path" :header="columnHeader(columnDef)" :reorderableColumn="showSettings" :bodyClass="columnDef.bodyClass || '!w-max !max-w-max !min-w-max'" :showFilterMenu="columnDef.advancedFilter === true" :showClearButton="false" :dataType="columnDef.dataType" :filterMatchModeOptions="columnDef.filterMatchModeOptions" :sortable="props.lazy && !isServerPushable(columnDef) ? false : _.get(columnDef, 'sortable', true)">
                    <template v-if="columnDef.path && _.has(filters, columnDef.path) && (!props.lazy || isServerPushable(columnDef))" #filter="{ filterModel, filterCallback }">
                        <SmartTableColumnFilter :column-def="columnDef" :filter-model="filterModel" :filter-callback="filterCallback" :options="filterSelectOptions(columnDef)" :debounce-search="debounceSearch" :register-input="(el: any) => _.set(columnFilterInputs, columnDef.key, el)" :on-select-change="() => onColumnFilterSelectChange(filterCallback)" />
                    </template>
                    <template v-if="columnDef.path || columnDef.truncatable" #body="slotProps">
                        <template v-if="columnDef.truncatable">
                            <span v-if="expandedCells.has(`${slotProps.data.id}-${columnDef.key}`)" class="wrap-anywhere">
                                {{ getCellValue(columnDef, slotProps.data) }}<a class="ml-1 text-blue-500 cursor-pointer text-xs whitespace-nowrap select-none" @click.stop="toggleExpandedCell(slotProps.data.id, columnDef.key)">[less]</a>
                            </span>
                            <span v-else class="flex items-baseline gap-1 min-w-0">
                                <span :ref="(el) => checkCellOverflow(el as Element | null, slotProps.data.id, columnDef.key)" class="truncate min-w-0 flex-1">{{ getCellValue(columnDef, slotProps.data) }}</span><a v-if="overflowingCells.has(`${slotProps.data.id}-${columnDef.key}`)" class="flex-shrink-0 text-blue-500 cursor-pointer text-xs whitespace-nowrap select-none" @click.stop="toggleExpandedCell(slotProps.data.id, columnDef.key)">[more]</a>
                            </span>
                        </template>
                        <template v-else-if="columnDef.path">
                            {{ (columnDef.type == 'array' || Array.isArray(_.get(slotProps.data, columnDef.path)))
                                ? _.join(_.filter(_.get(slotProps.data, columnDef.path), v => v === null || typeof v !== 'object'), ', ')
                                : _.get(slotProps.data, columnDef.path) }}
                        </template>
                    </template>
                </Column>
            </template>
        </template>
        <Column class="whitespace-nowrap" v-if="rowActionsEnd" columnKey="rowActions" :reorderableColumn="false" frozen alignFrozen="right">
            <template #header>{{ Object.values(rowActionsEnd ?? {})[0]?.header ?? '' }}</template>
            <template #body="{ data }">
                <div class="flex items-center">
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
                                <span :class="`pi pi-fw p-button-icon ${v.iconPos == 'right' ? 'p-button-icon-right' : ''} inline-block`">
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
            <Button label="No" icon="pi pi-times" @click="displayDeleteConfirmation = !displayDeleteConfirmation" text severity="secondary" />
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
    color: var(--p-text-color);
}
.p-datatable-frozen-tbody > tr > td {
    background-color: var(--p-content-border-color) !important;
}
.p-datatable-table tr {
    box-shadow: 0 0 1px var(--p-text-color);
}

/* Row action buttons: consistent height, icon centred when label is absent */
.p-datatable-tbody .p-button {
    height: 2.25rem;
    min-width: 2.25rem;
    align-items: center;
    justify-content: center;
}
</style>
