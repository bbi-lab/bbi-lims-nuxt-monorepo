<script setup lang="ts">
// Renders the input for a single column-filter cell (row mode). Extracted from SmartTable
// so the text/select switch lives in one place instead of being duplicated across every
// column variant. Debounce, focus-restore and spinner state stay owned by SmartTable and
// are threaded in as callbacks so behavior matches the previous inline template exactly.
const props = defineProps<{
    columnDef: SortedColumnDefinition
    /** The `{ value, matchMode }` object from PrimeVue's column `#filter` slot. */
    filterModel: { value: any, matchMode?: string }
    /** PrimeVue's slot callback that applies the current filter value. */
    filterCallback: () => void
    /** Resolved `{ label, value }` options (explicit or auto-derived) for select filters. */
    options?: Array<{ label: string, value: any }>
    /** SmartTable's debounce wrapper — sets the spinner + last-focused key, then filters. */
    debounceSearch: (f: Function, key?: string) => () => void
    /** Registers the text input element so SmartTable can restore focus after filtering. */
    registerInput: (el: any) => void
    /** Applies a select change without stealing focus back to a previously-typed input. */
    onSelectChange: () => void
}>()
</script>

<template>
    <Select
        v-if="columnDef.filterType === 'select'"
        class="w-full m-0 p-1"
        v-model="filterModel.value"
        :options="options"
        optionLabel="label"
        optionValue="value"
        placeholder="Any"
        showClear
        @change="onSelectChange()"
    />
    <InputText
        v-else
        class="w-full m-0 p-1"
        v-model="filterModel.value"
        type="text"
        @input="debounceSearch(filterCallback, columnDef.key)()"
        :ref="(el: any) => registerInput(el)"
    />
</template>
