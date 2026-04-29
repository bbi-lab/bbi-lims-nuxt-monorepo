<script setup lang="ts">
import { VALID_WELL_COLORS } from '../../shared/lib/plate-diagram'
import _ from 'lodash'

const toast = useToast()

export interface OligoItem {
    label: string
    type: string
    sequence: string
}

const props = defineProps({
    data: {
        type: Array as PropType<OligoItem[]>,
        required: true,
    },
    colorMap: {
        type: Object as PropType<Record<string, string>>,
        required: false,
        default: () => ({}),
    },
    name: {
        type: String,
    },
})

const hoveredType = ref<string | null>(null)
const selectedType = ref<string | null>(null)

const selectedItems = computed(() =>
    selectedType.value ? props.data.filter(item => item.type === selectedType.value) : [],
)

const totalLength = computed(() =>
    props.data.reduce((sum, item) => sum + item.sequence.length, 0),
)

const computedColorMap = computed(() => {
    const map: Record<string, string> = { ...props.colorMap }
    let colorIndex = 0
    for (const item of props.data) {
        if (!_.has(map, item.type)) {
            _.set(map, item.type, VALID_WELL_COLORS[colorIndex % VALID_WELL_COLORS.length])
            colorIndex++
        }
    }
    return map
})

const meterItems = computed(() =>
    props.data.map((item) => ({
        label: item.label,
        color: computedColorMap.value[item.type],
        value: totalLength.value > 0 ? (item.sequence.length / totalLength.value) * 100 : 0,
        _original: item,
    })),
)

const fullSequence = computed(() => _.join(props.data.map(item => item.sequence), ''))

const uniqueTypes = computed(() => {
    const seen = new Set<string>()
    const result: { type: string; color: string }[] = []
    for (const item of props.data) {
        if (!seen.has(item.type)) {
            seen.add(item.type)
            result.push({ type: item.type, color: _.get(computedColorMap.value, item.type) })
        }
    }
    return result
})

function toggleType(type: string) {
    selectedType.value = selectedType.value === type ? null : type
}

function downloadAsFasta() {
    // Create fasta file and download
    const fastaContent = `>${props.name || 'oligo'}\n${fullSequence.value.match(/.{1,80}/g)?.join('\n') || ''}`
    const blob = new Blob([fastaContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.name || 'oligo'}.fasta`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

function copyToClipboard() {
    navigator.clipboard.writeText(fullSequence.value)
    toast.add({ severity: 'success', summary: 'Copied to clipboard', life: 2000 })
}
</script>

<template>
    <div>
        <div v-if="name" class="mb-2 text-lg font-semibold">
            <span>{{ name }}</span>
            <Button
                v-if="totalLength > 0"
                size="small"
                class="ml-2"
                severity="info"
                icon="pi pi-download"
                iconPos="right"
                label="FASTA"
                @click="downloadAsFasta"
            >
            </Button>
        </div>
        <div class="p-3 mb-5 rounded border surface-border surface-100 text-sm break-all">
            <span v-for="item of data" :class="item.type == selectedType ? 'text-orange-500' : ''">{{ item.sequence }}</span>
            <Button
                text
                icon="pi pi-copy"
                class="ml-2"
                @click="copyToClipboard"
            />
        </div>
        <MeterGroup :value="meterItems" :pt="{meters: { style: { height: '14px' } } }">
            <template #meter="{ value, class: meterClass, size }">
                <div
                    :class="[meterClass, 'relative cursor-pointer transition-opacity duration-150', hoveredType === value._original.type ? 'opacity-75' : 'opacity-100']"
                    :style="{ background: value.color, width: size }"
                    :title="value.label"
                    @mouseenter="hoveredType = value._original.type"
                    @mouseleave="hoveredType = null"
                    @click="toggleType(value._original.type)"
                >
                    <div v-if="selectedType === value._original.type"
                        class="absolute inset-x-0 top-0 h-1.5 bg-white/70"
                    />
                </div>
            </template>
            <template #label>
                <div class="flex flex-wrap gap-3 mt-2">
                    <div
                        v-for="entry in uniqueTypes"
                        :key="entry.type"
                        class="flex items-center gap-1.5 text-sm cursor-pointer select-none"
                        :class="hoveredType === entry.type ? 'opacity-75' : 'opacity-100'"
                        @mouseenter="hoveredType = entry.type"
                        @mouseleave="hoveredType = null"
                        @click="toggleType(entry.type)"
                    >
                        <span
                            class="inline-block w-3 h-3 rounded-sm shrink-0"
                            :style="{ background: entry.color }"
                        />
                        <span>{{ entry.type }}</span>
                    </div>
                </div>
            </template>
        </MeterGroup>
        <div v-if="selectedItems.length > 0" class="mt-4 flex flex-col gap-2">
            <div
                v-for="item in selectedItems"
                :key="item.label"
                class="p-3 rounded border surface-border surface-100 text-sm"
            >
                <div class="flex items-center gap-2 mb-2">
                    <span
                        class="inline-block w-3 h-3 rounded-sm shrink-0"
                        :style="{ background: _.get(computedColorMap, item.type) }"
                    />
                    <span class="font-semibold">{{ item.label }}</span>
                    <span class="text-color-secondary text-xs ml-auto">{{ item.sequence.length }} bp</span>
                </div>
                <code class="block font-mono break-all text-xs leading-relaxed">{{ item.sequence }}</code>
            </div>
        </div>

    </div>
</template>
