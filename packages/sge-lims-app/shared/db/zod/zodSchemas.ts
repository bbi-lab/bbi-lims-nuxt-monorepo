import { dateSchema, nullableDateSchema } from '../helpers/schemas'
import { projects } from '../schema/sge/project'
import { targets } from '../schema/sge/target'
import { genes } from '../schema/sge/gene'
import { regions } from '../schema/sge/region'
import { cycles } from '../schema/sge/cycle'
import { transfectExperiments, transfectLotUsage, transfectTargets } from '../schema/sge/transfect-experiment'
import { haCloningExperiments, sgRnaCloningExperiments, snvLibCloningExperiments } from '../schema/sge/plasmid-experiment'
import { extractionExperiments, extractionLotUsage } from '../schema/sge/extraction-experiment'
import { pcr1ExperimentMasterMixVolumes, pcr2ExperimentMasterMixVolumes, pcrExperiments } from '../schema/sge/pcr-experiment'
import { plates } from '../schema/sge/plate'
import { pellets } from '../schema/sge/pellet'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'
import { lots } from '../schema/sge/lots'
import { reagents } from '../schema/sge/reagents'
import { haPuc19Plasmids, sgRnaPlasmids, snvLibPlasmids } from '../schema/sge/plasmid'
import { dna, rna } from '../schema/sge/nucleic-acid'
import { amplificationPrimers, homologyArmPrimers, homologyArmPuc19Primers, indexPrimers, linearizationPrimers, preseq1Primers, preseq2Primers, rnaRtPrimers, rnaPreseq1Primers, rnaPreseq2Primers } from '../schema/sge/primer'
import { wellContents, wellContentSources, wells } from '../schema/sge/well'
import { sequencingRuns, sequencingRunSamples, sequencingRunExternalSamples } from '../schema/sge/sequencing-run'
import { clonalHas, haPcrProducts, haPuc19GibsonProducts, haPuc19PcrProducts, sgeOligoLots, sgeOligos, sgRnaOligos, snvLibAmpProducts, snvLibGibsonProducts, snvLibGoldenGateProducts, snvLibLinProducts } from '../schema/sge/oligos'
import { externalSamples } from '../schema/sge/external-samples'
import { viewHaPuc19GibsonProductsWithCalcs, viewSnvLibGibsonProducts, viewPlatesWithWellCounts, viewSequencingRunAllSamples } from '../schema/sge/views'

// tables
const selectProjectSchema = createSelectSchema(projects, {startedOn: nullableDateSchema})
const insertProjectSchema = selectProjectSchema.omit({id: true})
const updateProjectSchema = insertProjectSchema

const selectTargetSchema = createSelectSchema(targets)
const insertTargetSchema = selectTargetSchema.omit({id: true}).merge(
    z.object({
     skipPositions: z.bigint({ coerce: true }).array().nullable(),
     fixedEdits: z.string().refine((value) => /^g[.][0-9]+[ACGT]>[ACGT]$/.test(value ?? ""), 'HGVS format required').array().nullable()
    }
))
const updateTargetSchema = insertTargetSchema

const selectGeneSchema = createSelectSchema(genes)
const updateGeneSchema = createSelectSchema(genes, {
    startPosition: z.bigint({ coerce: true }),
    endPosition: z.bigint({ coerce: true }),
    ncbiGeneId: z.bigint({ coerce: true }),
    proteinLength: z.bigint({ coerce: true }),
}).omit({id: true}).partial()

const selectRegionSchema = createSelectSchema(regions)
const insertRegionSchema = createSelectSchema(regions, {
    ampliconStart: z.bigint({ coerce: true }).nullable(),
    ampliconEnd: z.bigint({ coerce: true }).nullable(),
    snvLibraryStart: z.bigint({ coerce: true }).nullable(),
    snvLibraryEnd: z.bigint({ coerce: true }).nullable(),
}).omit({id: true}).partial()
const updateRegionSchema = insertRegionSchema

const selectCycleSchema = createSelectSchema(cycles, {startedOn: nullableDateSchema, endedOn: nullableDateSchema})
const insertCycleSchema = selectCycleSchema.omit({id: true})
const updateCycleSchema = insertCycleSchema

const selectTransfectExperimentsSchema = createSelectSchema(transfectExperiments, {startedOn: dateSchema})
const insertTransfectExperimentsSchema = selectTransfectExperimentsSchema.omit({id: true})
const updateTransfectExperimentsSchema = insertTransfectExperimentsSchema

const selectTransfectTargetsSchema = createSelectSchema(transfectTargets)
const insertTransfectTargetsSchema = createSelectSchema(transfectTargets).omit({id: true}).partial()
const updateTransfectTargetsSchema = insertTransfectTargetsSchema

const selectTransfectLotUsageSchema = createSelectSchema(transfectLotUsage, {usageOn: nullableDateSchema})
const insertTransfectLotUsageSchema = selectTransfectLotUsageSchema.omit({id: true}).partial()
const updateTransfectLotUsageSchema = insertTransfectLotUsageSchema

const selectSgRnaCloningExperimentsSchema = createSelectSchema(sgRnaCloningExperiments, {transformedOn: nullableDateSchema})
const insertSgRnaCloningExperimentsSchema = selectSgRnaCloningExperimentsSchema.omit({id: true})
const updateSgRnaCloningExperimentsSchema = insertSgRnaCloningExperimentsSchema

const selectHaCloningExperimentsSchema = createSelectSchema(haCloningExperiments, {startedOn: nullableDateSchema})
const insertHaCloningExperimentsSchema = selectHaCloningExperimentsSchema.omit({id: true}).merge(
    z.object({
        haCloningExperimentTargets: z.object({ targetId: z.string() }).array().nonempty("Target(s) required"),
    }
))
const updateHaCloningExperimentsSchema = selectHaCloningExperimentsSchema.omit({id: true})

const selectHaPcrProductsSchema = createSelectSchema(haPcrProducts, {performedOn: nullableDateSchema})
const insertHaPcrProductsSchema = selectHaPcrProductsSchema.omit({id: true})
const updateHaPcrProductsSchema = insertHaPcrProductsSchema

const selectHaPuc19PcrProductsSchema = createSelectSchema(haPuc19PcrProducts, {cleanedOn: nullableDateSchema})
const insertHaPuc19PcrProductsSchema = selectHaPuc19PcrProductsSchema.omit({id: true})
const updateHaPuc19PcrProductsSchema = insertHaPuc19PcrProductsSchema

const selectHaPuc19GibsonProductsSchema = createSelectSchema(haPuc19GibsonProducts, {preppedOn: nullableDateSchema})
const insertHaPuc19GibsonProductsSchema = selectHaPuc19GibsonProductsSchema.omit({id: true})
const updateHaPuc19GibsonProductsSchema = insertHaPuc19GibsonProductsSchema

const selectHaPuc19PlasmidsSchema = createSelectSchema(haPuc19Plasmids, {transformedOn: nullableDateSchema, colonyPickedOn: nullableDateSchema, preppedOn: nullableDateSchema})
const insertHaPuc19PlasmidsSchema = selectHaPuc19PlasmidsSchema.omit({id: true})
const updateHaPuc19PlasmidsSchema = insertHaPuc19PlasmidsSchema

const selectClonalHasSchema = createSelectSchema(clonalHas, {orderedOn: nullableDateSchema})
const insertClonalHasSchema = selectClonalHasSchema.omit({id: true})
const updateClonalHasSchema = insertClonalHasSchema

const selectSnvLibCloningExperimentsSchema = createSelectSchema(snvLibCloningExperiments, {startedOn: nullableDateSchema, endedOn: nullableDateSchema})
const insertSnvLibCloningExperimentsSchema = selectSnvLibCloningExperimentsSchema.omit({id: true})
const updateSnvLibCloningExperimentsSchema = insertSnvLibCloningExperimentsSchema

const selectSgeOligosSchema = createSelectSchema(sgeOligos, {sequence: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable()})
const insertSgeOligosSchema = selectSgeOligosSchema.omit({id: true})
const updateSgeOligosSchema = insertSgeOligosSchema

const selectSgeOligoLotsSchema = createSelectSchema(sgeOligoLots)
const insertSgeOligoLotsSchema = selectSgeOligoLotsSchema.omit({id: true})
const updateSgeOligoLotsSchema = insertSgeOligoLotsSchema

const selectSnvLibAmpProductsSchema = createSelectSchema(snvLibAmpProducts, {cleanedOn: nullableDateSchema})
const insertSnvLibAmpProductsSchema = selectSnvLibAmpProductsSchema.omit({id: true})
const updateSnvLibAmpProductsSchema = insertSnvLibAmpProductsSchema

const selectSnvLibLinProductsSchema = createSelectSchema(snvLibLinProducts, {dpn1DigestOn: nullableDateSchema, gelExtractedOn: nullableDateSchema})
const insertSnvLibLinProductsSchema = selectSnvLibLinProductsSchema.omit({id: true})
const updateSnvLibLinProductsSchema = insertSnvLibLinProductsSchema

const selectSnvLibGibsonProductsSchema = createSelectSchema(snvLibGibsonProducts, {gibsonOn: nullableDateSchema, cleanedOn: nullableDateSchema, transformedOn: nullableDateSchema, preppedOn: nullableDateSchema, benchlingLink: z.string().regex(new RegExp(/^https?:\/\/[^\s\/$.?#].[^\s]*$/i)).nullable()})
const insertSnvLibGibsonProductsSchema = selectSnvLibGibsonProductsSchema.omit({id: true})
const updateSnvLibGibsonProductsSchema = insertSnvLibGibsonProductsSchema

const selectSnvLibGoldenGateProductsSchema = createSelectSchema(snvLibGoldenGateProducts)
const insertSnvLibGoldenGateProductsSchema = selectSnvLibGoldenGateProductsSchema.omit({id: true})
const updateSnvLibGoldenGateProductsSchema = insertSnvLibGoldenGateProductsSchema

const selectPcrExperimentsSchema = createSelectSchema(pcrExperiments, {startedOn: nullableDateSchema})
const insertPcrExperimentsSchema = selectPcrExperimentsSchema.omit({id: true})
const updatePcrExperimentsSchema = insertPcrExperimentsSchema

const pcr1ExperimentMasterMixVolumesSchema = createSelectSchema(pcr1ExperimentMasterMixVolumes)
const insertPcr1ExperimentMasterMixVolumesSchema = pcr1ExperimentMasterMixVolumesSchema.omit({id: true})
const updatePcr1ExperimentMasterMixVolumesSchema = insertPcr1ExperimentMasterMixVolumesSchema

const pcr2ExperimentMasterMixVolumesSchema = createSelectSchema(pcr2ExperimentMasterMixVolumes)
const insertPcr2ExperimentMasterMixVolumesSchema = pcr2ExperimentMasterMixVolumesSchema.omit({id: true})
const updatePcr2ExperimentMasterMixVolumesSchema = insertPcr2ExperimentMasterMixVolumesSchema

const selectExtractionExperimentsSchema = createSelectSchema(extractionExperiments, {extractedOn: nullableDateSchema})
const insertExtractionExperimentsSchema = selectExtractionExperimentsSchema.omit({id: true})
const updateExtractionExperimentsSchema = insertExtractionExperimentsSchema

const selectExtractionLotUsageSchema = createSelectSchema(extractionLotUsage, {usageOn: nullableDateSchema})
const insertExtractionLotUsageSchema = selectExtractionLotUsageSchema.omit({id: true}).partial()
const updateExtractionLotUsageSchema = insertExtractionLotUsageSchema

const selectPlatesSchema = createSelectSchema(plates)
const insertPlatesSchema = selectPlatesSchema.omit({id: true}).partial()
const updatePlatesSchema = insertPlatesSchema

const selectWellsSchema = createSelectSchema(wells)
const insertWellsSchema = selectWellsSchema.omit({id: true}).partial()
const updateWellsSchema = insertWellsSchema.omit({plateId: true, x: true, y: true})

const selectWellContentsSchema = createSelectSchema(wellContents)
const insertWellContentsSchema = selectWellContentsSchema.omit({id: true}).partial()
const updateWellContentsSchema = insertWellContentsSchema

const selectWellContentSourcesSchema = createSelectSchema(wellContentSources, {createdAt: nullableDateSchema})
const insertWellContentSourcesSchema = selectWellContentSourcesSchema.omit({id: true}).partial()
const updateWellContentSourcesSchema = insertWellContentSourcesSchema

const selectSequencingRunsSchema = createSelectSchema(sequencingRuns, {createdOn: nullableDateSchema, startedOn: nullableDateSchema, endedOn: nullableDateSchema})
const insertSequencingRunsSchema = selectSequencingRunsSchema.omit({id: true}).partial()
const updateSequencingRunsSchema = insertSequencingRunsSchema

const selectSequencingRunSamples = createSelectSchema(sequencingRunSamples, {createdAt: nullableDateSchema})
const insertSequencingRunSamples = selectSequencingRunSamples.omit({id: true, createdAt: true}).partial()
const updateSequencingRunSamples = insertSequencingRunSamples

const selectExternalSamples = createSelectSchema(externalSamples, {createdAt: nullableDateSchema})
const insertExternalSamples = createSelectSchema(externalSamples, {
    customIndexSeq1: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable().optional(),
    customIndexSeq2: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable().optional(),
    indexPrimer1Id: z.string().uuid().nullable().optional(),
    indexPrimer2Id: z.string().uuid().nullable().optional(),
}).omit({id: true, createdAt: true}).partial()
const updateExternalSamples = insertExternalSamples

const selectSequencingRunExternalSamples = createSelectSchema(sequencingRunExternalSamples, {createdAt: nullableDateSchema})
const insertSequencingRunExternalSamples = createSelectSchema(sequencingRunExternalSamples, {
    customIndexSeq1: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable(),
    customIndexSeq2: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable(),
}).omit({id: true}).partial()
const updateSequencingRunExternalSamples = insertSequencingRunExternalSamples

const selectPelletsSchema = createSelectSchema(pellets, {harvestedOn: nullableDateSchema})
const insertPelletsSchema = selectPelletsSchema.omit({id: true}).partial()
const updatePelletsSchema = insertPelletsSchema

const selectLotsSchema = createSelectSchema(lots, {preparedOn: nullableDateSchema, storedOn: nullableDateSchema, startedUseOn: nullableDateSchema, endedUseOn: nullableDateSchema, expiresOn: nullableDateSchema})
const insertLotsSchema = selectLotsSchema.omit({id: true})
const updateLotsSchema = insertLotsSchema

const selectReagentsSchema = createSelectSchema(reagents)
const insertReagentsSchema = createSelectSchema(reagents).omit({id: true})
const updateReagentsSchema = insertReagentsSchema

const selectSgRnaPlasmidsSchema = createSelectSchema(sgRnaPlasmids)
const insertSgRnaPlasmidsSchema = createSelectSchema(sgRnaPlasmids, {externalLink: z.string().regex(new RegExp(/^https?:\/\/[^\s\/$.?#].[^\s]*$/i)).nullable()}).omit({id: true})
const updateSgRnaPlasmidsSchema = insertSgRnaPlasmidsSchema

const selectSnvLibPlasmidsSchema = createSelectSchema(snvLibPlasmids)
const insertSnvLibPlasmidsSchema = createSelectSchema(snvLibPlasmids, {externalLink: z.string().regex(new RegExp(/^https?:\/\/[^\s\/$.?#].[^\s]*$/i)).nullable()}).omit({id: true})
const updateSnvLibPlasmidsSchema = insertSnvLibPlasmidsSchema

const selectSgRnaOligosSchema = createSelectSchema(sgRnaOligos)
const insertSgRnaOligosSchema = createSelectSchema(sgRnaOligos).omit({id: true})
const updateSgRnaOligosSchema = insertSgRnaOligosSchema

const selectDnaSchema = createSelectSchema(dna)
const insertDnaSchema = createSelectSchema(dna).omit({id: true}).partial()
const updateDnaSchema = insertDnaSchema

const selectRnaSchema = createSelectSchema(rna)
const insertRnaSchema = createSelectSchema(rna).omit({id: true}).partial()
const updateRnaSchema = insertRnaSchema

const selectAmplificationPrimerSchema = createSelectSchema(amplificationPrimers, {orderedOn: nullableDateSchema})
const insertAmplificationPrimerSchema = createSelectSchema(amplificationPrimers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), orderedOn: nullableDateSchema}).omit({id: true})
const updateAmplificationPrimerSchema = insertAmplificationPrimerSchema

const selectHomologyArmPrimerSchema = createSelectSchema(homologyArmPrimers, {orderedOn: nullableDateSchema})
const insertHomologyArmPrimerSchema = createSelectSchema(homologyArmPrimers, {sequence: z.string().regex(new RegExp(/^[ACGT]*$/i)), orderedOn: nullableDateSchema}).omit({id: true})
const updateHomologyArmPrimerSchema = insertHomologyArmPrimerSchema

const selectHomologyArmPuc19PrimerSchema = createSelectSchema(homologyArmPuc19Primers, {orderedOn: nullableDateSchema})
const insertHomologyArmPuc19PrimerSchema = createInsertSchema(homologyArmPuc19Primers, {sequence: z.string().regex(new RegExp(/^[ACGT]*$/i)).optional(), orderedOn: nullableDateSchema.optional()}).omit({id: true})
const updateHomologyArmPuc19PrimerSchema = insertHomologyArmPuc19PrimerSchema.partial()

const selectLinearizationPrimerSchema = createSelectSchema(linearizationPrimers, {orderedOn: nullableDateSchema})
const insertLinearizationPrimerSchema = createSelectSchema(linearizationPrimers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), orderedOn: nullableDateSchema}).omit({id: true})
const updateLinearizationPrimerSchema = insertLinearizationPrimerSchema

const selectIndexPrimerSchema = createSelectSchema(indexPrimers)
const insertIndexPrimerSchema = createInsertSchema(indexPrimers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), indexSequence: z.string().regex(new RegExp(/^[ACGT]+$/i)) }).omit({id: true})
const updateIndexPrimerSchema = insertIndexPrimerSchema

const selectpreseq1PrimerSchema = createSelectSchema(preseq1Primers, {orderedOn: nullableDateSchema})
const insertpreseq1PrimerSchema = createInsertSchema(preseq1Primers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), orderedOn: nullableDateSchema}).omit({id: true})
const updatepreseq1PrimerSchema = insertpreseq1PrimerSchema

const selectpreseq2PrimerSchema = createSelectSchema(preseq2Primers, {orderedOn: nullableDateSchema})
const insertpreseq2PrimerSchema = createInsertSchema(preseq2Primers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), adapterSequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), orderedOn: nullableDateSchema}).omit({id: true})
const updatepreseq2PrimerSchema = insertpreseq2PrimerSchema

const selectRnaRtPrimerSchema = createSelectSchema(rnaRtPrimers, {orderedOn: nullableDateSchema})
const insertRnaRtPrimerSchema = createInsertSchema(rnaRtPrimers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), orderedOn: nullableDateSchema}).omit({id: true})
const updateRnaRtPrimerSchema = insertRnaRtPrimerSchema

const selectRnaPreseq1PrimerSchema = createSelectSchema(rnaPreseq1Primers, {orderedOn: nullableDateSchema})
const insertRnaPreseq1PrimerSchema = createInsertSchema(rnaPreseq1Primers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), orderedOn: nullableDateSchema}).omit({id: true})
const updateRnaPreseq1PrimerSchema = insertRnaPreseq1PrimerSchema

const selectRnaPreseq2PrimerSchema = createSelectSchema(rnaPreseq2Primers, {orderedOn: nullableDateSchema})
const insertRnaPreseq2PrimerSchema = createInsertSchema(rnaPreseq2Primers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), adapterSequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), orderedOn: nullableDateSchema}).omit({id: true})
const updateRnaPreseq2PrimerSchema = insertRnaPreseq2PrimerSchema

// views
const selectViewPlatesWithWellCountsSchema = createSelectSchema(viewPlatesWithWellCounts)
const selectViewSequencingRunAllSamplesSchema = createSelectSchema(viewSequencingRunAllSamples)
const selectViewHaPuc19GibsonProductsWithCalcsSchema = createSelectSchema(viewHaPuc19GibsonProductsWithCalcs)
const selectViewSnvLibGibsonProductsSchema = createSelectSchema(viewSnvLibGibsonProducts)

// export all schemas
export const schemas = {
    // tables
    projects: {
        select: selectProjectSchema,
        insert: insertProjectSchema,
        update: updateProjectSchema,
    },
    targets: {
        select: selectTargetSchema,
        insert: insertTargetSchema,
        update: updateTargetSchema,
    },
    genes: {
        select: selectGeneSchema,
        update: updateGeneSchema,
    },
    regions: {
        select: selectRegionSchema,
        insert: insertRegionSchema,
        update: updateRegionSchema,
    },
    cycles: {
        select: selectCycleSchema,
        insert: insertCycleSchema,
        update: updateCycleSchema,
    },
    transfectExperiments: {
        select: selectTransfectExperimentsSchema,
        insert: insertTransfectExperimentsSchema,
        update: updateTransfectExperimentsSchema,
    },
    transfectTargets: {
        select: selectTransfectTargetsSchema,
        insert: insertTransfectTargetsSchema,
        update: updateTransfectTargetsSchema,
    },
    transfectLotUsage: {
        select: selectTransfectLotUsageSchema,
        insert: insertTransfectLotUsageSchema,
        update: updateTransfectLotUsageSchema,
    },
    sgRnaCloningExperiments: {
        select: selectSgRnaCloningExperimentsSchema,
        insert: insertSgRnaCloningExperimentsSchema,
        update: updateSgRnaCloningExperimentsSchema,
    },
    haCloningExperiments: {
        select: selectHaCloningExperimentsSchema,
        insert: insertHaCloningExperimentsSchema,
        update: updateHaCloningExperimentsSchema,
    },
    haPcrProducts: {
        select: selectHaPcrProductsSchema,
        insert: insertHaPcrProductsSchema,
        update: updateHaPcrProductsSchema,
    },
    haPuc19PcrProducts: {
        select: selectHaPuc19PcrProductsSchema,
        insert: insertHaPuc19PcrProductsSchema,
        update: updateHaPuc19PcrProductsSchema,
    },
    haPuc19GibsonProducts: {
        select: selectHaPuc19GibsonProductsSchema,
        insert: insertHaPuc19GibsonProductsSchema,
        update: updateHaPuc19GibsonProductsSchema,
    },
    haPuc19Plasmids: {
        select: selectHaPuc19PlasmidsSchema,
        insert: insertHaPuc19PlasmidsSchema,
        update: updateHaPuc19PlasmidsSchema,
    },
    clonalHas: {
        select: selectClonalHasSchema,
        insert: insertClonalHasSchema,
        update: updateClonalHasSchema,
    },
    snvLibCloningExperiments: {
        select: selectSnvLibCloningExperimentsSchema,
        insert: insertSnvLibCloningExperimentsSchema,
        update: updateSnvLibCloningExperimentsSchema,
    },
    sgeOligos: {
        select: selectSgeOligosSchema,
        insert: insertSgeOligosSchema,
        update: updateSgeOligosSchema,
    },
    sgeOligoLots: {
        select: selectSgeOligoLotsSchema,
        insert: insertSgeOligoLotsSchema,
        update: updateSgeOligoLotsSchema,
    },
    snvLibAmpProducts: {
        select: selectSnvLibAmpProductsSchema,
        insert: insertSnvLibAmpProductsSchema,
        update: updateSnvLibAmpProductsSchema,
    },
    snvLibLinProducts: {
        select: selectSnvLibLinProductsSchema,
        insert: insertSnvLibLinProductsSchema,
        update: updateSnvLibLinProductsSchema,
    },
    snvLibGibsonProducts: {
        select: selectSnvLibGibsonProductsSchema,
        insert: insertSnvLibGibsonProductsSchema,
        update: updateSnvLibGibsonProductsSchema,
    },
    snvLibGoldenGateProducts: {
        select: selectSnvLibGoldenGateProductsSchema,
        insert: insertSnvLibGoldenGateProductsSchema,
        update: updateSnvLibGoldenGateProductsSchema,
    },
    pcrExperiments: {
        select: selectPcrExperimentsSchema,
        insert: insertPcrExperimentsSchema,
        update: updatePcrExperimentsSchema,
    },
    pcr1ExperimentMasterMixVolumes: {
        select: pcr1ExperimentMasterMixVolumesSchema,
        insert: insertPcr1ExperimentMasterMixVolumesSchema,
        update: updatePcr1ExperimentMasterMixVolumesSchema,
    },
    pcr2ExperimentMasterMixVolumes: {
        select: pcr2ExperimentMasterMixVolumesSchema,
        insert: insertPcr2ExperimentMasterMixVolumesSchema,
        update: updatePcr2ExperimentMasterMixVolumesSchema,
    },
    plates: {
        select: selectPlatesSchema,
        insert: insertPlatesSchema,
        update: updatePlatesSchema,
    },
    wells: {
        select: selectWellsSchema,
        insert: insertWellsSchema,
        update: updateWellsSchema,
    },
    wellContents: {
        select: selectWellContentsSchema,
        insert: insertWellContentsSchema,
        update: updateWellContentsSchema,
    },
    wellContentSources: {
        select: selectWellContentSourcesSchema,
        insert: insertWellContentSourcesSchema,
        update: updateWellContentSourcesSchema,
    },
    sequencingRuns: {
        select: selectSequencingRunsSchema,
        insert: insertSequencingRunsSchema,
        update: updateSequencingRunsSchema,
    },
    sequencingRunSamples: {
        select: selectSequencingRunSamples,
        insert: insertSequencingRunSamples,
        update: updateSequencingRunSamples,
    },
    externalSamples: {
        select: selectExternalSamples,
        insert: insertExternalSamples,
        update: updateExternalSamples,
    },
    sequencingRunExternalSamples: {
        select: selectSequencingRunExternalSamples,
        insert: insertSequencingRunExternalSamples,
        update: updateSequencingRunExternalSamples,
    },
    extractionExperiments: {
        select: selectExtractionExperimentsSchema,
        insert: insertExtractionExperimentsSchema,
        update: updateExtractionExperimentsSchema,
    },
    extractionLotUsage: {
        select: selectExtractionLotUsageSchema,
        insert: insertExtractionLotUsageSchema,
        update: updateExtractionLotUsageSchema,
    },
    sgRnaPlasmids: {
        select: selectSgRnaPlasmidsSchema,
        insert: insertSgRnaPlasmidsSchema,
        update: updateSgRnaPlasmidsSchema,
    },
    snvLibPlasmids: {
        select: selectSnvLibPlasmidsSchema,
        insert: insertSnvLibPlasmidsSchema,
        update: updateSnvLibPlasmidsSchema,
    },
    dna: {
        select: selectDnaSchema,
        insert: insertDnaSchema,
        update: updateDnaSchema,
    },
    rna: {
        select: selectRnaSchema,
        insert: insertRnaSchema,
        update: updateRnaSchema,
    },
    sgRnaOligos: {
        select: selectSgRnaOligosSchema,
        insert: insertSgRnaOligosSchema,
        update: updateSgRnaOligosSchema,
    },
    pellets: {
        select: selectPelletsSchema,
        insert: insertPelletsSchema,
        update: updatePelletsSchema,
    },
    lots: {
        select: selectLotsSchema,
        insert: insertLotsSchema,
        update: updateLotsSchema,
    },
    reagents: {
        select: selectReagentsSchema,
        insert: insertReagentsSchema,
        update: updateReagentsSchema,
    },
    amplificationPrimers: {
        select: selectAmplificationPrimerSchema,
        insert: insertAmplificationPrimerSchema,
        update: updateAmplificationPrimerSchema,
    },
    homologyArmPrimers: {
        select: selectHomologyArmPrimerSchema,
        insert: insertHomologyArmPrimerSchema,
        update: updateHomologyArmPrimerSchema,
    },
    homologyArmPuc19Primers: {
        select: selectHomologyArmPuc19PrimerSchema,
        insert: insertHomologyArmPuc19PrimerSchema,
        update: updateHomologyArmPuc19PrimerSchema,
    },
    linearizationPrimers: {
        select: selectLinearizationPrimerSchema,
        insert: insertLinearizationPrimerSchema,
        update: updateLinearizationPrimerSchema,
    },
    indexPrimers: {
        select: selectIndexPrimerSchema,
        insert: insertIndexPrimerSchema,
        update: updateIndexPrimerSchema,
    },
    preseq1Primers: {
        select: selectpreseq1PrimerSchema,
        insert: insertpreseq1PrimerSchema,
        update: updatepreseq1PrimerSchema,
    },
    preseq2Primers: {
        select: selectpreseq2PrimerSchema,
        insert: insertpreseq2PrimerSchema,
        update: updatepreseq2PrimerSchema,
    },
    rnaRtPrimers: {
        select: selectRnaRtPrimerSchema,
        insert: insertRnaRtPrimerSchema,
        update: updateRnaRtPrimerSchema,
    },
    rnaPreseq1Primers: {
        select: selectRnaPreseq1PrimerSchema,
        insert: insertRnaPreseq1PrimerSchema,
        update: updateRnaPreseq1PrimerSchema,
    },
    rnaPreseq2Primers: {
        select: selectRnaPreseq2PrimerSchema,
        insert: insertRnaPreseq2PrimerSchema,
        update: updateRnaPreseq2PrimerSchema,
    },
    // views
    viewPlatesWithWellCounts: {
        select: selectViewPlatesWithWellCountsSchema,
    },
    viewSequencingRunAllSamples: {
        select: selectViewSequencingRunAllSamplesSchema
    },
    viewHaPuc19GibsonProductsWithCalcs: {
        select: selectViewHaPuc19GibsonProductsWithCalcsSchema
    },
    viewSnvLibGibsonProducts: {
        select: selectViewSnvLibGibsonProductsSchema
    },
}
