<script setup lang="ts">
import { z } from 'zod'
import type { FieldConfig } from '../components/SmartForm.vue'

import {schemas} from '../../shared/db/zod/zodSchemas'
import _ from 'lodash'

// const zodSchema = z.object({
//     username: z.string().min(1, { message: 'Username is required.' }),
//     password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
//     email: z.email({ message: 'Invalid email address.' }),
//     age: z.number().min(18, { message: 'Must be at least 18 years old.' }),
//     isActive: z.boolean(),
//     description: z.string().optional(),
//     nullableField: z.string().nullable(),
// })

// const initialValues = ref({
//     username: 'doh',
//     password: '',
//     email: '',
//     age: null,
//     isActive: false,
//     description: '',
//     nullableField: null,
// })

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

// TODO: move this to a utils function since it will be needed in multiple places
// will also need to handle existing populating the form with existing values for context of edit forms
const initialValues = ref({
    ..._.mapValues(schemas.plates.insert.shape, () => null),
})

const fieldConfigs: Record<string, FieldConfig> = {
    password: { label: 'Password', inputType: 'password' },
    description: { label: 'Description', inputType: 'textarea' }
}

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
