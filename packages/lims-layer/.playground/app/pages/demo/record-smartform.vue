<script setup lang="ts">
import { schemas } from '../../../../shared/db/zod/zodSchemas'

const insertPlateSchema = schemas.plates.insert

const fieldConfigs: FormFieldConfigs = {
    name: {
        label: 'Plate Name',
    },
    plateType: {
        autoCompleter: {
            searchBaseUrl: '/api/plate-types',
            valueField: 'value',
            displayFields: ['label'],
            dropdown: true,
        },
    },
}

</script>

<template>
    <div>
        <h1>Smart Form Record Test</h1>
        <RecordsSmartForm
            submitUrl="/api/plates"
            submitMethod="POST"
            :zodSchema="insertPlateSchema"
            :fieldConfigs="fieldConfigs"
            :formDebug="true"
        />
    </div>
</template>
