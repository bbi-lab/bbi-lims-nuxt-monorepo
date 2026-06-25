<script setup lang="ts">
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { schemas } from '#shared/db/zod/zodSchemas'

const crudTable = useCrudTable()
const route = useRoute()
const {user} = useUserSession()

const showAddDialog = ref(false)
const addFormTableName: Ref<string | undefined> = ref()
const addFormHeader: Ref<string | undefined> = ref()
const addFormFieldConfigs: Ref<FormFieldConfigs> = ref({})
const addFormReadOnlyValues = ref<Record<string, any>>({})
const addFormInitialValues = ref<Record<string, any>>({})

const tableKey = ref<string>(uuidv4())
const whereClauses = ref()
const readonlyValues = ref<Record<string, any>>({})

const currentHaCloningExperimentId = ref<string>()

watch(() => route.query, async (newValue, oldValue) => {
    whereClauses.value = queryParamsToJsonLogic(newValue)
    readonlyValues.value = getSimpleQueryParams(newValue)
    tableKey.value = uuidv4()
}, { immediate: true })

const updateCurrentHaCloningExperiment = (data: any) => {
    currentHaCloningExperimentId.value = data?.id

    // update related AutoCompleter searchWhereClauses
    const targetIds = _.map(data?.haCloningExperimentTargets, 'targetId')
    _.set(haPcrProductFieldConfigs, 'haPrimerForwardId.autoCompleter.searchWhereClause', {"and": [
        {"==": [{"var": "sequenceType"}, "forward"]},
        {"all" : [ {"var":"targets"}, {"in":[{"var":"targetId"}, targetIds]} ]},
    ]})
    _.set(haPcrProductFieldConfigs, 'haPrimerReverseId.autoCompleter.searchWhereClause', {"and": [
        {"==": [{"var": "sequenceType"}, "reverse"]},
        {"all" : [ {"var":"targets"}, {"in":[{"var":"targetId"}, targetIds]} ]},
    ]})

    const haPcrProduct = _.get(data, 'haPcrProducts.0')
    if (haPcrProduct) {
        _.set(haPuc19PcrProductFieldConfigs, 'haPuc19PrimerForwardId.autoCompleter.searchWhereClause', {"==": [{"var": "homologyArmPrimerId"}, haPcrProduct?.haPrimerForwardId]})
        _.set(haPuc19PcrProductFieldConfigs, 'haPuc19PrimerReverseId.autoCompleter.searchWhereClause', {"==": [{"var": "homologyArmPrimerId"}, haPcrProduct?.haPrimerReverseId]})
    }
}

const columnDefs: ColumnDefinitions = {
    name: {
        index: 1,
    },
    haCloningExperimentTargets: {
        header: 'Targets',
        format: (data: any) => {
            return _.map(data.haCloningExperimentTargets, 'target.name')
        },
        path: 'haCloningExperimentTargets.displayValue'
    },
    notes: {
        display: false
    },
    haPcrProducts: {
        header: 'HA PCR Product',
        type: 'element',
        element: (data: any) => {
            const haPcrProduct = _.get(data, 'haPcrProducts.0')
            const href = haPcrProduct?.id ? `/ha-pcr-products?id=${haPcrProduct?.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${haPcrProduct.name}</a>` : '<a href="#" class="p-button p-button-outlined p-button-info">Add</a>'
        },
        elementClick: (data: any) => {
            if (_.isEmpty(data.haPcrProducts)) {
                addFormReadOnlyValues.value = {
                    name: _.get(data, 'name'),
                    haCloningExperimentId: _.get(data, 'id'),
                }
                addFormInitialValues.value = {
                    performedById: _.get(user, 'value.id'),
                    performedOn: new Date(),
                }
                addFormTableName.value = 'ha-pcr-products'
                addFormHeader.value = 'Add HA PCR Product'
                addFormFieldConfigs.value = haPcrProductFieldConfigs
                updateCurrentHaCloningExperiment(data)
                showAddDialog.value = true
            }
        },
        exportValue: (x: any) => {
            return _.get(x, 'haPcrProducts.0.name')
        },
    },
    haPuc19PcrProducts: {
        header: 'HA pUC19 PCR Product',
        type: 'element',
        element: (data: any) => {
            const haPuc19PcrProduct = _.get(data, 'haPcrProducts.0.haPuc19PcrProducts.0')
            const href = haPuc19PcrProduct?.id ? `/ha-puc-19-pcr-products?id=${haPuc19PcrProduct?.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${haPuc19PcrProduct.name}</a>` :
                 _.get(data, 'haPcrProducts.0.id') ? '<a href="#" class="p-button p-button-outlined p-button-info">Add</a>' : null
        },
        elementClick: (data: any) => {
            if (_.isEmpty(_.get(data, 'haPcrProducts.0.haPuc19PcrProducts'))) {
                addFormReadOnlyValues.value = {
                    name: `${_.get(data, 'haPcrProducts.0.name')}_pUC19_PCR`,
                    haPcrProductId: _.get(data, 'haPcrProducts.0.id'),
                }
                addFormInitialValues.value = {
                    cleanedById: _.get(user, 'id'),
                    cleanedOn: new Date(),
                }
                addFormTableName.value = 'ha-puc-19-pcr-products'
                addFormHeader.value = 'Add HA pUC19 PCR Product'
                addFormFieldConfigs.value = haPuc19PcrProductFieldConfigs
                updateCurrentHaCloningExperiment(data)
                showAddDialog.value = true
            }
        },
        exportValue: (x: any) => {
            return _.get(x, 'haPcrProducts.0.haPuc19PcrProducts.0.name')
        },
    },
    haPuc19GibsonProducts: {
        header: 'HA pUC19 Gibson Product',
        type: 'element',
        element: (data: any) => {
            const haPuc19GibsonProduct = _.get(data, 'haPcrProducts.0.haPuc19PcrProducts.0.haPuc19GibsonProducts.0')
            const href = haPuc19GibsonProduct?.id ? `/ha-puc-19-gibson-products?id=${haPuc19GibsonProduct?.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${haPuc19GibsonProduct.name}</a>` :
                 _.get(data, 'haPcrProducts.0.haPuc19PcrProducts.0.id') ? '<a href="#" class="p-button p-button-outlined p-button-info">Add</a>' : null
        },
        elementClick: (data: any) => {
            if (_.isEmpty(_.get(data, 'haPcrProducts.0.haPuc19PcrProducts.0.haPuc19GibsonProducts'))) {
                addFormReadOnlyValues.value = {
                    name: `${_.get(data, 'haPcrProducts.0.name')}_pUC19_Gibson`,
                    haPuc19PcrProductId: _.get(data, 'haPcrProducts.0.haPuc19PcrProducts.0.id'),
                }
                addFormInitialValues.value = {
                    preppedOn: new Date(),
                    preppedById: _.get(user.value, 'id'),
                    puc19VectorAmount: 50,
                }
                addFormTableName.value = 'ha-puc-19-gibson-products'
                addFormHeader.value = 'Add HA pUC19 Gibson Product'
                addFormFieldConfigs.value = haPuc19GibsonProductFieldConfigs
                updateCurrentHaCloningExperiment(data)
                showAddDialog.value = true
            }
        },
        exportValue: (x: any) => {
            return _.get(x, 'haPcrProducts.0.haPuc19PcrProducts.0.haPuc19GibsonProducts.0.name')
        },
    },
    haPuc19Plasmids: {
        header: 'HA pUC19 Plasmid',
        type: 'element',
        element: (data: any) => {
            const haPuc19Plasmid = _.get(data, 'haPcrProducts.0.haPuc19PcrProducts.0.haPuc19GibsonProducts.0.haPuc19Plasmids.0')
            const href = haPuc19Plasmid?.id ? `/ha-puc-19-plasmids?id=${haPuc19Plasmid?.id}` : null
            return href ? `<a href="${href}" class="text-blue-500 hover:underline">${haPuc19Plasmid.name}</a>` :
                 _.get(data, 'haPcrProducts.0.haPuc19PcrProducts.0.haPuc19GibsonProducts.0.id') ? '<a href="#" class="p-button p-button-outlined p-button-info">Add</a>' : null
        },
        elementClick: (data: any) => {
            if (_.isEmpty(_.get(data, 'haPcrProducts.0.haPuc19PcrProducts.0.haPuc19GibsonProducts.0.haPuc19Plasmids'))) {
                addFormReadOnlyValues.value = {
                    name: `${_.get(data, 'haPcrProducts.0.name')}_pUC19_plasmid`,
                    haPuc19GibsonProductId: _.get(data, 'haPcrProducts.0.haPuc19PcrProducts.0.haPuc19GibsonProducts.0.id'),
                }
                addFormInitialValues.value = {
                    transformedOn: new Date(),
                    transformedById: _.get(user.value, 'id'),
                    eColiStellarVolume: 20,
                }
                addFormTableName.value = 'ha-puc-19-plasmids'
                addFormHeader.value = 'Add HA pUC19 Plasmid'
                addFormFieldConfigs.value = haPuc19PlasmidFieldConfigs
                updateCurrentHaCloningExperiment(data)
                showAddDialog.value = true
            }
        },
        exportValue: (x: any) => {
            return _.get(x, 'haPcrProducts.0.haPuc19PcrProducts.0.haPuc19GibsonProducts.0.haPuc19Plasmids.0.name')
        },
    }
}

const didAddChildRecord = () => {
    crudTable.tableRef.value.addOrRefreshRecordIds([currentHaCloningExperimentId.value])
    hideAddDialog()
}
const hideAddDialog = () => {
    showAddDialog.value = false
    updateCurrentHaCloningExperiment(null)
}

const fieldConfigs: FormFieldConfigs = {
    name: {
        props: {
            defaultValue: '_HA',
            onFocus: async (event: any) => {
                if (_.endsWith(event.target?._value, '_HA')) {
                    if (event.target.setSelectionRange) {
                        setTimeout(() => {
                            const pos = event.target._value.length - 3
                             event.target.setSelectionRange(pos, pos)
                        }, 0)
                    }
                }
            },
        },
    },
    haCloningExperimentTargets: {
        label: 'Targets',
        inputArray: {
            canAdd: false,
            canDelete: false,
            fieldConfigs: {
                targetId: {
                    label: 'Target',
                    autoCompleter: {
                        searchBaseUrl: '/api/targets',
                        searchFields: ['region.gene.symbol', 'region.name', 'name'],
                        valueField: 'id',
                        inputClass: 'w-64',
                        displayFormat: (x: any) => {
                            return x.name ?? `${x.region?.gene?.symbol}: ${x.region?.name}`
                        },
                        searchWithClause: {region: {columns: {name: true}, with: {gene: {columns: {symbol:true}}}}},
                    },
                },
            },
        },
    },
}

const withClause = {
    haCloningExperimentTargets: {
        with: {
            target: true,
        }
    },
    haPcrProducts: {
        with: {
            haPuc19PcrProducts: {
                with: {
                    haPuc19GibsonProducts: {
                        with: {
                            haPuc19Plasmids: true,
                        },
                    },
                },
            },
        },
    },
}

const haPcrProductFieldConfigs: FormFieldConfigs = {
    haCloningExperimentId: {
        label: 'HA Cloning Experiment',
        autoCompleter: {
            searchBaseUrl: '/api/ha-cloning-experiments',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    haPrimerForwardId: {
        label: 'HA Primer Forward',
        autoCompleter: {
            searchBaseUrl: '/api/homology-arm-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
            searchWithClause: {targets: true},
            inputClass: (data: any) => {
                return data?.record?.archived ? 'line-through' : ''
            },
        },
    },
    haPrimerReverseId: {
        label: 'HA Primer Reverse',
        autoCompleter: {
            searchBaseUrl: '/api/homology-arm-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
            searchWithClause: {targets: true},
            inputClass: (data: any) => {
                return data?.record?.archived ? 'line-through' : ''
            },
        },
    },
    wtHap1DnaConcentration: {
        label: 'WT HAP1 DNA Concentration (ng/µL)',
    },
    temperatureChosen: {
        label: 'Temperature Chosen (°C)',
    },
    performedById: {
        label: 'Performed By',
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
}

const haPuc19PcrProductFieldConfigs: FormFieldConfigs = {
    haPcrProductId: {
        label: 'HA PCR Product',
        autoCompleter: {
            searchBaseUrl: '/api/ha-pcr-products',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    haPuc19PrimerForwardId: {
        label: 'HA pUC19 Primer Forward',
        autoCompleter: {
            searchBaseUrl: '/api/homology-arm-puc-19-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
            searchWithClause: {homologyArmPrimer: true},
            inputClass: (data: any) => {
                return data?.record?.archived ? 'line-through' : ''
            },
        },
    },
    haPuc19PrimerReverseId: {
        label: 'HA pUC19 Primer Reverse',
        autoCompleter: {
            searchBaseUrl: '/api/homology-arm-puc-19-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
            searchWithClause: {homologyArmPrimer: true},
            inputClass: (data: any) => {
                return data?.record?.archived ? 'line-through' : ''
            },
        },
    },
    temperatureUsed: {
        label: 'Temperature Used (°C)',
    },
    cleanedById: {
        label: 'Cleaned By',
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    quant: {
        label: 'Quant (ng/µL)',
    },
}

const haPuc19GibsonProductFieldConfigs: FormFieldConfigs = {
    haPuc19PcrProductId: {
        label: 'HA pUC19 PCR Product',
        autoCompleter: {
            searchBaseUrl: '/api/ha-puc-19-pcr-products',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    preppedById: {
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        }
    },
    puc19VectorConcentration: {
        label: 'pUC19 Vector Concentration (ng/µL)',
    },
    puc19VectorAmount: {
        label: 'pUC19 Vector Amount (ng)',
        subtext: 'Vector Size (bp): 2649',
    },
    quant: {
        label: 'Quant (ng/µL)',
    },
    totalReactionVolume: {
        label: 'Total Reaction Volume (µL)',
        defaultValue: 10,
    },
}

const haPuc19PlasmidFieldConfigs: FormFieldConfigs = {
    haPuc19GibsonProductId: {
        label: 'HA pUC19 Gibson Product',
        autoCompleter: {
            searchBaseUrl: '/api/ha-puc-19-gibson-products',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    eColiStellarVolume: {
        label: 'E. coli Stellar Volume (µL)',
        defaultValue: 20,
    },
    transformedById: {
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        }
    },
    preppedById: {
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        }
    },
    colonyPickedById: {
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        }
    },
}

// Compute the zodSchema for the add dialog form based on the current table name
const addFormZodSchema = computed(() => {
    switch (addFormTableName.value) {
        case 'ha-pcr-products': return schemas.haPcrProducts.insert
        case 'ha-puc-19-pcr-products': return schemas.haPuc19PcrProducts.insert
        case 'ha-puc-19-gibson-products': return schemas.haPuc19GibsonProducts.insert
        case 'ha-puc-19-plasmids': return schemas.haPuc19Plasmids.insert
        default: return undefined
    }
})
</script>
<template>
    <Splitter class="h-full overflow-y-hidden">
        <SplitterPanel :size="50">
            <SmartTable
                :key="tableKey"
                :ref="crudTable.setTableRef"
                table-name="ha-cloning-experiments"
                :zodSchema="schemas.haCloningExperiments.select"
                title="Homology Arm Cloning"
                :with-clause="withClause"
                :where="whereClauses"
                :column-defs="columnDefs"
                sort-field="startedOn"
                :sort-order="-1"
                :selection-disabled="crudTable.state.showAddForm || crudTable.state.showEditForm"
                @clicked-record-edit="crudTable.didClickRecordEdit"
                @clicked-record-add="crudTable.didClickRecordAdd"
            />
        </SplitterPanel>
        <SplitterPanel v-if="crudTable.state.showAddForm || crudTable.state.showEditForm">
            <RecordsSmartForm
                v-if="crudTable.state.showAddForm"
                submitUrl="/api/ha-cloning-experiments"
                submitMethod="POST"
                :zodSchema="schemas.haCloningExperiments.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/ha-cloning-experiments"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/ha-cloning-experiments"
                submitMethod="PUT"
                :zodSchema="schemas.haCloningExperiments.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
                :with-clause="{haCloningExperimentTargets: true}"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelEditForm"
                @record-update="crudTable.didUpdateRecord"
                @record-delete="crudTable.didDeleteRecord"
            />
        </SplitterPanel>
    </Splitter>
    <Dialog v-model:visible="showAddDialog" modal :header="addFormHeader" :style="{ width: 'auto' }" :closable="false">
        <RecordsSmartForm
            v-if="addFormTableName && addFormZodSchema"
            :submitUrl="`/api/${addFormTableName}`"
            submitMethod="POST"
            :zodSchema="addFormZodSchema"
            :readonlyValues="addFormReadOnlyValues"
            :fieldConfigs="addFormFieldConfigs"
            :initialValues="addFormInitialValues"
            @cancel="hideAddDialog"
            @record-add="didAddChildRecord"
        />
    </Dialog>
</template>
