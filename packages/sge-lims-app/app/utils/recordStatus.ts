import _ from 'lodash'
import type { RecordStatus } from '#shared/db/schema/status'

// The label/colour registry lives here rather than next to the enum in shared/db/schema/status.ts
// because Tailwind only emits classes it finds literally in a file it scans, and
// base-layer/assets/tailwind.css scans sge-lims-app/app/** but nothing under shared/.
// Typed as a full Record so adding an enum value is a compile error until it is labelled.
const RECORD_STATUSES: Record<RecordStatus, { label: string, desc: string, color: string }> = {
    'not-started': { label: 'Not started', desc: 'Not started', color: 'slate' },
    'in-progress': { label: 'In progress', desc: 'In progress', color: 'blue' },
    'on-hold': { label: 'On hold', desc: 'On hold', color: 'amber' },
    'next-step-ready': { label: 'Next step ready', desc: 'Next step ready', color: 'violet' },
    'complete': { label: 'Complete', desc: 'Complete', color: 'emerald' },
    'discarded': { label: 'Discarded', desc: 'Discarded', color: 'red' },
}

// The tag classes are spelled out per colour rather than interpolated from the palette name, because
// Tailwind only emits classes it finds literally in a file it scans; a `bg-${color}-100` template
// would be purged.
// no text size class, so the tag inherits the table's font size like every other column
const TAG_BASE = 'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 font-medium ring-1 ring-inset'

const TAG_COLORS: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-slate-400/30',
    blue: 'bg-blue-100 text-blue-800 ring-blue-300 dark:bg-blue-400/15 dark:text-blue-300 dark:ring-blue-400/30',
    amber: 'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/30',
    violet: 'bg-violet-100 text-violet-800 ring-violet-300 dark:bg-violet-400/15 dark:text-violet-300 dark:ring-violet-400/30',
    emerald: 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30',
    red: 'bg-red-100 text-red-800 ring-red-300 dark:bg-red-400/15 dark:text-red-300 dark:ring-red-400/30',
}

// used by recordStatusLink when a record has no status yet, so the tag still reads as a button
const TAG_UNSET = 'bg-white text-slate-600 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600'

// A status reaches these helpers in one of two shapes:
//   'complete'                     a plain table column, or a view
//   {originalValue, displayValue}  after SmartTable rewrites a column that has a format function
function statusValue(status: any): string | null {
    if (!_.isObject(status)) return (status as string) || null
    return _.get(status, 'originalValue', null)
}

export function recordStatusLabel(status: any): string {
    const value = statusValue(status)
    return value ? _.get(RECORD_STATUSES, [value, 'label'], '') : ''
}

function tagColors(value: string | null): string {
    if (!value) return TAG_UNSET
    return _.get(TAG_COLORS, _.get(RECORD_STATUSES, [value, 'color'], 'slate'), TAG_COLORS.slate!)
}

// Returns the tag as an HTML string, for SmartTable column defs of type 'element'.
export function recordStatusTag(status: any): string {
    const label = recordStatusLabel(status)
    if (!label) return ''

    return `<span class="${TAG_BASE} ${tagColors(statusValue(status))}">${label}</span>`
}

// A link wearing the status tag: colour indicates the linked record's status, text is its name, and
// the status label is the hover tooltip. SmartTable injects element column content as raw HTML, so
// this escapes its inputs and uses the native title attribute rather than PrimeVue's v-tooltip.
export function recordStatusLink(status: any, text: string, href: string): string {
    const tooltip = recordStatusLabel(status) || 'No status set'
    const classes = `${TAG_BASE} ${tagColors(statusValue(status))} hover:opacity-80`
    return `<a href="${_.escape(href)}" title="${_.escape(tooltip)}" class="${classes}">${_.escape(text)}</a>`
}
