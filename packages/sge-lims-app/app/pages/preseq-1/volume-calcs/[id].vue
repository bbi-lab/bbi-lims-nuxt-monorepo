<script setup lang="ts">
import _ from 'lodash'
import { schemas } from '#shared/db/zod/zodSchemas'

const showExperimentValuesForm = ref(false)
const experiment = ref<{ name: string; pcrType: string; pcr1ExperimentMasterMixVolumes?: any; plate?: any } | undefined>()
const sampleStats = ref<Record<string, { sampleName: string; numberOfWells: number; quant: number | null; pelletId: string | null }>>({})

const route = useRoute()
const router = useRouter()

const calcs = ref<{
    sampleId: string;
    sampleName: string;
    quant: number | null;
    numberOfWells: number;
    twoXKapaHifiReadyMix: string;
    tenUmForwardPrimer: string;
    tenUmReversePrimer: string;
    tenXSybrGreen: string;
    dnaVolume: string;
    water: string;
    total: string }[]>([])

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
    pcr1ExperimentMasterMixVolumes: {
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

    // calculate well contents per sample, keyed by sample id, value is an array of objects with the following shape:
    // {
    //     sampleName: string,
    //     numberOfWells: number,
    //     quant: number | null,
    //     pelletId: string | null,
    // }
    if (_.has(experiment.value, 'plate.wells')) {
        const wells = _.get(experiment.value, 'plate.wells')
        sampleStats.value = _.reduce(wells || [], (result, well: any) => {
            _.forEach(well.wellContents, (wellContent) => {
                const sample = wellContent.wellable
                if (sample?.id && (sample.dna?.pellet || sample.rna?.pellet)) {
                    if (!_.has(result, sample.id)) {
                        _.set(result, sample.id, {
                            sampleName: sample.dna?.pellet?.name || sample.rna?.pellet?.name || 'Unknown Sample',
                            numberOfWells: 0,
                            quant: experiment.value?.pcrType == 'dna-preseq-1' ? sample.dna?.concentration : experiment.value?.pcrType == 'rna-preseq-1' ? sample.rna?.concentration : null,
                            pelletId: sample.dna?.pellet?.id || sample.rna?.pellet?.id || null,
                        })
                    }
                    _.set(result, `${sample.id}.numberOfWells`, _.get(result, `${sample.id}.numberOfWells`, 0) + 1)
                }
            })
            return result
        }, {})
    }

    calcs.value = _.map(sampleStats.value, (value, key) => {
        const quant = experiment.value?.pcrType == 'dna-preseq-1' ? _.get(value, 'quant', null) : null
        const numberOfWells = _.get(value, 'numberOfWells', 0)
        const totalVol = _.get(experiment.value, 'pcr1ExperimentMasterMixVolumes.total', 0) * numberOfWells
        const twoXKapaHifiReadyMix = _.get(experiment.value, 'pcr1ExperimentMasterMixVolumes.twoXKapaHifiReadyMix', 0) * numberOfWells
        const tenUmForwardPrimer = _.get(experiment.value, 'pcr1ExperimentMasterMixVolumes.tenUmForwardPrimer', 0) * numberOfWells
        const tenUmReversePrimer = _.get(experiment.value, 'pcr1ExperimentMasterMixVolumes.tenUmReversePrimer', 0) * numberOfWells
        const tenXSybrGreen = _.get(experiment.value, 'pcr1ExperimentMasterMixVolumes.tenXSybrGreen', 0) * numberOfWells
        // for RNA preseq-1, cDNA volume is alwasy 2.5uL per well, for DNA preseq-1, calculate DNA volume based on quant and number of wells, if quant is not available, set DNA volume to null
        const dnaVolume = experiment.value?.pcrType == 'rna-preseq-1' ? 2.5 * numberOfWells : quant ? _.get(experiment.value, 'pcr1ExperimentMasterMixVolumes.dnaAmount', 0) * numberOfWells * 1/quant : null

        return {
            sampleId: key,
            sampleName: _.get(value, 'sampleName', '??'),
            quant: quant,
            numberOfWells: numberOfWells,
            twoXKapaHifiReadyMix: _.round(twoXKapaHifiReadyMix, 1).toFixed(1),
            tenUmForwardPrimer: _.round(tenUmForwardPrimer, 1).toFixed(1),
            tenUmReversePrimer: _.round(tenUmReversePrimer, 1).toFixed(1),
            tenXSybrGreen: _.round(tenXSybrGreen, 1).toFixed(1),
            dnaVolume: dnaVolume ? _.round(dnaVolume, 1).toFixed(1) : '-',
            water: dnaVolume ? _.round(totalVol - (twoXKapaHifiReadyMix + tenUmForwardPrimer + tenUmReversePrimer + tenXSybrGreen + dnaVolume), 1).toFixed(1) : '-',
            total: _.round(totalVol, 1).toFixed(1),
        }
    })

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
    dnaAmount: {
        label: 'DNA Amount (ng)',
        inputType: 'number',
        display: experiment.value?.pcrType === 'dna-preseq-1',
    },
    total: {
        label: 'Total Volume (μL)',
        inputType: 'number',
    },
}

const orderedCalcs = computed(() => _.orderBy(calcs.value, ['sampleName'], ['asc']))

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
                        <td class="px-4 py-4">{{ experiment.pcr1ExperimentMasterMixVolumes?.twoXKapaHifiReadyMix }} μL</td>
                    </tr>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">10uM Forward Primer</td>
                        <td class="px-4 py-4">{{ experiment.pcr1ExperimentMasterMixVolumes?.tenUmForwardPrimer }} μL</td>
                    </tr>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">10uM Reverse Primer</td>
                        <td class="px-4 py-4">{{ experiment.pcr1ExperimentMasterMixVolumes?.tenUmReversePrimer }} μL</td>
                    </tr>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">10X Sybr Green</td>
                        <td class="px-4 py-4">{{ experiment.pcr1ExperimentMasterMixVolumes?.tenXSybrGreen }} μL</td>
                    </tr>
                    <tr v-if="experiment.pcrType === 'dna-preseq-1'" class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">DNA Amount</td>
                        <td class="px-4 py-4">{{ experiment.pcr1ExperimentMasterMixVolumes?.dnaAmount }} ng</td>
                    </tr>
                    <tr v-if="experiment.pcrType === 'rna-preseq-1'" class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">cDNA Volume</td>
                        <td class="px-4 py-4">2.5 μL</td>
                    </tr>
                    <tr class="border-b border-surface-200 dark:border-surface-600">
                        <td class="px-4 py-4">Total Volume</td>
                        <td class="px-4 py-4">{{ experiment.pcr1ExperimentMasterMixVolumes?.total }} μL</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div>
            <span>
                <span class="text-xl font-bold mr-5">Samples</span>
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
                <DataTable :value="_.map(sampleStats, (value, key) => ({ ...value, sampleId: key }))" class="mt-3 text-sm">
                    <Column field="sampleName" header="Sample Name"></Column>
                    <Column field="numberOfWells" header="Number of Wells"></Column>
                    <Column v-if="experiment.pcrType === 'dna-preseq-1'" field="quant" header="Quant (ng/μL)">
                        <template #body="slotProps">
                            {{ slotProps.data.quant || '-'}}
                            <Button
                                class="p-button-sm"
                                icon="pi pi-pencil"
                                severity="info"
                                text
                                @click="router.push(`/pellets?id=${slotProps.data.pelletId}`)"
                            />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <!-- Calcs Grid -->
    <div class="m-5 text-xl font-bold mb-5">Calculated volumes</div>
    <div v-if="experiment && calcs.length" class="m-5 overflow-x-auto">
        <div
            class="calcs-grid mb-5 border bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-600 rounded text-sm grid"
            :style="`width: max-content; grid-template-columns: minmax(180px, max-content) repeat(${orderedCalcs.length}, minmax(120px, max-content))`"
        >
            <!-- Sample name row -->
            <div class="font-semibold">Sample</div>
            <div v-for="calc in orderedCalcs" class="font-semibold">{{ calc.sampleName }}</div>
            <!-- Quant row -->
            <div class="font-semibold italic">Quant (ng/μL)</div>
            <div v-for="calc in orderedCalcs" class="italic">{{ experiment?.pcrType == 'rna-preseq-1' ? 'up to 200 ng/uL' :calc.quant ?? '-' }}</div>
            <!-- Number of wells row -->
            <div  class="font-semibold italic">Number of Wells</div>
            <div v-for="calc in orderedCalcs" class="italic">x{{ calc.numberOfWells }}</div>
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
            <!-- DNA amount row -->
            <div class="font-semibold">{{ experiment.pcrType == 'rna-preseq-1' ? 'cDNA' : 'DNA' }} (μL)</div>
            <div v-for="calc in orderedCalcs">{{ calc.dnaVolume }}</div>
            <!-- Water row -->
            <div class="font-semibold">Water (μL)</div>
            <div v-for="calc in orderedCalcs">{{ calc.water }}</div>
            <!-- Total row -->
            <div class="font-semibold border-t-2">Total (μL)</div>
            <div v-for="calc in orderedCalcs" class="font-semibold border-t-2">{{ calc.total }}</div>
        </div>
    </div>

    <Dialog
        :visible="showExperimentValuesForm"
        :modal="true"
        :closable="false"
        :style="{width: '350px'}"
        >
        <RecordsSmartForm
            select-url="/api/pcr-1-experiment-master-mix-volumes"
            :record-ids="[experiment?.pcr1ExperimentMasterMixVolumes?.id]"
            submit-url="/api/pcr-1-experiment-master-mix-volumes"
            submit-method="PUT"
            :zod-schema="schemas.pcr1ExperimentMasterMixVolumes.updateInExperiment"
            :field-configs="fieldConfigs"
            @cancel="showExperimentValuesForm = false"
            @record-update="refreshExperiment"
        />
    </Dialog>
</template>
<style scoped>
    .calcs-grid > div {
        @apply px-4 py-2 border-b border-l border-surface-200 dark:border-surface-600;
        overflow: hidden;
        min-width: 0;
    }
</style>
