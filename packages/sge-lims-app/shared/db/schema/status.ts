import { pgEnum } from 'drizzle-orm/pg-core'

// Workflow status shared by the SNVlib products, plasmids and PCR experiments.
// Declaration order is workflow order, which is also the Postgres sort order for the enum.
export const RECORD_STATUS_VALUES = [
    'not-started',
    'in-progress',
    'on-hold',
    'next-step-ready',
    'complete',
    'discarded',
] as const

export type RecordStatus = typeof RECORD_STATUS_VALUES[number]

export const recordStatusEnum = pgEnum('record_statuses', RECORD_STATUS_VALUES)
