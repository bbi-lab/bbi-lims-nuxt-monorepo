<script setup lang="ts">
const config = useRuntimeConfig()
const { loggedIn } = useUserSession()

const groups = [
    {
        label: '',
        items: [
            { label: 'Projects',    icon: 'pi pi-briefcase',      path: '/projects',                              api: '/api/projects' },
            { label: 'Superblocks', iconName: 'fluent-mdl2:tiles', path: '/planning/superblocks',                 api: '/api/superblocks' },
            { label: 'Tiles',       icon: 'pi pi-objects-column',  path: '/planning/tiles',                       api: '/api/view-tiles-with-sequences' },
            ],
    },
    {
        label: 'Storage',
        items: [
            { label: 'Plates',      iconName: 'ph:grid-nine-fill', path: '/plates',                               api: '/api/plates' },
        ],
    },
    {
        label: 'Reagents',
        items: [
            { label: 'Retriever Primers', iconName: 'icon-park-outline:comb', path: '/oligos/primers/retriever-primers',  api: '/api/retriever-primers' },
            { label: 'Restriction Enzymes', iconName: 'mdi:molecule', path: '/reagents/restriction-enzymes', api: '/api/restriction-enzymes' },
        ],
    },
    {
        label: 'Reference',
        items: [
            { label: 'Genes',       iconName: 'mdi:dna',           path: '/genes',                                api: '/api/genes' },
            { label: 'Transcripts', iconName: 'mdi:zip-box-outline',          path: '/transcripts',               api: '/api/refseq-transcripts' },
        ],
    },
]

// undefined = loading, null = error/unsupported, number = count
const counts = ref<Record<string, number | null | undefined>>({});

onMounted(async () => {
    if (!loggedIn.value) return
    const allItems = groups.flatMap(g => g.items)
    allItems.forEach(item => { counts.value[item.api] = undefined })

    await Promise.allSettled(
        allItems.map(async item => {
            try {
                const data = await $fetch<{ count: number }>(`${item.api}/count`)
                counts.value[item.api] = data.count
            } catch {
                counts.value[item.api] = null
            }
        })
    )
})
</script>

<template>
    <div class="p-6">
        <div v-for="group in groups" :key="group.label" class="mb-8">
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <NuxtLink
                    v-for="item in group.items"
                    :key="item.path"
                    :to="item.path"
                    class="no-underline"
                >
                    <Card class="cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full select-none">
                        <template #content>
                            <div class="flex flex-col items-center gap-2 py-1">
                                <div class="text-primary text-3xl leading-none">
                                    <i v-if="item.icon" :class="item.icon" />
                                    <Icon v-else-if="item.iconName" :name="item.iconName" />
                                </div>
                                <span class="font-semibold text-center text-sm">{{ item.label }}</span>
                                <span class="text-2xl font-bold text-primary min-h-8 flex items-center">
                                    <ProgressSpinner v-if="counts[item.api] === undefined" class="size-6" />
                                    <span v-else-if="counts[item.api] === null" class="text-color-secondary text-base">—</span>
                                    <span v-else>{{ counts[item.api] }}</span>
                                </span>
                            </div>
                        </template>
                    </Card>
                </NuxtLink>
            </div>
            <hr />
        </div>
    </div>
</template>
