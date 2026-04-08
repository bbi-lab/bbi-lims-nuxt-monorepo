<script setup lang="ts">
import { z } from 'zod'
import { schemas } from '../../shared/db/zod/zodSchemas'
import _ from 'lodash'

const plateTypeOptions = _.mapValues(appConstants.enumLookups.plates.plateType, 'label')
const insertPlateSchema = schemas.plates.insert.extend({ plateType: z.enum(_.invert(plateTypeOptions)) })

const fieldConfigs: Record<string, FormFieldConfig> = {
    name: {
        label: 'Plate Name',
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
