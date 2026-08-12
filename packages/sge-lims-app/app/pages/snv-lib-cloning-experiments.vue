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

const currentSnvLibCloningExperimentId = ref<string>()

watch(() => route.query, async (newValue, oldValue) => {
    if (!_.isEqual(newValue, oldValue)) {
        whereClauses.value = queryParamsToJsonLogic(newValue)
        readonlyValues.value = getSimpleQueryParams(newValue)
        tableKey.value = uuidv4()
    }
}, { immediate: true })

const updateCurrentSnvLibCloningExperiment = (data: any) => {
    currentSnvLibCloningExperimentId.value = data?.id

    // update related AutoCompleter searchWhereClauses
    _.set(ampProductFieldConfigs, 'ampPrimerForwardId.autoCompleter.searchWhereClause', {"and": [
        {"==": [{"var": "sequenceType"}, "forward"]},
        {"==" : [ {"var":"targetId"}, data?.targetId ]},
        {"==" : [ {"var":"cloningMethod"}, data?.cloningStrategy ]},
    ]})
    _.set(ampProductFieldConfigs, 'ampPrimerReverseId.autoCompleter.searchWhereClause', {"and": [
        {"==": [{"var": "sequenceType"}, "reverse"]},
        {"==" : [ {"var":"targetId"}, data?.targetId ]},
        {"==" : [ {"var":"cloningMethod"}, data?.cloningStrategy ]},
    ]})
    _.set(ampProductFieldConfigs, 'sgeOligoId.autoCompleter.searchWhereClause',
        {"==" : [ {"var":"targetId"}, data?.targetId ]})

    _.set(linProductFieldConfigs, 'linPrimerForwardId.autoCompleter.searchWhereClause', {"and": [
        {"==": [{"var": "sequenceType"}, "forward"]},
        {"==" : [ {"var":"targetId"}, data?.targetId ]},
    ]})
    _.set(linProductFieldConfigs, 'linPrimerReverseId.autoCompleter.searchWhereClause', {"and": [
        {"==": [{"var": "sequenceType"}, "reverse"]},
        {"==" : [ {"var":"targetId"}, data?.targetId ]},
    ]})

    // limit the haPuc19Plasmid options to those associated with the current target via haCloningExperimentTargets
    _.set(linProductFieldConfigs, 'haPuc19PlasmidId.autoCompleter.searchWhereClause', {"some":[{"var": "haPuc19GibsonProduct.haPuc19PcrProduct.haPcrProduct.haCloningExperiment.haCloningExperimentTargets"}, {"==": [{"var": "targetId"}, data?.targetId]}]})
}

const columnDefs: ColumnDefinitions = {
    snvLibGoldenGateProducts: { display: false },
    snvLibLinProducts: { display: false },
    snvLibGibsonProducts: { display: false },
    name: {
        index: 0,
    },
    targetId: { display: false },
    notes: { display: false },
    target: {
        path: 'target.name',
        index: 1,
    },
    cloningStrategy: {
        index: 2,
    },
    startedOn: {
        index: 3,
        type: 'date',
    },
    endedOn: {
        index: 4,
        type: 'date',
    },
    snvLibAmpProducts: {
        header: 'AMP Product',
        type: 'element',
        index: 5,
        element: (data: any) => {
            const ampProduct = _.get(data, 'snvLibAmpProducts.0')
            return ampProduct?.id
                ? recordStatusLink(ampProduct.status, ampProduct.name, `/snv-lib-amp-products?id=${ampProduct.id}`)
                : '<a href="#" class="p-button p-button-outlined p-button-info">Add</a>'
        },
        elementClick: (data: any) => {
            if (_.isEmpty(data.snvLibAmpProducts)) {
                addFormReadOnlyValues.value = {
                    name: `${_.replace(data.name, /_SNVlib/gi , '')}_AMP`,
                    snvLibCloningExperimentId: _.get(data, 'id'),
                }
                addFormInitialValues.value = {
                    cleanedById: _.get(user, 'value.id'),
                    cleanedOn: new Date(),
                }
                addFormTableName.value = 'snv-lib-amp-products'
                addFormHeader.value = 'Add AMP Product'
                addFormFieldConfigs.value = ampProductFieldConfigs
                updateCurrentSnvLibCloningExperiment(data)
                showAddDialog.value = true
            }
        },
        exportValue: (x: any) => {
            return _.get(x, 'snvLibAmpProducts.0.name')
        },
    },
    backbone: {
        type: 'element',
        index: 6,
        element: (data: any) => {
            const addButton = `<a href="#" class="p-button p-button-outlined p-button-info">${data?.cloningStrategy == 'Gibson' ? 'Add' : 'Select'}</a>`
            if (data?.cloningStrategy == 'Gibson') {
                const product = _.get(data, 'snvLibLinProducts.0')
                return product?.id
                    ? recordStatusLink(product.status, product.name, `/snv-lib-lin-products?id=${product.id}`)
                    : addButton
            } else if (data?.cloningStrategy == 'Golden Gate') {
                // clonal HAs have no status column, so this one stays a plain link
                const product = _.get(data, 'clonalHa')
                return product?.id
                    ? `<a href="/clonal-has?id=${product.id}" class="text-blue-500 hover:underline">${product.name}</a>`
                    : addButton
            }
            return addButton
        },
        elementClick: (data: any) => {
            if (data?.cloningStrategy == 'Gibson' && _.isEmpty(data.snvLibLinProducts)) {
                addFormReadOnlyValues.value = {
                    name: `${_.replace(data.name, /_SNVlib/gi , '')}_Gibson`,
                    snvLibCloningExperimentId: _.get(data, 'id'),
                }
                addFormInitialValues.value = {
                    dpn1DigestById: _.get(user, 'value.id'),
                    dpn1DigestOn: new Date(),
                }
                addFormTableName.value = 'snv-lib-lin-products'
                addFormHeader.value = 'Add LIN Product'
                addFormFieldConfigs.value = linProductFieldConfigs
            } else if (data?.cloningStrategy == 'Golden Gate' && _.isEmpty(data.clonalHaId)) {
                crudTable.didClickRecordEdit(data)
                return
            } else {
                return
            }
            updateCurrentSnvLibCloningExperiment(data)
            showAddDialog.value = true
        },
        exportValue: (x: any) => {
            return _.get(x, 'snvLibLinProducts.0.name')
        },
    },
    assembledDna: {
        header: 'Assembled DNA',
        type: 'element',
        index: 7,
        element: (data: any) => {
            const addButton = '<a href="#" class="p-button p-button-outlined p-button-info">Add</a>'
            if (data?.cloningStrategy == 'Gibson') {
                const product = _.get(data, 'snvLibGibsonProducts.0')
                return product?.id
                    ? recordStatusLink(product.status, product.name, `/snv-lib-gibson-products?id=${product.id}`)
                    : addButton
            } else if (data?.cloningStrategy == 'Golden Gate') {
                const product = _.get(data, 'snvLibGoldenGateProducts.0')
                return product?.id
                    ? recordStatusLink(product.status, product.name, `/snv-lib-golden-gate-products?id=${product.id}`)
                    : addButton
            }
            return addButton
        },
        elementClick: (data: any) => {
            if (data?.cloningStrategy == 'Gibson' && _.isEmpty(data.snvLibGibsonProducts)) {
                addFormReadOnlyValues.value = {
                    name: `${_.replace(data.name, /_SNVlib/gi , '')}_Gibson`,
                    snvLibCloningExperimentId: _.get(data, 'id'),
                }
                addFormInitialValues.value = {
                    gibsonById: _.get(user, 'value.id'),
                    gibsonOn: new Date(),
                }
                addFormTableName.value = 'snv-lib-gibson-products'
                addFormHeader.value = 'Add Gibson Product'
                addFormFieldConfigs.value = gibsonProductFieldConfigs
            } else if (data?.cloningStrategy == 'Golden Gate' && _.isEmpty(data.snvLibGoldenGateProducts)) {
                addFormReadOnlyValues.value = {
                    name: `${_.replace(data.name, /_SNVlib/gi , '')}_GoldenGate`,
                    snvLibCloningExperimentId: _.get(data, 'id'),
                    clonalHaId: _.get(data, 'clonalHaId'),
                    snvLibAmpProductId: _.get(data, 'snvLibAmpProducts.0.id'),
                }
                addFormInitialValues.value = {
                    goldenGateBy: _.get(user, 'value.id'),
                    goldenGateOn: new Date(),
                }
                addFormTableName.value = 'snv-lib-golden-gate-products'
                addFormHeader.value = 'Add Golden Gate Product'
                addFormFieldConfigs.value = goldenGateProductFieldConfigs
            } else {
                return
            }

            updateCurrentSnvLibCloningExperiment(data)
            showAddDialog.value = true
        },
        exportValue: (x: any) => {
            if (x?.cloningStrategy == 'Gibson') {
                return _.get(x, 'snvLibGibsonProducts.0.name')
            } else if (x?.cloningStrategy == 'Golden Gate') {
                return _.get(x, 'snvLibGoldenGateProducts.0.name')
            }
            return null
        },
    },
    snvLibPlasmids: {
        header: 'Plasmids',
        type: 'element',
        index: 8,
        element: (data: any) => {
            const plasmid = _.get(data, 'snvLibPlasmids.0')
            return plasmid?.id
                ? recordStatusLink(plasmid.status, plasmid.name, `/snv-lib-plasmids?id=${plasmid.id}`)
                : '<a href="#" class="p-button p-button-outlined p-button-info">Add</a>'
        },
        elementClick: (data: any) => {
            if (_.isEmpty(data.snvLibPlasmids)) {
                addFormReadOnlyValues.value = {
                    name: data.name,
                    snvLibCloningExperimentId: _.get(data, 'id'),
                    targetId: _.get(data, 'targetId'),
                }
                addFormTableName.value = 'snv-lib-plasmids'
                addFormHeader.value = 'Add SNVlib Plasmid'
                addFormFieldConfigs.value = plasmidFieldConfigs
                updateCurrentSnvLibCloningExperiment(data)
                showAddDialog.value = true
            }
        },
        exportValue: (x: any) => {
            return _.get(x, 'snvLibPlasmids.0.name')
        },
    },
    clonalHaId: { display: false },
}
const didAddChildRecord = () => {
    crudTable.tableRef.value.addOrRefreshRecordIds([currentSnvLibCloningExperimentId.value])
    hideAddDialog()
}
const hideAddDialog = () => {
    showAddDialog.value = false
    updateCurrentSnvLibCloningExperiment(null)
}

const fieldConfigs: FormFieldConfigs = {
    name: {
        defaultValue: '_SNVlib',
        events: {
            focus: () => async (event: any) => {
                if (_.endsWith(event.target?._value, '_SNVlib')) {
                    if (event.target.setSelectionRange) {
                        setTimeout(() => {
                            const pos = event.target._value.length - 7
                            event.target.setSelectionRange(pos, pos)
                        }, 0)
                    }
                }
            },
        },
    },
    targetId: {
        label: 'Target',
        autoCompleter: {
            searchBaseUrl: '/api/targets',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    clonalHaId: {
        label: 'Clonal HA',
        autoCompleter: {
            searchBaseUrl: '/api/clonal-has',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
        display: (data: any) => {
            return data?.cloningStrategy === 'Golden Gate'
        },
    },
}
const withClause = {
    target: true,
    clonalHa: true,
    snvLibAmpProducts: true,
    snvLibLinProducts: true,
    snvLibGibsonProducts: true,
    snvLibPlasmids: true,
    snvLibGoldenGateProducts: true,
}
const ampProductFieldConfigs: FormFieldConfigs = {
    snvLibCloningExperimentId: {
        label: 'SNV Library Cloning Experiment',
        autoCompleter: {
            searchBaseUrl: '/api/snv-lib-cloning-experiments',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    twistLotId: {
        label: 'Twist Lot',
        autoCompleter: {
            searchBaseUrl: '/api/lots',
            searchFields: ['lotNumber'],
            valueField: 'id',
            displayFields: ['lotNumber'],
            dropdown: true,
            searchWithClause: {reagent: true},
            searchWhereClause: {"==": [{"toLower": {"var": "reagent.name"}}, "twist"]},
        },
    },
    ampPrimerForwardId: {
        label: 'AMP Primer Forward',
        autoCompleter: {
            searchBaseUrl: '/api/amplification-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
            searchWithClause: {target: true},
            inputClass: (data: any) => {
                return data?.record?.archived ? 'line-through' : ''
            },
        },
    },
    ampPrimerReverseId: {
        label: 'AMP Primer Reverse',
        autoCompleter: {
            searchBaseUrl: '/api/amplification-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
            searchWithClause: {target: true},
            inputClass: (data: any) => {
                return data?.record?.archived ? 'line-through' : ''
            },
        },
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
    cleanedOn: {
        dateType: 'date',
    },
    quant: {
        label: 'Quant (ng/µL)',
    },
    sgeOligoId: {
        label: 'SGE Oligo',
        autoCompleter: {
            searchBaseUrl: '/api/sge-oligos',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
}

const linProductFieldConfigs: FormFieldConfigs = {
    snvLibCloningExperimentId: {
        label: 'SNV Library Cloning Experiment',
        autoCompleter: {
            searchBaseUrl: '/api/snv-lib-cloning-experiments',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    linPrimerForwardId: {
        label: 'LIN Primer Forward',
        autoCompleter: {
            searchBaseUrl: '/api/linearization-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
            searchWithClause: {target: true},
            inputClass: (data: any) => {
                return data?.record?.archived ? 'line-through' : ''
            },
        },
    },
    linPrimerReverseId: {
        label: 'LIN Primer Reverse',
        autoCompleter: {
            searchBaseUrl: '/api/linearization-primers',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
            searchWithClause: {target: true},
            inputClass: (data: any) => {
                return data?.record?.archived ? 'line-through' : ''
            },
        },
    },
    haPuc19PlasmidId: {
        label: 'HA pUC19 Plasmid',
        autoCompleter: {
            searchBaseUrl: '/api/ha-puc-19-plasmids',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
            searchWithClause: {
                haPuc19GibsonProduct: {
                    columns: {},
                    with: {
                        haPuc19PcrProduct: {
                            columns: {},
                            with: {
                                haPcrProduct: {
                                    columns: {},
                                    with: {
                                        haCloningExperiment: {
                                            columns: {},
                                            with: {
                                                haCloningExperimentTargets: {
                                                    columns: { targetId: true }
                                                }
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    dpn1DigestById: {
        label: 'DpnI Digest By',
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    dpn1DigestOn: {
        label: 'DpnI Digest On',
        dateType: 'date',
    },
    gelExtractedById: {
        label: 'Gel Extracted By',
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    gelExtractedOn: {
        dateType: 'date',
    },
    quant: {
        label: 'Quant (ng/µL)',
    },
}
const gibsonProductFieldConfigs: FormFieldConfigs = {
    snvLibCloningExperimentId: {
        label: 'SNV Library Cloning Experiment',
        autoCompleter: {
            searchBaseUrl: '/api/snv-lib-cloning-experiments',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    linProductVectorAmount: {
        label: 'LIN Product Vector Amount (ng)',
        defaultValue: 50,
    },
    gibsonById: {
        label: 'Gibson By',
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    transformedById: {
        label: 'Transformed By',
        autoCompleter: {
            searchBaseUrl: '/api/users',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
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
    preppedById: {
        label: 'Prepped By',
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
    ngsChecked: {
        label: 'NGS Checked',
    },
    passedQc: {
        label: 'Passed QC',
    },
    totalReactionVolume: {
        label: 'Total Reaction Volume (µL)',
        defaultValue: 10,
    },
}
const plasmidFieldConfigs: FormFieldConfigs = {
    targetId: {
        label: 'Target',
        autoCompleter: {
            searchBaseUrl: '/api/targets',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    snvLibCloningExperimentId: {
        label: 'SNV Library Cloning Experiment',
        autoCompleter: {
            searchBaseUrl: '/api/snv-lib-cloning-experiments',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    volume: {
        label: 'Volume (µL)',
    },
    quant: {
        label: 'Quant (ng/µL)',
    },
}
const goldenGateProductFieldConfigs: FormFieldConfigs = {
    snvLibCloningExperimentId: {
        label: 'SNV Library Cloning Experiment',
        autoCompleter: {
            searchBaseUrl: '/api/snv-lib-cloning-experiments',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    snvLibAmpProductId: {
        label: 'AMP Product',
        autoCompleter: {
            searchBaseUrl: '/api/snv-lib-amp-products',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    clonalHaId: {
        label: 'Clonal HA',
        autoCompleter: {
            searchBaseUrl: '/api/clonal-has',
            searchFields: ['name'],
            valueField: 'id',
            displayFields: ['name'],
            dropdown: true,
        },
    },
    goldenGateProductVectorAmount: {
        label: 'Golden Gate Product Vector Amount (ng)',
        defaultValue: 50,
    },
}

// Compute the zodSchema for the add dialog form based on the current table name
const addFormZodSchema = computed(() => {
    switch (addFormTableName.value) {
        case 'snv-lib-amp-products': return schemas.snvLibAmpProducts.insert
        case 'snv-lib-lin-products': return schemas.snvLibLinProducts.insert
        case 'snv-lib-gibson-products': return schemas.snvLibGibsonProducts.insert
        case 'snv-lib-golden-gate-products': return schemas.snvLibGoldenGateProducts.insert
        case 'snv-lib-plasmids': return schemas.snvLibPlasmids.insert
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
                table-name="snv-lib-cloning-experiments"
                :zodSchema="schemas.snvLibCloningExperiments.select"
                title="SNV Library Cloning"
                :with-clause="withClause"
                :where="whereClauses"
                :column-defs="columnDefs"
                :rows-per-page-options="[10, 25, 50, 100]"
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
                submitUrl="/api/snv-lib-cloning-experiments"
                submitMethod="POST"
                :zodSchema="schemas.snvLibCloningExperiments.insert"
                :fieldConfigs="fieldConfigs"
                :readonlyValues="readonlyValues"
                @cancel="crudTable.didClickCancelAddForm"
                @record-add="crudTable.didAddRecord"
            />
            <RecordsSmartForm
                v-if="crudTable.state.editingRecordId && crudTable.state.showEditForm"
                selectUrl="/api/snv-lib-cloning-experiments"
                :recordIds="[crudTable.state.editingRecordId]"
                submitUrl="/api/snv-lib-cloning-experiments"
                submitMethod="PUT"
                :zodSchema="schemas.snvLibCloningExperiments.update"
                :can-delete="true"
                :fieldConfigs="fieldConfigs"
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
