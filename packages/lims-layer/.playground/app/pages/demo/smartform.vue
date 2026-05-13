<script setup lang="ts">
import { z } from 'zod'
import {schemas} from '../../../../shared/db/zod/zodSchemas'

// testing nested array of objects with zod and smart form
const testArraySchema = z.array(z.object({
    itemName: z.string(),
    quantity: z.number(),
    geneId: z.string(), // for testing autoCompleter in array
    userId: z.string(), // for testing nestedSelect in array
}))

const zodSchema = schemas.plates.insert.extend({
    testArray: testArraySchema,
    geneId: z.string(),
    userId: z.string(),
})

const fieldConfigs: FormFieldConfigs = {
    name: {
        label: 'Plate Name',
        defaultValue: 'My Plate',
        disabled: true,
    },
    plateType: {
        autoCompleter: {
            searchBaseUrl: '/api/plate-types',
            valueField: 'value',
            displayFields: ['label'],
            searchFields: ['label'],
            dropdown: true,
        },
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
