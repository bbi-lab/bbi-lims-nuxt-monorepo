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
    geneId: z.string(), // for testing autoCompleter in array
    userId: z.string(), // for testing nestedSelect in array
}))

_.set(zodSchema, 'shape.testArray', testArraySchema) // for testing inputArray
_.set(zodSchema, 'shape.geneId', z.string()) // for testing autoCompleter
_.set(zodSchema, 'shape.userId', z.string()) // for testing nestedSelect

const fieldConfigs: Record<string, FormFieldConfig> = {
    name: {
        label: 'Plate Name',
        defaultValue: 'My Plate',
        disabled: true,
    },
    testArray: {
        inputArray: {
            fieldConfigs: {
                geneId: {
                    label: 'Gene',
                    autoCompleter: {
                        searchBaseUrl: '/api/genes',
                        searchFields: ['symbol'],
                        valueField: 'id',
                        displayFields: ['symbol'],
                        placeholderValue: 'Search for a gene...',
                        dropdown: false,
                    }
                },
                userId: {
                    label: 'User',
                    nestedSelect: {
                        parentSearchBaseUrl: '/api/user-groups',
                        parentValueField: 'id',
                        parentDisplayFields: ['name'],
                        parentIftaLabel: 'User Group',
                        parentSearchWithClause: {},
                        searchBaseUrl: '/api/users',
                        valueField: 'id',
                        displayFields: ['name', 'email'],
                        searchWithClause: {userGroupMemberships: {with: {userGroup: true}}},
                        parentKeyField: 'userGroupMemberships.*.userGroup.id',
                        placeholderValue: 'Select a user...',
                        hideClearButton: false,
                    }
                }
            }
        }
    },
    geneId: {
        label: 'Gene',
        autoCompleter: {
            searchBaseUrl: '/api/genes',
            searchFields: ['symbol'],
            valueField: 'id',
            displayFields: ['symbol'],
            placeholderValue: 'Search for a gene...',
            dropdown: false,
        }
    },
    userId: {
        label: 'User',
        nestedSelect: {
            parentSearchBaseUrl: '/api/user-groups',
            parentValueField: 'id',
            parentDisplayFields: ['name'],
            parentIftaLabel: 'User Group',
            parentSearchWithClause: {},
            searchBaseUrl: '/api/users',
            valueField: 'id',
            displayFields: ['name', 'email'],
            searchWithClause: {userGroupMemberships: {with: {userGroup: true}}},
            parentKeyField: 'userGroupMemberships.*.userGroup.id',
            placeholderValue: 'Select a user...',
            hideClearButton: false,
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
