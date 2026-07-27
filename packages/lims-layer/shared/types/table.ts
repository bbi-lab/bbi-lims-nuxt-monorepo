/**
 * Column definitions and related types for table components.
 *
 * Example usage (configuring different modes of columns filtering):
 *
 * const columnDefs: ColumnDefinitions = {
    // simple text (default) — unchanged
    name: {},

    // select, options auto-derived from loaded data (client-side tables)
    status: { filterType: 'select' },

    // select with explicit options — required for lazy tables
    discarded: { filterType: 'select', filterOptions: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },

    // refined single-value text filter (still the always-visible row input)
    barcode: { filterMatchMode: 'startsWith' },

    // Tier 1: adds the native funnel button → match-mode picker + typed input
    createdAt: { advancedFilter: true, dataType: 'date' },
    copies:    { advancedFilter: true, dataType: 'numeric' },
    }
 */


export interface ColumnDefinition {
    header?: string
    index?: number
    format?: string | ((data: any) => string | string[] | number | null)
    path?: string
    type?: string
    display?: boolean
    sortable?: boolean
    element?: string | ((data: any) => string | null)
    elementSearchText?: (data: any) => string
    elementClick?: (event: any) => void
    searchable?: boolean
    exportable?: boolean
    exportValue?: (record: any) => string
    bodyClass?: string
    truncatable?: boolean
    // ── Column filtering (row mode) ──────────────────────────────────────────
    /** Filter input rendered in the column-filter row. `'text'` (default) is a free-text
     *  input; `'select'` is a dropdown. */
    filterType?: 'text' | 'select'
    /** Dropdown options for `filterType: 'select'`. Plain strings or `{ label, value }`.
     *  When omitted, options are auto-derived from the loaded data (client-side only). */
    filterOptions?: Array<string | { label: string, value: string | number | boolean }>
    /** PrimeVue `FilterMatchMode` this column filters by. Defaults to `CONTAINS` for text
     *  and `EQUALS` for select. Lets a text column filter by e.g. `startsWith` or `equals`. */
    filterMatchMode?: string
    /** Tier 1 advanced filter: show PrimeVue's per-column filter menu (the funnel overlay
     *  with a match-mode dropdown + Apply/Clear) alongside the inline row input. */
    advancedFilter?: boolean
    /** Value type for the advanced filter menu — drives the input widget and available
     *  match modes (`'numeric'` → number input + comparisons, `'date'` → date picker). */
    dataType?: 'text' | 'numeric' | 'date'
    /** Restrict/override the match modes offered in the advanced filter menu. */
    filterMatchModeOptions?: Array<{ label: string, value: string }>
}

export interface SortedColumnDefinition extends ColumnDefinition {
    key: string
}

export type ColumnDefinitions = { [key: string]: ColumnDefinition }

export interface VisibleColumn { name: string, code: string }

export type GlobalFilterField = string | ((data: any) => string)
