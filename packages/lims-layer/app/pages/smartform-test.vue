<script setup lang="ts">
import { z } from 'zod'
import {schemas} from '../../shared/db/zod/zodSchemas'
import _ from 'lodash'

const zodSchema = schemas.plates.insert

// TODO: move this to a shared/utils function since it will be needed in multiple places
// When using object in ZodEnum, the keys are the actual enum values, and the values are the labels
// So we need to invert the plateTypeOptions to get the correct mapping
const plateTypeOptions = _.mapValues(appConstants.enumLookups.plates.plateType, 'label')
_.set(zodSchema, 'shape.plateType', z.enum(_.invert(plateTypeOptions)))


// testing nested array of objects with zod and smart form
const testArraySchema = z.array(z.object({
    itemName: z.string(),
    quantity: z.number(),
}))

_.set(zodSchema, 'shape.testArray', testArraySchema)
_.set(zodSchema, 'shape.geneId', z.string())

const fieldConfigs: Record<string, FormFieldConfig> = {
    name: {
        label: 'Plate Name',
        defaultValue: 'My Plate',
        disabled: true,
    },
    testArray: {
        disabled: true,
    },
    geneId: {
        label: 'Gene',
        autocompleter: {
            searchBaseUrl: '/api/genes',
            searchFields: ['symbol'],
            valueField: 'id',
            displayFields: ['symbol'],
            placeholderValue: 'Search for a gene...',
            dropdown: false,
        }
    }
}

const initialValues = ref(getBlankFormInitialValues(zodSchema, fieldConfigs))


</script>
<template>
    <div>
        <h1>Smart Form Test</h1>
        <SmartForm
            :zodSchema="zodSchema"
            :initialValues="initialValues"
            :fieldConfigs="fieldConfigs"
            submitUrl="/api/test-submit"
            requestType="POST"
            :formDebug="true"
        />
    </div>
</template>
