<script setup lang="ts">
interface Props {
    referenceSequence: string
    altSequence: string
    startPos?: number // for display purposes only, does not affect alignment
    showCodons?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showCodons: false,
})

// Normalise both sequences to the same length using `-` as gap character
const maxLen = computed(() => Math.max(props.referenceSequence.length, props.altSequence.length))
const refPadded = computed(() => props.referenceSequence.padEnd(maxLen.value, '-'))
const altPadded = computed(() => props.altSequence.padEnd(maxLen.value, '-'))

const aaStartPos = computed(() => {
    if (!props.showCodons) return undefined
    return props.startPos ? Math.ceil(props.startPos / 3) : 1
})

// ── Per-base units ────────────────────────────────────────────────────────────
interface BaseUnit {
    ref: string
    alt: string
    isDiff: boolean
    pos: number        // 1-based nucleotide position
    codonIndex: number // which codon this base belongs to (for background banding)
}

const baseUnits = computed<BaseUnit[]>(() =>
    Array.from({ length: maxLen.value }, (_, i) => ({
        ref: refPadded.value[i]!,
        alt: altPadded.value[i]!,
        isDiff: refPadded.value[i] !== altPadded.value[i],
        pos: i + 1,
        codonIndex: Math.floor(i / 3),
    })),
)

// ── Summary stats ─────────────────────────────────────────────────────────────
const diffCount = computed(() => baseUnits.value.filter(u => u.isDiff).length)
const diffPercent = computed(() =>
    maxLen.value > 0 ? ((diffCount.value / maxLen.value) * 100).toFixed(1) : '0.0',
)

// In codon mode, how many codons have at least one mismatch
const numCodons = computed(() => Math.ceil(maxLen.value / 3))
const codonDiffCount = computed(() => {
    if (!props.showCodons) return 0
    let count = 0
    for (let i = 0; i < numCodons.value; i++) {
        const start = i * 3
        const refCodon = refPadded.value.slice(start, start + 3)
        const altCodon = altPadded.value.slice(start, start + 3)
        if (refCodon !== altCodon) count++
    }
    return count
})

// ── Position tick positions (every 10 nt, zero-indexed) ───────────────────────
const positionTicks = computed<number[]>(() => {
    const ticks: number[] = []
    for (let i = 0; i < maxLen.value; i += 15) ticks.push(i)
    return ticks
})

// ── Codon label ticks (every 5 codons) ────────────────────────────────────────
const codonTicks = computed<number[]>(() => {
    const ticks: number[] = []
    for (let i = 0; i < numCodons.value; i += 5) ticks.push(i)
    return ticks
})

// ── Deduplicated set of codon indices that contain at least one mismatch ──────
const diffCodonIndices = computed<number[]>(() => {
    if (!props.showCodons) return []
    const seen = new Set<number>()
    for (const unit of baseUnits.value) {
        if (unit.isDiff) seen.add(unit.codonIndex)
    }
    return [...seen]
})

// ── CSS helpers ───────────────────────────────────────────────────────────────
/**
 * Returns the `left` offset for a base at index `i`.
 * Each base character is exactly `BASE_CH` ch wide.
 * We rely on the mono font being rendered at a consistent ch width.
 */
const BASE_CH = 1.4 // ch per character — slightly wider than 1ch for readability

function baseLeft(i: number): string {
    return `${i * BASE_CH}ch`
}

function codonLeft(codonIndex: number): string {
    return `${codonIndex * 3 * BASE_CH}ch`
}

// Total row width in ch
const rowWidth = computed(() => `${maxLen.value * BASE_CH}ch`)
</script>

<template>
    <div class="font-mono text-xs select-none">
        <!-- ── Summary bar ─────────────────────────────────────────────────── -->
        <div class="flex flex-wrap items-center gap-3 mb-3 text-xs text-surface-500">
            <span>
                <span class="font-semibold text-surface-700">length: {{ maxLen }}</span>
            </span>
            <span>
                <span
                    class="font-semibold"
                    :class="diffCount > 0 ? 'text-red-600' : 'text-green-600'"
                >{{ diffCount }}</span>
                difference{{ diffCount !== 1 ? 's' : '' }} ({{ diffPercent }}%)
            </span>
            <span v-if="showCodons">
                <span
                    class="font-semibold"
                    :class="codonDiffCount > 0 ? 'text-red-600' : 'text-green-600'"
                >{{ codonDiffCount }}</span>
                / {{ numCodons }} codon{{ numCodons !== 1 ? 's' : '' }} affected
            </span>
            <span
                v-if="showCodons"
                class="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-medium"
            >
                <i class="pi pi-th-large text-[10px]" />
                Codon mode
            </span>
        </div>

        <!-- ── Scrollable alignment ────────────────────────────────────────── -->
        <div class="overflow-x-auto rounded border border-surface-200 bg-surface-0">
            <div class="p-3 pb-4">
                <!--
                    All rows share the same inner width so scrolling stays in sync.
                    We use `position: relative` + absolute children so every glyph
                    lands on an exact ch-based grid column.
                -->
                <div class="flex flex-col gap-0">
                    <!-- ── Position ruler ──────────────────────────────────── -->
                    <div class="flex items-end mb-1">
                        <span class="shrink-0 text-right pr-2 text-surface-400 font-sans" style="width: 3rem">pos</span>
                        <div class="relative overflow-visible" :style="{ width: rowWidth, height: '1.2em' }">
                            <!-- Tick mark for every position to establish full row width -->
                            <span
                                v-for="tick in positionTicks"
                                :key="'tick-' + tick"
                                class="absolute bottom-0 text-surface-400 overflow-visible whitespace-nowrap"
                                :style="{ left: baseLeft(tick) }"
                            >{{ tick + (startPos ?? 1) }}</span>
                        </div>
                    </div>

                    <!-- ── Reference row ───────────────────────────────────── -->
                    <div class="flex items-center">
                        <span class="shrink-0 text-right pr-2 font-semibold text-surface-600 font-sans" style="width: 3rem">ref</span>
                        <div class="relative" :style="{ width: rowWidth, height: '1.4em' }">
                            <!-- Codon band backgrounds (behind text) -->
                            <template v-if="showCodons">
                                <span
                                    v-for="(_, ci) in numCodons"
                                    :key="'ref-band-' + ci"
                                    class="absolute inset-y-0 rounded-sm"
                                    :class="ci % 2 === 0 ? 'bg-indigo-50' : ''"
                                    :style="{ left: codonLeft(ci), width: `${3 * BASE_CH}ch` }"
                                />
                            </template>

                            <!-- Characters -->
                            <span
                                v-for="unit in baseUnits"
                                :key="'ref-' + unit.pos"
                                class="absolute text-center uppercase leading-none top-1/2 -translate-y-1/2 text-surface-800"
                                :style="{ left: baseLeft(unit.pos - 1), width: `${BASE_CH}ch` }"
                            >{{ unit.ref }}</span>
                        </div>
                    </div>

                    <!-- ── Alt row ─────────────────────────────────────────── -->
                    <div class="flex items-center">
                        <span class="shrink-0 text-right pr-2 font-semibold text-surface-600 font-sans" style="width: 3rem">alt</span>
                        <div class="relative" :style="{ width: rowWidth, height: '1.4em' }">
                            <!-- Codon band backgrounds -->
                            <template v-if="showCodons">
                                <span
                                    v-for="(_, ci) in numCodons"
                                    :key="'alt-band-' + ci"
                                    class="absolute inset-y-0 rounded-sm"
                                    :class="[
                                        ci % 2 === 0 ? 'bg-indigo-50' : '',
                                    ]"
                                    :style="{ left: codonLeft(ci), width: `${3 * BASE_CH}ch` }"
                                />
                                <!-- Highlight codon bands where the codon differs (one span per codon) -->
                                <span
                                    v-for="ci in diffCodonIndices"
                                    :key="'alt-codon-hl-' + ci"
                                    class="absolute inset-y-0 rounded-sm bg-red-100/60 pointer-events-none"
                                    :style="{
                                        left: codonLeft(ci),
                                        width: `${3 * BASE_CH}ch`,
                                    }"
                                />
                            </template>

                            <!-- Characters -->
                            <span
                                v-for="unit in baseUnits"
                                :key="'alt-' + unit.pos"
                                class="absolute text-center uppercase leading-none top-1/2 -translate-y-1/2"
                                :class="unit.isDiff
                                    ? 'text-red-600 font-bold'
                                    : 'text-surface-800'"
                                :style="{ left: baseLeft(unit.pos - 1), width: `${BASE_CH}ch` }"
                                :title="unit.isDiff
                                    ? `Position ${unit.pos}: ${unit.ref} → ${unit.alt}`
                                    : undefined"
                            >{{ unit.alt }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
