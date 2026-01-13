<script setup lang="ts">
import { makePlateDiagram } from '../../shared/lib/plate-diagram'
import _ from 'lodash'
import { Icon } from '#components'

const MdiRotateRightVariant = h(Icon, { name: 'mdi:rotate-right-variant', class: 'm-1' })
const MdiRotateLeftVariant = h(Icon, { name: 'mdi:rotate-left-variant', class: 'm-1' })
const PhSelectionSlash = h(Icon, { name: 'ph:selection-slash', class: 'm-1' })
const PhSelectionAllFill = h(Icon, { name: 'ph:selection-all-fill', class: 'm-1' })

export type PlateWithPlateDiagramWells = Plate & {
    wells: PlateDiagramWell[]
}
let plateDiagram:PlateDiagram | null = null
const plateDiagramDiv = ref()
const modelValue = defineModel<PlateWithPlateDiagramWells>()

const props = defineProps({
    showSidebar: {
        type: Boolean,
        default: true,
    },
    showSelectAllButton: {
        type: Boolean,
        default: true,
    },
    showClearSelectionButton: {
        type: Boolean,
        default: true,
    },
    showExportButton: {
        type: Boolean,
    },
    plateType: {
        type: String as PropType<PlateType>,
        required: true,
    },
    wellSpecs: {
        type: Object,
    },
    sizeX: {
        type: Number,
        default: 12,
    },
    sizeY: {
        type: Number,
        default: 8,
    },
})

const rotated = ref(false)

const plateDiagramClasses = computed(() => {
    return rotated.value ? "z-10 mt-[calc(25%)] rotate-90 w-80" : "z-10 w-80"
})

const emit = defineEmits([
    'well-range-selected',
    'well-selection-cleared',
    'all-wells-selected',
    'well-contents-updated',
    'did-click-export-plate-layout',
])

function wellRangeSelected(wells: PlateDiagramWell[]) {
    emit('well-range-selected', wells)
}

function wellSelectionCleared() {
    if (plateDiagram) {
        plateDiagram.clearSelection()
        emit('well-selection-cleared')
    }
}

function allWellsSelected() {
    if (plateDiagram) {
        plateDiagram?.selectAllWells()
        emit('all-wells-selected', modelValue.value?.wells)
    }
}

const renderOrRefreshChart = () => {
    if (!plateDiagram) {
        plateDiagram = makePlateDiagram(props.plateType, props.sizeX, props.sizeY)
                .render(plateDiagramDiv.value)
                .wellRangeSelected(wellRangeSelected) as PlateDiagram
    }
    if (plateDiagram && modelValue.value) {
        plateDiagram
            .wells(modelValue.value.wells)
            .refresh()
        wellSelectionCleared()
    }
}
watch(modelValue, (newValue, oldValue) => {
    if (!_.isEqual(newValue, oldValue)) {
        renderOrRefreshChart()
    }
}, { deep: true })

onMounted(async() => {
    renderOrRefreshChart()
})

const updateWells = (newValues: PlateDiagramWell[], oldValues: PlateDiagramWell[]) => {
    if (plateDiagram) {
        plateDiagram.updateWellContents(newValues)
        emit('well-contents-updated', newValues, oldValues)
    }
}

defineExpose({
    updateWells,
})
</script>

<template>
    <div class="w-fit">
        <div class="flex justify-center">
            <slot name="header" />
        </div>
        <div class="flex">
            <div ref="plateDiagramDiv" :class="plateDiagramClasses"></div>
            <div v-if="showSidebar" class="flex flex-col z-0">
                <Button v-if="showSelectAllButton" v-tooltip="{value: 'Select all wells', showDelay: 500}" @click="allWellsSelected" severity="secondary">
                    <template #icon>
                        <PhSelectionAllFill />
                    </template>
                </Button>
                <Button v-if="showClearSelectionButton" v-tooltip="{value: 'Clear selection', showDelay: 500}" @click="wellSelectionCleared" severity="secondary">
                    <template #icon>
                        <PhSelectionSlash />
                    </template>
                </Button>
                <Button v-tooltip="{value: 'Rotate', showDelay: 500}" @click="rotated = !rotated" severity="secondary">
                    <template #icon>
                        <span class="pi pi-fw p-button-icon inline-block">
                            <component :is="rotated ? MdiRotateLeftVariant : MdiRotateRightVariant" />
                        </span>
                    </template>
                </Button>
                <Button
                    v-if="showExportButton"
                    v-tooltip="{value: 'Export', showDelay: 500}"
                    @click="emit('did-click-export-plate-layout')"
                    severity="secondary"
                    icon="pi pi-file-export"
                />
                <slot name="button1" />
                <slot name="button2" />
                <slot name="button3" />
            </div>
        </div>
    </div>
</template>

<style>
.tooltip:empty {
    display: none;
}
</style>
