<script setup lang="ts">
import _ from 'lodash'
import { wellCoordinateToChar } from '../../../shared/lib/plate-diagram'

const route = useRoute()
const plateLayout = usePlateLayout()
const plateWithWellSpecs = ref()

onMounted(async() => {
    plateLayout.setPlateId(route.params.id as string)
    plateLayout.wellContentsDisplayConfig.value = {
        colorBy: [],
        selectionTableRecordIdPaths: ['pellet.id'],
        tooltip: (well: any) => {
            const wellCoordinate = `${wellCoordinateToChar(well.y)}${well.x}`
            return wellCoordinate
        },
    }
    loadPlate()
})

const loadPlate = async () => {
    await plateLayout.loadPlate()

    plateWithWellSpecs.value = {
        ...plateLayout.plateWithWellContents.value,
        wells: _.values(plateLayout.wellSpecs.value),
    }
}
</script>
<template>
    <div class="flex justify-center mt-4">
        <PlateDiagram
            v-if="plateWithWellSpecs"
            :ref="plateLayout.setPlateDiagramRef"
            v-model="plateWithWellSpecs"
            :plate-type="plateWithWellSpecs.plateType"
            :size-x="plateWithWellSpecs.sizeX"
            :size-y="plateWithWellSpecs.sizeY"
            @well-range-selected="plateLayout.wellRangeSelected"
            @well-selection-cleared="plateLayout.wellSelectionCleared"
            @all-wells-selected="plateLayout.selectedAllWells"
            @well-contents-updated="plateLayout.updatedWellContents" >
            <template #header>
                {{ plateWithWellSpecs.name }}
            </template>
        </PlateDiagram>
    </div>
</template>
