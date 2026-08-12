import _ from 'lodash'
import { v4 as uuid } from 'uuid'
import { inArray } from 'drizzle-orm'
import type { z } from 'zod'
import {
    preseq1Primers,
    preseq2Primers,
    rnaPreseq1Primers,
    rnaPreseq2Primers,
    preseq1PrimerTargets,
    rnaPreseq1PrimerTargets,
    rnaPreseq2PrimerTargets,
} from '#shared/db/schema/primer'
import { schemas } from '#shared/db/zod/zodSchemas'
import { plates } from 'lims-layer/shared/db/schema/plate'
import { wellContents } from 'lims-layer/shared/db/schema/well'
import type { PgTable } from 'drizzle-orm/pg-core'

// Plate types that hold a mix of all four preseq primer types
const MIXED_PRESEQ_PLATE_TYPES = ['preseq-primer', 'preseq-primer-storage']

// Per-primer-type configuration. The "Primer Type" column on each row selects which entry applies.
// DNA/RNA PreSeq 1 are multi-target (join table) with no adapter; DNA PreSeq 2 is single-target (targetId
// on the record) with an adapter; RNA PreSeq 2 is multi-target with an adapter.
const PRIMER_TYPE_CONFIG = {
    'dna-preseq-1': {
        label: 'DNA PreSeq 1',
        table: preseq1Primers,
        zodSchema: schemas.preseq1Primers.insert,
        hasAdapter: false,
        joinTargets: { table: preseq1PrimerTargets, parentIdKey: 'preseq1PrimerId', targetIdKey: 'targetId' },
    },
    'dna-preseq-2': {
        label: 'DNA PreSeq 2',
        table: preseq2Primers,
        zodSchema: schemas.preseq2Primers.insert,
        hasAdapter: true,
        joinTargets: null,
    },
    'rna-preseq-1': {
        label: 'RNA PreSeq 1',
        table: rnaPreseq1Primers,
        zodSchema: schemas.rnaPreseq1Primers.insert,
        hasAdapter: false,
        joinTargets: { table: rnaPreseq1PrimerTargets, parentIdKey: 'rnaPreseq1PrimerId', targetIdKey: 'targetId' },
    },
    'rna-preseq-2': {
        label: 'RNA PreSeq 2',
        table: rnaPreseq2Primers,
        zodSchema: schemas.rnaPreseq2Primers.insert,
        hasAdapter: true,
        joinTargets: { table: rnaPreseq2PrimerTargets, parentIdKey: 'rnaPreseq2PrimerId', targetIdKey: 'targetId' },
    },
} as const

type PrimerTypeKey = keyof typeof PRIMER_TYPE_CONFIG

// Map a "Primer Type" cell to a config key. Accepts e.g. "DNA PreSeq 1", "dna-preseq-1", "dna preseq 1".
const normalizePrimerType = (raw: string): PrimerTypeKey | undefined => {
    const collapsed = _.toLower(_.trim(raw || '')).replace(/[^a-z0-9]/g, '')
    const map: Record<string, PrimerTypeKey> = {
        dnapreseq1: 'dna-preseq-1',
        dnapreseq2: 'dna-preseq-2',
        rnapreseq1: 'rna-preseq-1',
        rnapreseq2: 'rna-preseq-2',
    }
    return map[collapsed]
}

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        if (!Array.isArray(body) || body.length === 0) {
            throw createError({ statusCode: 400, statusMessage: 'Request body must be a non-empty array of primers.' })
        }

        const db = useSgeDrizzle()

        // 1. Resolve the primer-type for each row; reject unrecognized types
        const rows = _.map(body, (row, index) => ({ row, index, typeKey: normalizePrimerType(row.primerType) }))
        const unknownTypeRows = _.filter(rows, (r) => !r.typeKey)
        if (unknownTypeRows.length > 0) {
            const offenders = _.map(unknownTypeRows, (r) => `'${r.row.primerName || `row ${r.index + 2}`}' (got '${_.trim(r.row.primerType || '')}')`)
            throw createError({
                statusCode: 400,
                statusMessage: `Unrecognized primer type for ${offenders.join(', ')}. Valid types are: ${_.map(PRIMER_TYPE_CONFIG, 'label').join(', ')}.`,
            })
        }

        // 2. Validate and resolve all unique target names across every row
        const targetNames = _.uniq(
            // "targetNameS" (capital S) because the template header "Target Name(s)" camelCases to "targetNameS"
            _.flatMap(body, (row) => _.map(_.split(row.targetNameS || '', ','), (name) => _.trim(name)).filter(Boolean))
        )
        if (targetNames.length === 0) {
            throw createError({ statusCode: 400, statusMessage: 'No target names found in the uploaded data.' })
        }
        const targetIdsByName = await targetNamesToIdsMap(targetNames)
        const missingTargets = _.difference(targetNames, _.keys(targetIdsByName))
        if (missingTargets.length > 0) {
            throw createError({ statusCode: 400, statusMessage: `Target names not found in database: ${missingTargets.join(', ')}.` })
        }

        // 3. Build a primer record per row (explicit id so we can place it into a well after insert)
        const builtRecords = _.map(rows, ({ row, typeKey }) => {
            const config = PRIMER_TYPE_CONFIG[typeKey!]
            const targetNamesForRow = _.map(_.split(row.targetNameS || '', ','), (name) => _.trim(name)).filter(Boolean)

            const record: Record<string, any> = {
                id: uuid(),
                name: _.trim(row.primerName || ''),
                sequence: _.trim(row.sequence || ''),
                sequenceType: _.toLower(_.trim(row.forwardReverse || '')) || null,
                orderedOn: row.orderedOn ? new Date(row.orderedOn) : null,
                notes: _.trim(row.notes || ''),
            }
            if (config.hasAdapter) {
                // Template header "Adapter sequence (for PreSeq-2 primers)" camelCases to adapterSequenceForPreSeq2Primers
                record.adapterSequence = _.trim(row.adapterSequenceForPreSeq2Primers || row.adapterSequence || '')
            }
            // DNA PreSeq 2 is single-target: the target lives on the record as targetId
            if (!config.joinTargets && targetNamesForRow.length === 1) {
                record.targetId = targetIdsByName[targetNamesForRow[0]!]
            }

            return {
                config,
                record,
                targetIds: _.map(targetNamesForRow, (name) => targetIdsByName[name]).filter(Boolean) as string[],
                targetNamesForRow,
                plateName: _.trim(row.plateStorageBoxName || ''),
                wellLocation: _.trim(row.wellTubeCoordinates || ''),
            }
        })

        // 4. Plate name and well coordinate are optional, but must be provided together
        const pairingErrors = _.map(
            _.filter(builtRecords, (b) => Boolean(b.plateName) !== Boolean(b.wellLocation)),
            (b) => `Primer '${b.record.name || 'unnamed'}': provide both a plate/storage box name and a well/tube coordinate, or leave both blank.`
        )
        if (pairingErrors.length > 0) {
            throw createError({ statusCode: 400, statusMessage: pairingErrors.join(' ') })
        }

        // 5. For rows that name a plate, the plate must exist and be a PreSeq primer plate
        const plateNames = _.uniq(_.map(builtRecords, 'plateName').filter(Boolean))
        if (plateNames.length > 0) {
            const plateRecords = await db.select().from(plates).where(inArray(plates.name, plateNames))
            const platesByName = _.keyBy(plateRecords, 'name')
            const missingPlates = _.difference(plateNames, _.keys(platesByName))
            if (missingPlates.length > 0) {
                throw createError({ statusCode: 400, statusMessage: `Plate/storage box not found: ${missingPlates.join(', ')}.` })
            }
            const wrongType = _.filter(plateRecords, (p) => !MIXED_PRESEQ_PLATE_TYPES.includes(p.plateType))
            if (wrongType.length > 0) {
                throw createError({
                    statusCode: 400,
                    statusMessage: `Not a PreSeq primer plate: ${_.map(wrongType, 'name').join(', ')}. Primers can only be placed in PreSeq primer or PreSeq primer storage plates.`,
                })
            }
        }

        // 6. Record-level validation — collect every problem and report them together
        const validationErrors: string[] = []

        // Primer names are unique per table, so check for duplicates within each primer type
        _.forEach(_.groupBy(builtRecords, ({ config }) => config.label), (group, label) => {
            const dups = _.keys(_.pickBy(_.countBy(group, 'record.name'), (count) => count > 1))
            if (dups.length > 0) {
                validationErrors.push(`Duplicate ${label} primer names in file: ${dups.join(', ')}.`)
            }
        })

        _.forEach(builtRecords, ({ config, record, targetNamesForRow, wellLocation }) => {
            if (!record.name) {
                validationErrors.push('A row is missing a primer name.')
                return
            }
            const label = `Primer '${record.name}' (${config.label})`
            if (!config.joinTargets && targetNamesForRow.length !== 1) {
                validationErrors.push(`${label}: must have exactly one target (found ${targetNamesForRow.length}).`)
            }
            if (wellLocation && !/^[A-Za-z]+\d+$/.test(wellLocation)) {
                validationErrors.push(`${label}: well coordinate '${wellLocation}' is not a valid coordinate (expected a format like A1).`)
            }
            const parsed = (config.zodSchema as z.ZodTypeAny).safeParse(_.omit(record, 'id'))
            if (!parsed.success) {
                const issues = _.map(parsed.error.issues, (issue) => {
                    const fieldKey = String(issue.path[0] ?? '')
                    const fieldLabel = issue.path.length ? _.startCase(fieldKey) : 'Value'
                    // The Drizzle/Zod insert schemas validate sequence & adapterSequence against /^[ACGT]+$/i;
                    // translate the generic "Invalid" into something the user can act on.
                    if (fieldKey === 'sequence' || fieldKey === 'adapterSequence') {
                        return record[fieldKey]
                            ? `${fieldLabel} may only contain the letters A, C, G, and T`
                            : `${fieldLabel} is required`
                    }
                    if (fieldKey === 'sequenceType') {
                        return "Forward/Reverse must be 'forward' or 'reverse'"
                    }
                    return `${fieldLabel} ${_.toLower(issue.message)}`
                }).join('; ')
                validationErrors.push(`${label}: ${issues}.`)
            }
        })

        if (validationErrors.length > 0) {
            throw createError({ statusCode: 400, statusMessage: validationErrors.join('  ') })
        }

        // 7. Insert primers (grouped by table), then wire up targets and optional well placement
        const result = await db.transaction(async (tx) => {
            const inserted: any[] = []
            const groups = _.groupBy(builtRecords, ({ config }) => config.label)
            for (const group of _.values(groups)) {
                const table: PgTable<any> = group[0]!.config.table
                inserted.push(...await tx.insert(table).values(_.map(group, 'record')).returning())
            }

            for (const built of builtRecords) {
                if (built.config.joinTargets && built.targetIds.length > 0) {
                    await updateRelatedTargets(
                        built.config.joinTargets.table,
                        built.config.joinTargets.parentIdKey,
                        built.config.joinTargets.targetIdKey,
                        built.record.id as string,
                        built.targetIds,
                        tx,
                    )
                }

                if (built.plateName && built.wellLocation) {
                    const wellId = await getWellIdFromPlateNameAndWellLocation(built.plateName, built.wellLocation, tx)
                    if (await wellContentsCount(wellId, tx) > 0) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: `Well '${built.wellLocation}' in '${built.plateName}' is already occupied. Please choose a different well or empty it first.`,
                        })
                    }
                    await tx.insert(wellContents).values({ wellId, wellableId: built.record.id })
                }
            }

            return inserted
        })

        return {
            success: true,
            insertedCount: result.length,
            primers: result,
        }
    } catch (e: any) {
        const { error, data } = parsePutPostError(e)
        throw createError({
            statusCode: 400,
            statusMessage: error.message,
            data: data,
        })
    }
})
