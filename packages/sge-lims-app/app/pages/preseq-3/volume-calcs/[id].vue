<script setup lang="ts">
import _ from 'lodash'

const experiment = ref<{ name: string; pcrType: string; plate?: any } | undefined>()

const { printView } = usePrintView()

const route = useRoute()
const router = useRouter()

const masterMixVolumes =  {
    twoXKapaHifiReadyMix: 12.5,
    tenXSybrGreen: 1.25,
    water: 6.25,
    totalVolume: 20,
}

const calcsComputed = computed(() => {
    const sampleCount = wellsWithSamples.value.length || 0
    return {
        twoXKapaHifiReadyMix: masterMixVolumes.twoXKapaHifiReadyMix * sampleCount,
        tenXSybrGreen: masterMixVolumes.tenXSybrGreen * sampleCount,
        water: masterMixVolumes.water * sampleCount,
        totalVolume: masterMixVolumes.totalVolume * sampleCount,
    }
})

const withClause = {
    pcrExperimentTargets: {
        with: {
            transfectTarget: {
                with: {
                    target: {
                        columns: {
                            name: true
                        },
                    },
                    experiment: {
                        columns: {},
                        with: {
                            cycle: {
                                columns: {
                                    name: true
                                }
                            }
                        }
                    }
                },
            }
        }
    },
    plate: {
        with: {
            wells: {
                with: {
                    wellContents: {
                        with: {
                            wellable: {
                                with: {
                                    dna: {
                                        with: {
                                            pellet: true
                                        },
                                    },
                                    rna: {
                                        with: {
                                            pellet: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
onMounted(async() => {
    await refreshExperiment()
})

const refreshExperiment = async () => {
    experiment.value = await $fetch(`/api/pcr-experiments/${route.params.id}`, { query: { with: JSON.stringify(withClause) } })
}

const wellsWithSamples = computed(() => {
    return experiment.value?.plate?.wells.filter((well: any) => well.wellContents.length && well.wellContents[0].wellable.dna || well.wellContents[0].wellable.rna) ?? []
})

// const orderedCalcs = computed(() => _.orderBy(calcs.value, ['sampleName'], ['asc']))

</script>
<template>
    <div class="flex flex-row items-center gap-5 p-5">
        <h3 class="my-0">
            {{ experiment?.name }}
        </h3>
        <Button
            class="p-button-sm no-print"
            label="Print view"
            icon="pi pi-print"
            severity="secondary"
            @click="printView"
        />
    </div>
    <hr class="no-print" />

    <div v-if="experiment" class="flex flex-row gap-4 m-5 space-x-4 print-avoid-break">
        <div>
            <table class="mt-3 w-full text-sm border-collapse bg-surface-0 dark:bg-surface-900">
                <thead>
                    <tr class="text-left border-b border-surface-200 dark:border-surface-600">
                        <th class="px-4 py-4 font-semibold">Component</th>
                        <th class="px-4 py-4 font-semibold">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">2X Kapa Hifi Ready Mix</td>
                        <td class="px-4 py-4">{{masterMixVolumes.twoXKapaHifiReadyMix}} μL</td>
                    </tr>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">10X Sybr Green</td>
                        <td class="px-4 py-4">{{masterMixVolumes.tenXSybrGreen}} μL</td>
                    </tr>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">Water</td>
                        <td class="px-4 py-4">{{masterMixVolumes.water}} μL</td>
                    </tr>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">Total Volume</td>
                        <td class="px-4 py-4">{{masterMixVolumes.totalVolume}} μL</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-5">
            <span>
                <span class="text-xl font-bold mr-5">Well count: {{ wellsWithSamples.length }}</span>
                <Button
                    class="p-button-sm no-print"
                    severity="info"
                    v-tooltip="'Plate Layout'"
                    @click="router.push(`/plate-layout/${experiment.plate?.plateType}/${experiment.plate?.id}`)"
                >
                    <template #icon>
                        <Icon name="ph:grid-nine-fill" class="m-1" />
                    </template>
                </Button>
            </span>
        </div>
    </div>

    <!-- print:mb-0 on the last block, so its bottom margin can't spill onto a blank page -->
    <div v-if="experiment" class="flex flex-row gap-4 m-5 space-x-4 print-avoid-break print:mb-0">
        <div>
            <table class="calcs-table">
                <thead>
                    <tr>
                        <th class="font-bold">Component</th>
                        <th class="font-bold">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-t-2">
                        <td class="font-bold italic">Number of wells</td>
                        <td class="italic">x{{wellsWithSamples.length}}</td>
                    </tr>
                    <tr class="border-t-2">
                        <td class="font-bold">2X Kapa Hifi Ready Mix (μL)</td>
                        <td>{{calcsComputed.twoXKapaHifiReadyMix}}</td>
                    </tr>
                    <tr>
                        <td class="font-bold">10X Sybr Green (μL)</td>
                        <td>{{calcsComputed.tenXSybrGreen}}</td>
                    </tr>
                    <tr>
                        <td class="font-bold">Water (μL)</td>
                        <td>{{calcsComputed.water}}</td>
                    </tr>
                    <tr>
                        <td class="font-bold">Total Volume (μL)</td>
                        <td class="font-bold">{{calcsComputed.totalVolume}}</td>
                    </tr>
                    <tr class="border-t-2">
                        <td class="font-bold italic">10uM_F R (μL) per well</td>
                        <td class="italic">3.0</td>
                    </tr>
                    <tr class="border-t-2">
                        <td class="font-bold italic">AMPured Rxn_2 (μL) per well</td>
                        <td class="italic">2.0</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

</template>
<style scoped>
    /* Tailwind v4: @apply in a scoped style needs the theme context (custom surface-* utils + dark variant) */
    @reference '../../../../../base-layer/assets/tailwind.css';

    .calcs-table {
        @apply mt-3 w-full text-sm border-collapse bg-surface-0 dark:bg-surface-900;
    }
    .calcs-table > tbody > tr, .calcs-table > thead > tr {
        @apply text-left border-b border-surface-200 dark:border-surface-600;
    }
    .calcs-table > tbody > tr > td, .calcs-table > thead > tr > th {
        @apply text-left px-4 py-2 border-r border-surface-200 dark:border-surface-600;
    }
</style>
