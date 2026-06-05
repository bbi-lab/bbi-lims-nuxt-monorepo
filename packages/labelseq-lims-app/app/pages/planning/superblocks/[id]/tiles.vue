<script setup lang="ts">

const route = useRoute()
const router = useRouter()

const superblockId = route.params.id as string

const { data: superblock } = await useFetch<Record<string, any>>(`/api/superblocks/${superblockId}`)

const { data: tiles } = await useFetch<Record<string, any>[]>('/api/view-tiles-with-sequences', {
    query: {
        where: { '==': [{ var: 'superblockId' }, superblockId] },
        order: [{ tileStart: 'asc' }],
    },
})

const tilesWithItems = computed(() =>
    (tiles.value ?? []).map(tile => ({
        tile,
        items: buildOligoItems(tile) as OligoItem[],
    })),
)

const sharedColorMap = computed(() =>
    buildSharedOligoColorMap(tilesWithItems.value.map(t => t.items)),
)
</script>

<template>
    <div class="p-5">
        <div class="flex items-center gap-3 mb-6">
            <Button
                icon="pi pi-arrow-left"
                text
                severity="secondary"
                v-tooltip="'Back to Superblocks'"
                @click="router.push('/planning/superblocks')"
            />
            <div class="text-2xl m-0">
                {{ superblock?.name ?? 'Superblock' }} Tiles
            </div>
        </div>

        <div v-if="tilesWithItems.length === 0" class="text-center text-color-secondary p-10">
            No tiles found for this superblock.
        </div>

        <div class="flex flex-col gap-5">
            <Panel
                v-for="{ tile, items } in tilesWithItems"
                :key="tile.id"
            >
                <template #header>
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-lg">{{ tile.tileName }}</span>
                        <span class="text-color-secondary text-sm">
                            pos {{ tile.tileStart }}–{{ tile.tileEnd }}
                        </span>
                        <Tag v-if="tile.superblockFirst" value="First" severity="info" class="text-xs" />
                        <Tag v-if="tile.superblockLast" value="Last" severity="success" class="text-xs" />
                    </div>
                </template>
                <OligoViewer
                    :data="items"
                    :colorMap="sharedColorMap"
                    :name="tile.tileName"
                />
            </Panel>
        </div>
    </div>
</template>
