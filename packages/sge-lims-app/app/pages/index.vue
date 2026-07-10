<script setup lang="ts">
const { loggedIn } = useUserSession()

const groups = [
    {
        label: '',
        items: [
            { label: 'Projects',  icon: 'pi pi-fw pi-home',             path: '/projects',  api: '/api/projects' },
            { label: 'Cycles',    icon: 'pi pi-fw pi-spinner-dotted',   path: '/cycles',    api: '/api/cycles' },
            { label: 'Targets',   icon: 'pi pi-fw pi-bullseye',         path: '/targets',   api: '/api/targets' },
            { label: 'Genes',     iconName: 'mdi:dna',                  path: '/genes',     api: '/api/genes' },
            { label: 'Regions',   icon: 'pi pi-fw pi-map',              path: '/regions',   api: '/api/regions' },
        ],
    },
    {
        label: 'Plasmids',
        items: [
            { label: 'sgRNA Plasmids',       icon: 'pi pi-fw pi-spinner', path: '/sg-rna-plasmids',    api: '/api/sg-rna-plasmids' },
            { label: 'SNV Library Plasmids', icon: 'pi pi-fw pi-spinner', path: '/snv-lib-plasmids',   api: '/api/snv-lib-plasmids' },
            { label: 'HA pUC19 Plasmids',    icon: 'pi pi-fw pi-spinner', path: '/ha-puc-19-plasmids', api: '/api/ha-puc-19-plasmids' },
        ],
    },
    {
        label: 'Samples',
        items: [
            { label: 'Pellets', iconName: 'mdi:dots-triangle', path: '/pellets', api: '/api/pellets' },
            { label: 'DNA',     iconName: 'mdi:dna',      path: '/dna',     api: '/api/dna' },
            { label: 'RNA',     iconName: 'icon-park-outline:comb',      path: '/rna',     api: '/api/rna' },
        ],
    },
    {
        label: 'Oligos',
        items: [
            { label: 'sgRNA Oligos', iconName: 'fluent:molecule-16-filled', path: '/sg-rna-oligos', api: '/api/sg-rna-oligos' },
            { label: 'SGE Oligos',   iconName: 'fluent:molecule-16-filled', path: '/sge-oligos',    api: '/api/sge-oligos' },
            { label: 'Clonal HAs',   iconName: 'fluent:molecule-16-filled', path: '/clonal-has',    api: '/api/clonal-has' },
        ],
    },
    {
        label: 'HA Products',
        items: [
            { label: 'HA PCR',         iconName: 'fluent:molecule-16-filled', path: '/ha-pcr-products',         api: '/api/ha-pcr-products' },
            { label: 'HA pUC19 PCR',   iconName: 'fluent:molecule-16-filled', path: '/ha-puc-19-pcr-products',  api: '/api/ha-puc-19-pcr-products' },
            { label: 'HA pUC19 Gibson',iconName: 'fluent:molecule-16-filled', path: '/ha-puc-19-gibson-products', api: '/api/ha-puc-19-gibson-products' },
        ],
    },
    {
        label: 'SNVlib Products',
        items: [
            { label: 'AMP Products',        iconName: 'fluent:molecule-16-filled', path: '/snv-lib-amp-products',         api: '/api/snv-lib-amp-products' },
            { label: 'LIN Products',        iconName: 'fluent:molecule-16-filled', path: '/snv-lib-lin-products',         api: '/api/snv-lib-lin-products' },
            { label: 'Gibson Products',     iconName: 'fluent:molecule-16-filled', path: '/snv-lib-gibson-products',      api: '/api/view-snv-lib-gibson-products' },
            { label: 'Golden Gate Products',iconName: 'fluent:molecule-16-filled', path: '/snv-lib-golden-gate-products', api: '/api/snv-lib-golden-gate-products' },
        ],
    },
    {
        label: 'Primers',
        items: [
            { label: 'Amplification Primers',    iconName: 'icon-park-outline:comb', path: '/amplification-primers',      api: '/api/amplification-primers' },
            { label: 'Linearization Primers',    iconName: 'icon-park-outline:comb', path: '/linearization-primers',      api: '/api/linearization-primers' },
            { label: 'Homology Arm Primers',     iconName: 'icon-park-outline:comb', path: '/homology-arm-primers',       api: '/api/homology-arm-primers' },
            { label: 'HA pUC19 Primers',         iconName: 'icon-park-outline:comb', path: '/homology-arm-puc-19-primers',api: '/api/homology-arm-puc-19-primers' },
            { label: 'DNA PreSeq 1 Primers',     iconName: 'icon-park-outline:comb', path: '/preseq-1-primers',           api: '/api/preseq-1-primers' },
            { label: 'DNA PreSeq 2 Primers',     iconName: 'icon-park-outline:comb', path: '/preseq-2-primers',           api: '/api/preseq-2-primers' },
            { label: 'RNA RT Primers',           iconName: 'icon-park-outline:comb', path: '/rna-rt-primers',             api: '/api/rna-rt-primers' },
            { label: 'RNA PreSeq 1 Primers',     iconName: 'icon-park-outline:comb', path: '/rna-preseq-1-primers',       api: '/api/rna-preseq-1-primers' },
            { label: 'RNA PreSeq 2 Primers',     iconName: 'icon-park-outline:comb', path: '/rna-preseq-2-primers',       api: '/api/rna-preseq-2-primers' },
            { label: 'Index Primers',            iconName: 'icon-park-outline:comb', path: '/index-primers',              api: '/api/index-primers' },
        ],
    },
    {
        label: 'Storage',
        items: [
            { label: 'Plates', iconName: 'ph:grid-nine-fill', path: '/plates', api: '/api/plates' },
        ],
    },
    {
        label: 'Experiments',
        items: [
            { label: 'sgRNA Cloning Experiments',     iconName: 'icon-park-solid:experiment', path: '/sg-rna-cloning-experiments',  api: '/api/sg-rna-cloning-experiments' },
            { label: 'HA Cloning Experiments',        iconName: 'icon-park-solid:experiment', path: '/ha-cloning-experiments',      api: '/api/ha-cloning-experiments' },
            { label: 'SNV Lib Cloning Experiments',   iconName: 'icon-park-solid:experiment', path: '/snv-lib-cloning-experiments', api: '/api/snv-lib-cloning-experiments' },
            { label: 'Transfection Experiments',      iconName: 'icon-park-solid:experiment', path: '/transfect-experiments',       api: '/api/transfect-experiments' },
            { label: 'Extraction Experiments',        iconName: 'icon-park-solid:experiment', path: '/extraction-experiments',      api: '/api/extraction-experiments' },
            { label: 'PCR Experiments',               iconName: 'icon-park-solid:experiment', path: '/pcr-experiments',             api: '/api/pcr-experiments' },
        ],
    },
    {
        label: 'Reagents',
        items: [
            { label: 'Lots',         iconName: 'mdi:beaker-outline', path: '/lots',     api: '/api/lots' },
            { label: 'Reagent List', iconName: 'mdi:beaker-outline', path: '/reagents', api: '/api/reagents' },
        ],
    },
    {
        label: 'Sequencing',
        items: [
            { label: 'Sequencing Runs',  iconName: 'fluent:run-16-filled', path: '/sequencing-runs',   api: '/api/sequencing-runs' },
            { label: 'Internal Samples', iconName: 'fluent:run-16-filled', path: '/internal-samples',  api: '/api/sequencing-run-samples' },
            { label: 'External Samples', iconName: 'fluent:run-16-filled', path: '/external-samples',  api: '/api/external-samples' },
        ],
    },
]

// undefined = loading, null = error/unsupported, number = count
const counts = ref<Record<string, number | null | undefined>>({})

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
        <div v-for="group in groups" :key="group.label || '_top'" class="mb-8">
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
