<script setup lang="ts">
import _ from 'lodash'
import { wellCoordinateToChar } from 'lims-layer/shared/lib/plate-diagram'

const route = useRoute()
type PcrEntry = Record<string, {plateName: string, plateType: string, plateTypeLabel: string, wells: {x: number, y: number}[]}>
const pellet = ref()
const dnaPcrEntries = ref<PcrEntry>({})
const rnaPcrEntries = ref<PcrEntry>({})

onMounted(async () => {
    pellet.value = await $fetch(`/api/pellets/${route.params.id}`, {
        query: {
            with: JSON.stringify({
                harvestedBy: {
                    columns: {
                        name: true
                    },
                },
                transfectTarget: {
                    columns: {},
                    with: {
                        target: {
                            columns: {
                                name: true
                            },
                            with: {
                                region: {
                                    columns: {
                                        name: true
                                    },
                                    with: {
                                        gene: {
                                            columns: {
                                                symbol: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        experiment: {
                            columns: {
                                id: true,
                            },
                            with: {
                                cycle: true,
                            },
                        }
                    }
                },
                dna: {
                    with: {
                        extractionExperiment: {
                            with: {
                                technician: {
                                    columns: {
                                        name: true
                                    }
                                }
                            },
                        },
                        wellable: {
                            with: {
                                wellContents: {
                                    with: {
                                        well: {
                                            columns: {
                                                id: true,
                                                x: true,
                                                y: true,
                                            },
                                            with: {
                                                plate: {
                                                    columns: {
                                                        id: true,
                                                        name: true,
                                                        plateType: true,
                                                    },
                                                    with: {
                                                        plateTypeRef: {
                                                            columns: {
                                                                label: true,
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                    },
                                },
                            },
                        },
                    }
                },
                rna: {
                    with: {
                        extractionExperiment: {
                            with: {
                                technician: {
                                    columns: {
                                        name: true
                                    }
                                }
                            },
                        },
                        wellable: {
                            with: {
                                wellContents: {
                                    with: {
                                        well: {
                                            columns: {
                                                id: true,
                                                x: true,
                                                y: true,
                                            },
                                            with: {
                                                plate: {
                                                    columns: {
                                                        id: true,
                                                        name: true,
                                                        plateType: true,
                                                    },
                                                    with: {
                                                        plateTypeRef: {
                                                            columns: {
                                                                label: true,
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                    },
                                },
                            },
                        },
                    }
                },
                wellable: {
                    with: {
                        wellContents: {
                            with: {
                                well: {
                                    columns: {
                                        id: true,
                                        x: true,
                                        y: true,
                                    },
                                    with: {
                                        plate: {
                                            columns: {
                                                id: true,
                                                name: true,
                                                plateType: true,
                                            }
                                        }
                                    }
                                },
                            },
                        },
                    },
                },
            })
        }
    })

    dnaPcrEntries.value = _.reduce(pellet.value.dna?.wellContents || [], (acc: PcrEntry, wellContent) => {
        const plateId = wellContent.well.plate.id
        if (!_.has(acc, plateId)) {
            _.set(acc, plateId, {
                plateName: wellContent.well.plate.name,
                plateType: wellContent.well.plate.plateType,
                plateTypeLabel: wellContent.well.plate.plateTypeRef?.label,
                wells: [_.pick(wellContent.well, ['x', 'y'])]
            })
        } else {
            acc[plateId]!.wells.push(_.pick(wellContent.well, ['x', 'y']))
        }
        return acc as PcrEntry
    }, {})

    rnaPcrEntries.value = _.reduce(pellet.value.rna?.wellContents || [], (acc: PcrEntry, wellContent) => {
        const plateId = wellContent.well.plate.id
        if (!_.has(acc, plateId)) {
            _.set(acc, plateId, {
                plateName: wellContent.well.plate.name,
                plateType: wellContent.well.plate.plateType,
                plateTypeLabel: wellContent.well.plate.plateTypeRef?.label,
                wells: [_.pick(wellContent.well, ['x', 'y'])]
            })
        } else {
            acc[plateId]!.wells.push(_.pick(wellContent.well, ['x', 'y']))
        }
        return acc as PcrEntry
    }, {})

    _.set(pellet.value, 'dna.yield', calculateYield(pellet.value.dna?.concentration, pellet.value.dna?.volume))
    _.set(pellet.value, 'rna.yield', calculateYield(pellet.value.rna?.concentration, pellet.value.rna?.volume))
})
</script>
<template>
    <div class="text-xl font-bold m-4">Sample Summary</div>
    <hr class="m-2">
    <div v-if="pellet" class="flex flex-wrap m-4 gap-x-24 gap-y-12">
        <div class="space-x-4 space-y-2">
            <div class="text-lg font-bold">Pellet:</div>
            <div>
                <strong>Name:</strong> {{ pellet.name }}
            </div>
            <div>
                <strong>Transfect Target:</strong>
                {{ pellet.transfectTarget?.target?.name}}
            </div>
            <div>
                <strong>Transfections:</strong> {{ pellet.transfections.join(', ') }}
            </div>
            <div>
                <strong>Harvested On:</strong> {{ pellet.harvestedOn ? `${new Date(pellet.harvestedOn).toLocaleDateString()} (Day ${pellet.harvestDay})` : '' }}
            </div>
            <div>
                <strong>Harvested By:</strong> {{ pellet.harvestedBy?.name }}
            </div>
            <div>
                <strong>Cycle:</strong> {{ pellet.transfectTarget?.experiment?.cycle?.name }}
            </div>
            <div>
                <strong>Is backup:</strong> {{ pellet.isBackup ? 'Yes' : 'No' }}
            </div>
            <div>
                <strong>Is current:</strong> {{ pellet.isCurrent ? 'Yes' : 'No' }}
            </div>
            <div>
                <strong>D3 confluencey:</strong> {{ pellet.d3Confluency }}
            </div>
            <div>
                <strong>% passaged:</strong> {{ pellet.pctPassaged }}
            </div>
            <div>
                <strong>% harvested:</strong> {{ pellet.pctHarvested }}
            </div>
            <div>
                <strong>Storage location:</strong>
            </div>
        </div>
        <div class="space-x-4 space-y-2">
            <div class="text-lg font-bold">DNA:</div>
            <div>
                <strong>Extracted:</strong> {{ pellet.dna?.id ? 'Yes' : 'No' }}
            </div>
            <template v-if="pellet.dna?.id">
                <div>
                    <strong>Extraction Experiment:</strong> {{ pellet.dna.extractionExperiment?.name }}
                </div>
                <div>
                    <strong>Extracted on:</strong> {{ pellet.dna.extractionExperiment?.extractedOn ? new Date(pellet.dna.extractionExperiment.extractedOn).toLocaleDateString() : '' }}
                </div>
                <div>
                    <strong>Extracted by:</strong> {{ pellet.dna.extractionExperiment?.technician?.name }}
                </div>
                <div>
                    <strong>Concentration:</strong> {{ pellet.dna.concentration ? `${pellet.dna.concentration} ng/µL` : '' }}
                </div>
                <div>
                    <strong>Volume:</strong> {{ pellet.dna.volume ? `${pellet.dna.volume} µL` : '' }}
                </div>
                <div>
                    <strong>Yield:</strong> {{ pellet.dna.yield ? `${pellet.dna.yield} µg` : '' }}
                </div>
                <div>
                    <strong>Protocol:</strong> {{ pellet.dna.protocol }}
                </div>
                <div>
                    <strong>Notes:</strong> {{ pellet.dna.notes }}
                </div>
                <div v-if="!_.isEmpty(pellet.dna?.wellContents)">
                    <div class="text-lg font-bold">PCR:</div>
                    <hr>
                    <div v-for="pcrEntry of _.sortBy(_.values(dnaPcrEntries), 'plateType')">
                        <div>
                            <strong>Plate:</strong> {{ pcrEntry.plateName }}
                        </div>
                        <div>
                            <strong>Plate type:</strong> {{ pcrEntry.plateTypeLabel }}
                        </div>
                        <div>
                            <strong>Wells:</strong> {{ pcrEntry.wells.map((well) => `${wellCoordinateToChar(well.y)}${well.x}`).join(', ') }}
                        </div>
                        <hr>
                    </div>
                </div>
            </template>
        </div>
        <div class="space-x-4 space-y-2">
            <div class="text-lg font-bold">RNA:</div>
            <div>
                <strong>Extracted:</strong> {{ pellet.rna?.id ? 'Yes' : 'No' }}
            </div>
            <template v-if="pellet.rna?.id">
                <div>
                    <strong>Extraction Experiment:</strong> {{ pellet.rna.extractionExperiment?.name }}
                </div>
                <div>
                    <strong>Extracted on:</strong> {{ pellet.rna.extractionExperiment?.extractedOn ? new Date(pellet.rna.extractionExperiment.extractedOn).toLocaleDateString() : '' }}
                </div>
                <div>
                    <strong>Extracted by:</strong> {{ pellet.rna.extractionExperiment?.technician?.name }}
                </div>
                <div>
                    <strong>Concentration:</strong> {{ pellet.rna.concentration ? `${pellet.rna.concentration} ng/µL` : '' }}
                </div>
                <div>
                    <strong>Volume:</strong> {{ pellet.rna.volume ? `${pellet.rna.volume} µL` : '' }}
                </div>
                <div>
                    <strong>Yield:</strong> {{ pellet.rna.yield ? `${pellet.rna.yield} µg` : '' }}
                </div>
                <div>
                    <strong>Protocol:</strong> {{ pellet.rna.protocol }}
                </div>
                <div>
                    <strong>Notes:</strong> {{ pellet.rna.notes }}
                </div>
                <div v-if="!_.isEmpty(pellet.rna?.wellContents)">
                    <div class="text-lg font-bold">PCR:</div>
                    <hr>
                    <div v-for="pcrEntry of _.sortBy(_.values(rnaPcrEntries), 'plateType')">
                        <div>
                            <strong>Plate:</strong> {{ pcrEntry.plateName }}
                        </div>
                        <div>
                            <strong>Plate type:</strong> {{ pcrEntry.plateTypeLabel }}
                        </div>
                        <div>
                            <strong>Wells:</strong> {{ pcrEntry.wells.map((well) => `${wellCoordinateToChar(well.y)}${well.x}`).join(', ') }}
                        </div>
                        <hr>
                    </div>
                </div>
            </template>
        </div>
    </div>
    <br/>
</template>
