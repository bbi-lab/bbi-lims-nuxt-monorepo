<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const showExperimentValuesForm = ref(false)
const experiment = ref<{ name: string; pcrType: string; pcr2ExperimentMasterMixVolumes?: any; plate?: any } | undefined>()

const route = useRoute()
const router = useRouter()

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
    pcr2ExperimentMasterMixVolumes: {
        columns: {
            id: true,
            twoXKapaHifiReadyMix: true,
            tenUmForwardPrimer: true,
            tenUmReversePrimer: true,
            tenXSybrGreen: true,
            dnaAmount: true,
            total: true,
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
                                            pellet: {
                                                with: {
                                                    transfectTarget: {
                                                        columns: {},
                                                        with: {
                                                            target: {
                                                                columns: {
                                                                    id: true,
                                                                    name: true
                                                                },
                                                            },
                                                        }
                                                    }
                                                }
                                            }
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

const sampleStatsComputed: ComputedRef<Record<string, { sampleName: string; numberOfWells: number; pelletId: string | null }>> = computed(() => {
    if (experiment.value?.pcrType !== 'rna-preseq-2') {
        return {}
    }
    let sampleStats
    if (_.has(experiment.value, 'plate.wells')) {
        const wells = _.get(experiment.value, 'plate.wells')
        sampleStats = _.reduce(wells || [], (result, well: any) => {
            _.forEach(well.wellContents, (wellContent) => {
                const sample = wellContent.wellable
                if (sample?.id && (sample.dna?.pellet || sample.rna?.pellet)) {
                    if (!_.has(result, sample.id)) {
                        _.set(result, sample.id, {
                            sampleName: sample.dna?.pellet?.name || sample.rna?.pellet?.name || 'Unknown Sample',
                            numberOfWells: 0,
                            pelletId: sample.dna?.pellet?.id || sample.rna?.pellet?.id || null,
                        })
                    }
                    _.set(result, `${sample.id}.numberOfWells`, _.get(result, `${sample.id}.numberOfWells`, 0) + 1)
                }
            })
            return result
        }, {})
    }
    return sampleStats || {}
})

const targetStatsComputed: ComputedRef<Record<string, { targetName: string; numberOfWells: number }>> = computed(() => {
    if (experiment.value?.pcrType !== 'dna-preseq-2') {
        return {}
    }
    let targetStats
    if (_.has(experiment.value, 'plate.wells')) {
        const wells = _.get(experiment.value, 'plate.wells')
        targetStats = _.reduce(wells || [], (result, well: any) => {
            _.forEach(well.wellContents, (wellContent) => {
                const target = wellContent.wellable.dna?.pellet?.transfectTarget?.target
                if (target?.id) {
                    if (!_.has(result, target.id)) {
                        _.set(result, target.id, {
                            targetName: target.name || 'Unknown Target',
                            numberOfWells: 0,
                        })
                    }
                    _.set(result, `${target.id}.numberOfWells`, _.get(result, `${target.id}.numberOfWells`, 0) + 1)
                }
            })
            return result
        }, {})
    }
    return targetStats || {}
})

const calcsComputed: ComputedRef<Array<{
    sampleId: string;
    sampleName: string;
    numberOfWells: number;
    multimixMultiplier: string;
    twoXKapaHifiReadyMix: string;
    tenUmForwardPrimer: string;
    tenUmReversePrimer: string;
    tenXSybrGreen: string;
    dnaAmount: string;
    water: string;
    total: string;
}>> = computed(() => {
    // use targetStats for dna-preseq-2 and sampleStats for rna-preseq-2
    const stats = experiment.value?.pcrType == 'dna-preseq-2' ? targetStatsComputed.value : sampleStatsComputed.value
    const nameKey = experiment.value?.pcrType == 'dna-preseq-2' ? 'targetName' : 'sampleName'

    return _.map(stats, (value, key) => {
        const numberOfWells = _.get(value, 'numberOfWells', 0)
        const multimixMultiplier = numberOfWells * 1.125
        const totalVol = _.get(experiment.value, 'pcr2ExperimentMasterMixVolumes.total', 0) * multimixMultiplier
        const twoXKapaHifiReadyMix = _.get(experiment.value, 'pcr2ExperimentMasterMixVolumes.twoXKapaHifiReadyMix', 0) * multimixMultiplier
        const tenUmForwardPrimer = _.get(experiment.value, 'pcr2ExperimentMasterMixVolumes.tenUmForwardPrimer', 0) * multimixMultiplier
        const tenUmReversePrimer = _.get(experiment.value, 'pcr2ExperimentMasterMixVolumes.tenUmReversePrimer', 0) * multimixMultiplier
        const tenXSybrGreen = _.get(experiment.value, 'pcr2ExperimentMasterMixVolumes.tenXSybrGreen', 0) * multimixMultiplier
        const dnaAmount = experiment.value?.pcrType == 'dna-preseq-2' ? 0 : (dnaVolume.value ? dnaVolume.value * multimixMultiplier : null)

        return {
            sampleId: key,
            sampleName: _.get(value, nameKey, '??'),
            numberOfWells,
            multimixMultiplier: _.round(multimixMultiplier, 1).toFixed(1),
            twoXKapaHifiReadyMix: _.round(twoXKapaHifiReadyMix, 1).toFixed(1),
            tenUmForwardPrimer: _.round(tenUmForwardPrimer, 1).toFixed(1),
            tenUmReversePrimer: _.round(tenUmReversePrimer, 1).toFixed(1),
            tenXSybrGreen: _.round(tenXSybrGreen, 1).toFixed(1),
            dnaAmount: dnaAmount ? _.round(dnaAmount, 1).toFixed(1) : '-',
            water: _.isNumber(dnaAmount) ? _.round(totalVol - (twoXKapaHifiReadyMix + tenUmForwardPrimer + tenUmReversePrimer + tenXSybrGreen + dnaAmount), 1).toFixed(1) : '-',
            total: _.round(totalVol, 1).toFixed(1),
        }
    })
})

const refreshExperiment = async () => {
    experiment.value = await $fetch(`/api/pcr-experiments/${route.params.id}`, { query: { with: JSON.stringify(withClause) } })
    showExperimentValuesForm.value = false
}

const fieldConfigs: FormFieldConfigs = {
    twoXKapaHifiReadyMix: {
        label: '2X Kapa Hifi Ready Mix (μL)',
        inputType: 'number',
    },
    tenUmForwardPrimer: {
        label: '10uM Forward Primer (μL)',
        inputType: 'number',
    },
    tenUmReversePrimer: {
        label: '10uM Reverse Primer (μL)',
        inputType: 'number',
    },
    tenXSybrGreen: {
        label: '10X Sybr Green (μL)',
        inputType: 'number',
    },
    total: {
        label: 'Total Volume (μL)',
        inputType: 'number',
    },
}

const orderedCalcs = computed(() => _.orderBy(calcsComputed.value, ['sampleName'], ['asc']))

const dnaVolume = computed(() => {
    return experiment.value?.pcrType === 'rna-preseq-2' ? 2.5 : experiment.value?.pcrType === 'dna-preseq-2' ? 2.0 : null
})
</script>
<template>
    <h3 class="p-5">
        {{ experiment?.name }}
    </h3>
    <hr/>

    <div v-if="experiment" class="flex flex-row gap-4 m-5 space-x-4">
        <div>
            <span>
                <span class="text-xl font-bold mr-5">Master Mix Volumes</span>
                <Button
                    class="p-button-sm"
                    icon="pi pi-pencil"
                    v-tooltip="'Edit'"
                    @click="showExperimentValuesForm = true"
                />
            </span>
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
                        <td class="px-4 py-4">{{ experiment?.pcr2ExperimentMasterMixVolumes?.twoXKapaHifiReadyMix }} μL</td>
                    </tr>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">10uM Forward Primer</td>
                        <td class="px-4 py-4">{{ experiment.pcr2ExperimentMasterMixVolumes?.tenUmForwardPrimer }} μL</td>
                    </tr>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">10uM Reverse Primer</td>
                        <td class="px-4 py-4">{{ experiment.pcr2ExperimentMasterMixVolumes?.tenUmReversePrimer }} μL</td>
                    </tr>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">10X Sybr Green</td>
                        <td class="px-4 py-4">{{ experiment.pcr2ExperimentMasterMixVolumes?.tenXSybrGreen }} μL</td>
                    </tr>
                    <tr v-if="experiment.pcrType === 'rna-preseq-2'" class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">cDNA Volume</td>
                        <td class="px-4 py-4">{{ dnaVolume || '-' }} μL</td>
                    </tr>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">Total Volume</td>
                        <td class="px-4 py-4">{{ experiment.pcr2ExperimentMasterMixVolumes?.total }} μL</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div>
            <span>
                <span class="text-xl font-bold mr-5">{{ experiment.pcrType == 'dna-preseq-2' ? 'Targets' : 'Samples' }}</span>
                <Button
                    class="p-button-sm"
                    severity="info"
                    v-tooltip="'Plate Layout'"
                    @click="router.push(`/plate-layout/${experiment.plate?.plateType}/${experiment.plate?.id}`)"
                >
                    <template #icon>
                        <Icon name="ph:grid-nine-fill" class="m-1" />
                    </template>
                </Button>
            </span>
            <div>
                <DataTable :value="_.map(experiment.pcrType == 'dna-preseq-2'  ? targetStatsComputed : sampleStatsComputed, (value, key) => ({ ...value, sampleId: key }))" class="mt-3 text-sm">
                    <Column
                        :field="experiment.pcrType == 'dna-preseq-2' ? 'targetName' : 'sampleName'"
                        :header="experiment.pcrType == 'dna-preseq-2' ? 'Target' : 'Sample'">
                    </Column>
                    <Column field="numberOfWells" header="Number of Wells"></Column>
                </DataTable>
            </div>
        </div>
    </div>

    <!-- Calcs Grid -->
    <div>
        <span class="m-5 text-xl font-bold mb-5">Calculated volumes</span>
        <span class="italic">(Note: Values shown here are rounded to one decimal place. Underlying calculations use precise values.)</span>
    </div>
    <div v-if="experiment && calcsComputed.length" class="m-5 overflow-x-auto">
        <div
            class="calcs-grid mb-5 border bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-600 rounded text-sm grid"
            :style="`width: max-content; grid-template-columns: minmax(180px, max-content) repeat(${orderedCalcs.length}, minmax(120px, max-content))`"
        >
            <!-- Sample name row -->
            <div class="font-semibold">{{ experiment.pcrType == 'dna-preseq-2' ? 'Target' : 'Sample' }}</div>
            <div v-for="calc in orderedCalcs" class="font-semibold">{{ calc.sampleName }}</div>
            <!-- Number of wells row -->
            <div  class="font-semibold italic">Number of Wells (*1.125)</div>
            <div v-for="calc in orderedCalcs" class="italic">x{{ calc.multimixMultiplier }}</div>
            <!-- 2X Kapa row -->
            <div class="font-semibold border-t-2">2X Kapa Hifi Ready Mix (μL)</div>
            <div v-for="calc in orderedCalcs" class="border-t-2">{{ calc.twoXKapaHifiReadyMix }}</div>
            <!-- Forward primer row -->
            <div class="font-semibold">10uM Forward Primer (μL)</div>
            <div v-for="calc in orderedCalcs">{{ calc.tenUmForwardPrimer }}</div>
            <!-- Reverse primer row -->
            <div class="font-semibold">10uM Reverse Primer (μL)</div>
            <div v-for="calc in orderedCalcs">{{ calc.tenUmReversePrimer }}</div>
            <!-- 10X Sybr Green row -->
            <div class="font-semibold">10X Sybr Green (μL)</div>
            <div v-for="calc in orderedCalcs">{{ calc.tenXSybrGreen }}</div>
            <!-- cDNA amount row -->
            <div v-if="experiment.pcrType == 'rna-preseq-2'" class="font-semibold">cDNA (μL)</div>
            <div v-if="experiment.pcrType == 'rna-preseq-2'" v-for="calc in orderedCalcs">{{ calc.dnaAmount }}</div>
            <!-- Water row -->
            <div class="font-semibold">Water (μL)</div>
            <div v-for="calc in orderedCalcs">{{ calc.water }}</div>
            <!-- Total row -->
            <div class="font-semibold border-t-2">Total (μL)</div>
            <div v-for="calc in orderedCalcs" class="font-semibold border-t-2">{{ calc.total }}</div>
            <!-- DNA amount row -->
            <div v-if="experiment.pcrType == 'dna-preseq-2'" class="font-semibold border-t-2 italic">DNA (μL) per well</div>
            <div v-if="experiment.pcrType == 'dna-preseq-2'" class="border-t-2 italic" v-for="calc in orderedCalcs">{{ dnaVolume?.toFixed(1) }}</div>
        </div>
    </div>

    <Dialog
        :visible="showExperimentValuesForm"
        :modal="true"
        :closable="false"
        :style="{width: '350px'}"
        >
        <RecordsSmartForm
            select-url="/api/pcr-2-experiment-master-mix-volumes"
            :record-ids="[experiment?.pcr2ExperimentMasterMixVolumes?.id]"
            submit-url="/api/pcr-2-experiment-master-mix-volumes"
            submit-method="PUT"
            :zod-schema="schemas.pcr2ExperimentMasterMixVolumes.updateInExperiment"
            :field-configs="fieldConfigs"
            @cancel="showExperimentValuesForm = false"
            @record-update="refreshExperiment"
        />
    </Dialog>
</template>
<style scoped>
    /* Tailwind v4: @apply in a scoped style needs the theme context (custom surface-* utils + dark variant) */
    @reference '../../../../../base-layer/assets/tailwind.css';

    .calcs-grid > div {
        @apply px-4 py-2 border-b border-l border-surface-200 dark:border-surface-600;
        overflow: hidden;
        min-width: 0;
    }
</style>
